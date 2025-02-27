import { fazerLogout, verificarAutenticacao } from './auth.js';

// Verifica se o usuário está autenticado ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verifica autenticação e redireciona para login se não estiver autenticado
        const user = await verificarAutenticacao();
        console.log('Usuário autenticado:', user.email);
        
        // Carregar dados e inicializar interface do dashboard
        carregarEmpresas();
        
        // Adiciona evento de logout ao botão (se existir)
        const logoutButton = document.querySelector('#logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', fazerLogout);
        }
    } catch (error) {
        console.error('Erro de autenticação:', error);
        // Não é necessário redirecionar aqui, pois verificarAutenticacao já faz isso
    }
});

// Função para carregar empresas
async function carregarEmpresas() {
    try {
        // Se você estiver usando Electron, mantenha o código original:
        const empresas = await ipcRenderer.invoke('get-empresas');
        const grid = document.getElementById('empresasGrid');
        grid.innerHTML = ''; // Limpa o grid

        empresas.forEach(empresa => {
            const div = document.createElement('div');
            div.className = 'empresa';
            div.innerHTML = `
                <h3>${empresa.nome}</h3>
                <p>${empresa.cnpj}</p>
                <button class="btn-executar" data-cnpj="${empresa.cnpj}">Executar</button>
            `;
            grid.appendChild(div);
        });

        // Implementa a funcionalidade de busca
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll('.empresa').forEach(div => {
                const nome = div.querySelector('h3').textContent.toLowerCase();
                const cnpj = div.querySelector('p').textContent.toLowerCase();
                const shouldShow = nome.includes(searchTerm) || cnpj.includes(searchTerm);
                div.style.display = shouldShow ? 'block' : 'none';
            });
        });
    } catch (error) {
        console.error('Erro ao carregar empresas:', error);
    }
}

// Função para manter a sessão ativa
document.addEventListener('DOMContentLoaded', function() {
    // Seletor para o campo de busca
    const searchInput = document.getElementById('searchInput');
    
    // Variáveis para controle de estado
    let lastActivity = Date.now();
    let executingFunction = false;
    const inactivityPeriod = 15 * 60 * 1000; // 15 minutos em milissegundos
    
    // Lista de eventos que mostram atividade do usuário
    const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    
    // Registrar a última atividade do usuário
    function updateLastActivity() {
        lastActivity = Date.now();
    }
    
    // Adicionar os listeners de eventos para todos os tipos de atividade
    activityEvents.forEach(event => {
        document.addEventListener(event, updateLastActivity, true);
    });
    
    // Função para simular atividade (clique no campo de busca)
    function keepSessionAlive() {
        // Verificar se não há função em execução
        if (executingFunction) {
            console.log('Existe uma função em execução. Pulando ação de manter sessão.');
            return;
        }
        
        // Verificar se o usuário esteve inativo por um período considerável
        const currentTime = Date.now();
        const inactiveTime = currentTime - lastActivity;
        
        // Se o tempo de inatividade for maior que 14 minutos (antes de completar 15)
        if (inactiveTime > (inactivityPeriod - (60 * 1000))) {
            console.log('Mantendo sessão ativa devido a inatividade...');
            
            // Marcar como em execução
            executingFunction = true;
            
            try {
                // Simular um clique (ou foco) no campo de busca
                if (searchInput) {
                    // Focar no campo
                    searchInput.focus();
                    
                    // Pequena pausa e então remover o foco
                    setTimeout(() => {
                        searchInput.blur();
                        console.log('Ação para manter sessão executada com sucesso');
                        
                        // Atualizar timestamp da última atividade
                        updateLastActivity();
                        
                        // Marcar como não mais em execução
                        executingFunction = false;
                    }, 500);
                } else {
                    console.error('Elemento searchInput não encontrado!');
                    executingFunction = false;
                }
            } catch (error) {
                console.error('Erro ao tentar manter a sessão ativa:', error);
                executingFunction = false;
            }
        } else {
            console.log(`Usuário ativo. Tempo desde última atividade: ${Math.floor(inactiveTime/1000)}s`);
        }
    }
    
    // Verificar a cada minuto
    setInterval(keepSessionAlive, 60 * 1000); // Verifica a cada 1 minuto
    
    console.log('Sistema de prevenção de expiração de sessão ativado.');
});
