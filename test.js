const { chromium } = require("playwright");
const EventEmitter = require('events');

// Criando um emissor de eventos para comunicação
const automationEvents = new EventEmitter();

// Armazenamento global para status das automações
const automationStatus = {};

async function pref(empresaId) {
  try {
    // Inicializa o status da automação
    updateAutomationStatus(empresaId, 'iniciando', 'Iniciando automação...');
    
    const browser = await chromium.launch({
      headless: true, // Mantém headless para funcionar no Render
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    updateAutomationStatus(empresaId, 'em_progresso', 'Navegador iniciado');
    
    const page = await browser.newPage();
    
    // Configurar para permitir downloads
    const downloadPath = './downloads';
    const client = await page.context().newCDPSession(page);
    await client.send('Browser.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadPath
    });
    
    // Configurando manipuladores de eventos para capturar diálogos
    page.on('dialog', async dialog => {
      const message = dialog.message();
      updateAutomationStatus(empresaId, 'alerta', message);
      console.log(`Diálogo detectado: ${message}`);
      await dialog.accept();
    });
    
    // Interceptando console logs para enviar como alertas
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        updateAutomationStatus(empresaId, 'alerta', `Console ${msg.type()}: ${msg.text()}`);
      }
    });
    
    updateAutomationStatus(empresaId, 'em_progresso', 'Acessando o portal da prefeitura');
    
    await page.goto("https://www.gp.srv.br/tributario/sinop/portal_login?1");
    await page.waitForLoadState("networkidle");
    await page.waitForLoadState("domcontentloaded");
    
    updateAutomationStatus(empresaId, 'em_progresso', 'Preenchendo credenciais');
    
    // Preenchendo credenciais
    await page.fill("#vUSUARIO_LOGIN", empresaId);
    await page.fill("#vUSUARIO_SENHA", "923m5koq5");
    
    updateAutomationStatus(empresaId, 'em_progresso', 'Realizando login');
    
    await page.click("#BTN_ENTER3");
    
    // Verificando se o login foi bem-sucedido
    try {
      await page.waitForSelector("#TB_TITULO", { state: "visible", timeout: 10000 });
      updateAutomationStatus(empresaId, 'em_progresso', 'Login realizado com sucesso');
    } catch (error) {
      // Verifica se há mensagem de erro de login
      const errorElement = await page.$(".gx_ev");
      if (errorElement) {
        const errorText = await errorElement.textContent();
        updateAutomationStatus(empresaId, 'erro', `Erro no login: ${errorText}`);
        await browser.close();
        return { success: false, error: errorText };
      } else {
        updateAutomationStatus(empresaId, 'erro', 'Timeout no login. Verifique as credenciais.');
        await browser.close();
        return { success: false, error: 'Timeout no login' };
      }
    }

    updateAutomationStatus(empresaId, 'em_progresso', 'Ajustando exibição para 120 itens');
    
    // Seleciona a opção "120" para exibir mais itens
    const selectElement = await page.$("#vPAGESIZE");
    await selectElement.selectOption({ label: "120" });
    
    // Aguarda o carregamento da tabela
    updateAutomationStatus(empresaId, 'em_progresso', 'Carregando lista de documentos');
    await page.waitForSelector(".Form.gx-masked", { state: "visible" });
    await page.waitForSelector(".Form.gx-masked", { state: "hidden" });
    
    updateAutomationStatus(empresaId, 'em_progresso', 'Iniciando download dos documentos');
    
    // Exemplo: contar documentos disponíveis
    const documentLinks = await page.$$('a[href*=".pdf"], a[href*=".zip"], a[href*=".rar"], a[href*=".xls"]');
    
    if (documentLinks.length === 0) {
      updateAutomationStatus(empresaId, 'alerta', 'Nenhum documento encontrado para download');
    } else {
      updateAutomationStatus(empresaId, 'em_progresso', `Encontrados ${documentLinks.length} documentos para download`);
      
      // Fazendo download dos documentos
      let successCount = 0;
      for (let i = 0; i < documentLinks.length; i++) {
        try {
          const link = documentLinks[i];
          const linkText = await link.textContent();
          
          updateAutomationStatus(empresaId, 'em_progresso', `Baixando documento ${i+1}/${documentLinks.length}: ${linkText}`);
          
          // Baixando o arquivo
          const [download] = await Promise.all([
            page.waitForEvent('download'),
            link.click()
          ]);
          
          const fileName = download.suggestedFilename();
          await download.saveAs(`${downloadPath}/${fileName}`);
          
          updateAutomationStatus(empresaId, 'alerta', `Arquivo baixado com sucesso: ${fileName}`);
          successCount++;
        } catch (err) {
          updateAutomationStatus(empresaId, 'alerta', `Erro ao baixar documento ${i+1}: ${err.message}`);
        }
      }
      
      updateAutomationStatus(empresaId, 'em_progresso', `Downloads concluídos. ${successCount} de ${documentLinks.length} arquivos baixados com sucesso.`);
    }
    
    // Fechando o navegador
    await browser.close();
    updateAutomationStatus(empresaId, 'concluido', 'Automação concluída com sucesso');
    
    return { 
      success: true, 
      message: "Automação concluída com sucesso",
      downloadedFiles: automationStatus[empresaId].downloadedFiles || []
    };
  } catch (error) {
    console.error("Ocorreu um erro:", error);
    updateAutomationStatus(empresaId, 'erro', `Erro na automação: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Função para atualizar o status da automação
function updateAutomationStatus(empresaId, status, message) {
  // Inicializa o registro se não existir
  if (!automationStatus[empresaId]) {
    automationStatus[empresaId] = {
      status: 'iniciando',
      messages: [],
      alerts: [],
      downloadedFiles: [],
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    };
  }
  
  // Atualiza o registro
  automationStatus[empresaId].status = status;
  automationStatus[empresaId].lastUpdate = new Date().toISOString();
  automationStatus[empresaId].messages.push({
    time: new Date().toISOString(),
    message: message
  });
  
  // Adiciona aos alertas se for um alerta
  if (status === 'alerta') {
    automationStatus[empresaId].alerts.push({
      time: new Date().toISOString(),
      message: message
    });
  }
  
  // Se for um download concluído, adiciona ao registro de arquivos
  if (message.includes('Arquivo baixado com sucesso:')) {
    const fileName = message.split(': ')[1];
    automationStatus[empresaId].downloadedFiles.push({
      fileName,
      downloadTime: new Date().toISOString()
    });
  }
  
  // Emite evento para que o servidor possa notificar os clientes
  automationEvents.emit('statusUpdate', {
    empresaId,
    status,
    message,
    timestamp: new Date().toISOString()
  });
  
  // Log no console para debug
  console.log(`[${empresaId}] ${status}: ${message}`);
}

// Função para obter o status atual de uma automação
function getAutomationStatus(empresaId) {
  return automationStatus[empresaId] || { 
    status: 'nao_iniciado', 
    messages: [], 
    alerts: [],
    downloadedFiles: []
  };
}

module.exports = { 
  pref,
  automationEvents,
  getAutomationStatus 
};
