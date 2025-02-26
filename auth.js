// auth.js
const { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    setPersistence, 
    browserLocalPersistence, 
    browserSessionPersistence,
    inMemoryPersistence
  } = require('firebase/auth');
  const { initializeApp } = require('firebase/app');
  const { ipcRenderer } = require('electron');
  
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
  
  // Função para salvar dados de autenticação localmente no Electron
  function saveAuthData(user, keepLoggedIn) {
    if (keepLoggedIn && user) {
      const userData = {
        uid: user.uid,
        email: user.email,
        refreshToken: user.refreshToken
      };
      localStorage.setItem('authUser', JSON.stringify(userData));
      console.log('Dados de autenticação salvos localmente');
    }
  }
  
  // Função para verificar dados de autenticação salvos
  function checkSavedAuth() {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
      console.log('Encontrados dados de autenticação salvos localmente');
      return JSON.parse(savedUser);
    }
    return null;
  }
  
  document.addEventListener('DOMContentLoaded', () => {
      const signUpForm = document.querySelector('.sign-up form');
      const signInForm = document.querySelector('.sign-in form');
  
      // Se houver dados salvos, usá-los para autenticação automática
      const savedUser = checkSavedAuth();
      if (savedUser) {
        console.log('Tentando autenticar com dados salvos');
        // Verificação já será feita pelo onAuthStateChanged
      }
  
      if (signUpForm) {
          signUpForm.addEventListener('submit', (e) => {
              e.preventDefault();
              
              const email = signUpForm.querySelector('input[type="email"]').value;
              const password = signUpForm.querySelector('input[type="password"]').value;
              
              createUserWithEmailAndPassword(auth, email, password)
                  .then((userCredential) => {
                      const user = userCredential.user;
                      alert('Usuário cadastrado com sucesso!');
                      signUpForm.reset();
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
      }
  
      if (signInForm) {
          signInForm.addEventListener('submit', (e) => {
              e.preventDefault();
              
              const email = signInForm.querySelector('input[type="email"]').value;
              const password = signInForm.querySelector('input[type="password"]').value;
              const keepLoggedIn = document.getElementById('keepLoggedIn') ? document.getElementById('keepLoggedIn').checked : false;
              
              // Usando persistência local do Firebase + nossa própria persistência
              const persistenceType = keepLoggedIn ? browserLocalPersistence : browserSessionPersistence;
              
              setPersistence(auth, persistenceType)
                  .then(() => {
                      return signInWithEmailAndPassword(auth, email, password);
                  })
                  .then((userCredential) => {
                      const user = userCredential.user;
                      console.log('Login realizado com sucesso!');
                      
                      // Salvar dados do usuário se manter conectado estiver marcado
                      if (keepLoggedIn) {
                          saveAuthData(user, keepLoggedIn);
                      }
                      
                      window.location.href = "dashboard.html";
                  })
                  .catch((error) => {
                      console.error("Erro de login:", error.code, error.message);
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
                              errorMessage = 'Ocorreu um erro ao fazer login: ' + error.message;
                      }
                      alert(errorMessage);
                  });
          });
      }
  
      // Verificar estado de autenticação
      onAuthStateChanged(auth, (user) => {
          const currentPage = window.location.pathname.split('/').pop();
          
          if (user) {
              console.log('Usuário logado:', user.email);
              
              // Se estiver na página de login e estiver autenticado, redireciona para dashboard
              if (currentPage === 'index.html' || currentPage === '') {
                  window.location.href = "dashboard.html";
              }
          } else {
              console.log('Usuário deslogado');
              
              // Tentar usar dados salvos localmente para login automático
              const savedUser = checkSavedAuth();
              if (savedUser && (currentPage === 'index.html' || currentPage === '')) {
                  console.log('Tentando login automático com dados salvos');
                  // Você poderia implementar um método para fazer login com o token
                  // Esta é uma solução simplificada
                  // Na prática, você precisaria usar funções específicas do Firebase para reautenticar
              } else if (currentPage === 'dashboard.html') {
                  // Se não houver usuário autenticado nem dados salvos, redireciona para login
                  window.location.href = "index.html";
                  localStorage.removeItem('authUser'); // Limpar dados salvos que possam estar inválidos
              }
          }
      });
  });
  
  // Função para fazer logout
  function fazerLogout() {
    auth.signOut()
      .then(() => {
        localStorage.removeItem('authUser');
        window.location.href = 'index.html';
      })
      .catch((error) => {
        console.error('Erro ao fazer logout:', error);
      });
  }
  
  // Exportações
  module.exports = { 
    auth,
    fazerLogout
  };