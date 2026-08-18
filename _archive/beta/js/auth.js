// js/auth.js — Módulo de autenticação Firebase

const AuthModule = (() => {

  let currentUser = null;
  let authStateListener = null;

  // Inicializar listener de estado
  const init = () => {
    return new Promise((resolve) => {
      try {
        firebase.auth().onAuthStateChanged((user) => {
          currentUser = user;
          if (authStateListener) authStateListener(user);
          resolve(user);
        });
      } catch (error) {
        console.error('[AuthModule] Erro ao inicializar:', error);
        resolve(null);
      }
    });
  };

  // Login com email/senha
  const login = async (email, password) => {
    try {
      if (!Validators.email(email)) throw new Error('Email inválido');
      if (!Validators.password(password)) throw new Error('Senha deve ter no mínimo 6 caracteres');

      const result = await firebase.auth().signInWithEmailAndPassword(email, password);
      currentUser = result.user;
      return { uid: currentUser.uid, email: currentUser.email };
    } catch (error) {
      console.error('[AuthModule] Erro no login:', error);
      throw error;
    }
  };

  // Registrar novo usuário
  const register = async (email, password, name) => {
    try {
      if (!Validators.email(email)) throw new Error('Email inválido');
      if (!Validators.password(password)) throw new Error('Senha deve ter no mínimo 6 caracteres');
      if (!name || name.length < 2) throw new Error('Nome inválido');

      const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
      currentUser = result.user;

      // Criar profile no banco
      await firebase.database().ref(`users/${currentUser.uid}/profile`).set({
        email: Security.sanitizeInput(email),
        name: Security.sanitizeInput(name, 100),
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      });

      return { uid: currentUser.uid, email: currentUser.email };
    } catch (error) {
      console.error('[AuthModule] Erro no registro:', error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await firebase.auth().signOut();
      currentUser = null;
      return true;
    } catch (error) {
      console.error('[AuthModule] Erro no logout:', error);
      throw error;
    }
  };

  // Obter usuário atual
  const getCurrentUser = () => currentUser;

  // Obter UID do usuário atual
  const getUid = () => currentUser ? currentUser.uid : null;

  // Verificar se está logado
  const isAuthenticated = () => currentUser !== null;

  // Listener de mudanças de estado
  const onAuthChange = (callback) => {
    authStateListener = callback;
  };

  return {
    init,
    login,
    register,
    logout,
    getCurrentUser,
    getUid,
    isAuthenticated,
    onAuthChange
  };
})();
