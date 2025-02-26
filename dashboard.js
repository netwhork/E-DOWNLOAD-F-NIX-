import { fazerLogout, verificarAutenticacao } from '../auth.js';

// Verifica se o usuário está autenticado ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacao();

    // Adiciona evento de logout ao botão (se existir)
    const logoutButton = document.querySelector('#logout-button'); // Ajuste o seletor conforme seu HTML
    if (logoutButton) {
        logoutButton.addEventListener('click', fazerLogout);
    }
});