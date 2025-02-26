import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';

// Sua configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBSKZO6JqTPQIaVsuMRF_NifGvuiLT2STc",
    authDomain: "controle-usuario-64b08.firebaseapp.com",
    projectId: "controle-usuario-64b08",
    storageBucket: "controle-usuario-64b08.firebasestorage.app",
    messagingSenderId: "1005734164997",
    appId: "1:1005734164997:web:0cfa0b869178aa4b947a6c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Corrigindo as referências aos formulários - use querySelector com a classe correta
const signUpForm = document.querySelector('.sign-up form');
const signInForm = document.querySelector('.sign-in form');

// Função para redirecionar após login bem-sucedido
function redirecionarParaDashboard() {
    window.location.href = 'dashboard.html';
}

// Função para registrar novo usuário
signUpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = signUpForm.querySelector('input[type="email"]').value;
    const password = signUpForm.querySelector('input[type="password"]').value;
    
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            alert('Usuário cadastrado com sucesso!');
            signUpForm.reset();
            redirecionarParaDashboard(); // Redireciona após cadastro bem-sucedido
        })
        .catch((error) => {
            let errorMessage;
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este email já está cadastrado.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email inválido.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
                    break;
                default:
                    errorMessage = 'Ocorreu um erro ao cadastrar.';
            }
            alert(errorMessage);
        });
});

// Função para fazer login
signInForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = signInForm.querySelector('input[type="email"]').value;
    const password = signInForm.querySelector('input[type="password"]').value;
    
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            alert('Login realizado com sucesso!');
            signInForm.reset();
            redirecionarParaDashboard(); // Redireciona após login bem-sucedido
        })
        .catch((error) => {
            let errorMessage;
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Usuário não encontrado.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Senha incorreta.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email inválido.';
                    break;
                default:
                    errorMessage = 'Ocorreu um erro ao fazer login.';
            }
            alert(errorMessage);
        });
});

// Verificar estado de autenticação e exportar funções
export function verificarAutenticacao() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('Usuário logado:', user.email);
                resolve(user);
            } else {
                console.log('Usuário não está logado');
                // Redirecionar para a página de login se não estiver no login
                if (!window.location.href.includes('index.html') && 
                    !window.location.href.endsWith('/')) {
                    window.location.href = 'index.html';
                }
                reject('Usuário não autenticado');
            }
        });
    });
}

// Função para fazer logout
export function fazerLogout() {
    auth.signOut()
        .then(() => {
            console.log('Logout realizado com sucesso');
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Erro ao fazer logout:', error);
        });
}
