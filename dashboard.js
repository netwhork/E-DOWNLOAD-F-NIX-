import { fazerLogout, verificarAutenticacao } from './auth.js';

// Variável global para armazenar a conexão WebSocket
let socket;

// Verifica se o usuário está autenticado ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verifica autenticação e redireciona para login se não estiver autenticado
        const user = await verificarAutenticacao();
        console.log('Usuário autenticado:', user.email);
        
        // Inicializa WebSocket
        initializeWebSocket();
        
        // Carregar dados e inicializar interface do dashboard
        carregarEmpresas();
        setupDownloadsSection();
        setupLogsSection();
        
        // Adiciona evento de logout ao botão (se existir)
        const logoutButton = document.querySelector('#logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', fazerLogout);
        }
    } catch (error) {
        console.error('Erro de autenticação:', error);
    }
});

// Inicializa a conexão WebSocket
function initializeWebSocket() {
    // Cria a conexão com o
