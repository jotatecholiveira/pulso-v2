// login.js — Lógica de login

(function() {
  // Verificar se Firebase está configurado
  if (typeof firebaseConfig === 'undefined') {
    console.error('firebaseConfig não encontrado');
    return;
  }

  // Inicializar Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const auth = firebase.auth();

  // Verificar se já está logado
  auth.onAuthStateChanged(user => {
    if (user) {
      window.location.href = 'index.html';
    }
  });

  // Formulário de login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const msgEl = document.getElementById('auth-message');
      
      if (!email || !password) {
        showMsg('Preencha e-mail e senha.', 'error');
        return;
      }

      try {
        showMsg('Entrando...', 'info');
        await auth.signInWithEmailAndPassword(email, password);
        window.location.href = 'index.html';
      } catch (error) {
        showMsg(translateError(error), 'error');
      }
    });
  }

  // Botão de registro
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        showMsg('Preencha e-mail e senha.', 'error');
        return;
      }

      if (password.length < 6) {
        showMsg('Senha deve ter no mínimo 6 caracteres.', 'error');
        return;
      }

      try {
        showMsg('Criando conta...', 'info');
        await auth.createUserWithEmailAndPassword(email, password);
        window.location.href = 'index.html';
      } catch (error) {
        showMsg(translateError(error), 'error');
      }
    });
  }

  // Botão do Google
  const googleBtn = document.getElementById('googleBtn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      try {
        showMsg('Abrindo Google...', 'info');
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
        window.location.href = 'index.html';
      } catch (error) {
        showMsg(translateError(error), 'error');
      }
    });
  }

  // Funções auxiliares
  function showMsg(text, type) {
    const el = document.getElementById('auth-message');
    if (!el) return;
    el.textContent = text;
    el.className = 'auth-message ' + type;
    el.style.display = 'block';
  }

  function translateError(error) {
    const map = {
      'auth/invalid-email': 'E-mail inválido.',
      'auth/user-disabled': 'Conta desativada.',
      'auth/user-not-found': 'Nenhuma conta com este e-mail.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/weak-password': 'Senha fraca (mínimo 6 caracteres).',
      'auth/email-already-in-use': 'Este e-mail já está em uso.',
      'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
      'auth/popup-closed-by-user': 'Janela do Google fechada.',
      'auth/unauthorized-domain': 'Domínio não autorizado no Firebase.'
    };
    return map[error.code] || error.message || 'Erro desconhecido.';
  }

})();
