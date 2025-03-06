const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const { pref, automationEvents, getAutomationStatus } = require('./test.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 5500;

// Criando pasta para downloads se não existir
const downloadPath = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadPath)) {
  fs.mkdirSync(downloadPath, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Configurando Socket.IO para comunicação em tempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Quando um cliente solicita atualizações para uma empresa específica
  socket.on('subscribe', (empresaId) => {
    console.log(`Cliente ${socket.id} inscrito para atualizações da empresa ${empresaId}`);
    socket.join(`empresa-${empresaId}`);
    
    // Envia o status atual imediatamente após a inscrição
    const currentStatus = getAutomationStatus(empresaId);
    socket.emit('initialStatus', {
      empresaId,
      ...currentStatus
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Escutando eventos de atualização de status
automationEvents.on('statusUpdate', (data) => {
  // Envia atualização para todos os clientes inscritos naquela empresa
  io.to(`empresa-${data.empresaId}`).emit('statusUpdate', data);
});

// Rota para disparar a automação
app.post('/api/execute-automation', async (req, res) => {
  try {
    const { empresaId } = req.body;
    if (!empresaId) {
      return res.status(400).json({ error: 'ID da empresa é obrigatório' });
    }
    
    console.log('Iniciando automação para empresa:', empresaId);
    
    // Informa ao cliente que a automação foi iniciada
    res.status(202).json({ 
      message: 'Automação iniciada. Monitore o progresso pelo dashboard.', 
      status: 'processing' 
    });
    
    // Executa a função do Playwright assincronamente
    pref(empresaId).then(result => {
      // Resultado final já foi comunicado via WebSocket
      console.log(`Automação para ${empresaId} finalizada:`, result.success ? 'Sucesso' : 'Falha');
    }).catch(error => {
      console.error(`Erro fatal na automação para ${empresaId}:`, error);
      // Emite evento de erro fatal
      automationEvents.emit('statusUpdate', {
        empresaId,
        status: 'erro',
        message: `Erro fatal: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para verificar status da automação
app.get('/api/automation-status/:empresaId', (req, res) => {
  const { empresaId } = req.params;
  const status = getAutomationStatus(empresaId);
  res.json({ empresaId, ...status });
});

// Rota para listar arquivos baixados
app.get('/api/downloads', (req, res) => {
  try {
    const files = fs.readdirSync(downloadPath).map(file => {
      return {
        name: file,
        url: `/downloads/${file}`,
        size: fs.statSync(path.join(downloadPath, file)).size,
        date: fs.statSync(path.join(downloadPath, file)).mtime
      };
    });
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar arquivos' });
  }
});

// Rota para verificar se o servidor está funcionando
app.get('/api/status', (req, res) => {
  res.json({ status: 'online' });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`WebSocket configurado para comunicação em tempo real`);
});
