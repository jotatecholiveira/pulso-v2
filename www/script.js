// ============================================================
// PULSO — Orçamento Familiar Compartilhado
// v2.0 — Script consolidado e limpo
// ============================================================

// 1. CONFIGURAÇÃO FIREBASE (única fonte de verdade — API key é pública por design)
const firebaseConfig = {
  apiKey: "AIzaSyC9wJ371-nfGGHjRK4lg21RP7MOfQbtjzY",
  authDomain: "planejamento-familiar-b3a1c.firebaseapp.com",
  databaseURL: "https://planejamento-familiar-b3a1c-default-rtdb.firebaseio.com",
  projectId: "planejamento-familiar-b3a1c",
  storageBucket: "planejamento-familiar-b3a1c.firebasestorage.app",
  messagingSenderId: "529592088910",
  appId: "1:529592088910:web:2fc607a84d6074494e861f"
};

let auth = null;
let db = null;
let firebaseAvailable = false;
let transactions = [];

const pulsoTranslations = {
  pt: {
    appName: 'Pulso',
    welcome: 'Bem-vindo ao Pulso',
    loginTagline: 'Seu dinheiro, seu controle.',
    enter: 'Entrar',
    register: 'Criar conta',
    google: 'Continuar com Google',
    or: 'ou',
    fullName: 'Nome completo',
    email: 'E-mail',
    password: 'Senha',
    createPassword: 'Crie uma senha',
    remember: 'Lembrar-me',
    forgot: 'Esqueci minha senha',
    noAccount: 'Não tem conta?',
    createNow: 'Criar agora',
    alreadyHave: 'Já tem conta?',
    loginGoogleHint: 'Conta Gmail detectada — será feito login com Google automaticamente.',
    gmailRegisterHint: 'Contas Gmail só podem ser criadas com Google. Use "Continuar com Google" acima.',
    redirectGoogle: 'Redirecionando para o Google...',
    loginGoogleBtn: 'Entrar com Google',
    emailRequired: 'Preencha o e-mail.',
    passwordRequired: 'Preencha a senha.',
    emailReset: 'Digite seu e-mail primeiro para redefinir a senha.',
    resetSent: 'E-mail de redefinição enviado para ',
    passwordsMin: 'Senha precisa de no mínimo 6 caracteres.',
    createAccount: 'Criando conta...',
    createAccountBtn: 'Criar conta',
    creating: 'Criando...',
    entering: 'Entrando...',
    logout: 'Sair',
    myAccount: 'Minha Conta',
    share: 'Compartilhar',
    balance: 'Saldo disponível',
    showHide: 'Mostrar/ocultar valores',
    dashboard: 'Dashboard',
    extract: 'Extrato',
    bankExtract: 'Extrato Bancário',
    totalIn: 'Total Entradas',
    totalOut: 'Total Saídas',
    periodBalance: 'Saldo do Período',
    all: 'Todos',
    income: 'Entradas',
    expense: 'Saídas',
    searchPlaceholder: 'Buscar por descrição...',
    allCategories: 'Todas as categorias',
    allUsers: 'Todos os usuários',
    newExpense: 'Nova Despesa',
    newIncome: 'Nova Receita',
    privacy: 'Privacidade',
    encrypted: 'Criptografado',
    https: 'HTTPS',
    language: 'Idioma',
    greetingNight: 'Boa noite',
    greetingMorning: 'Bom dia',
    greetingAfternoon: 'Boa tarde',
    greetingEvening: 'Boa noite'
  },
  en: {
    appName: 'Pulso',
    welcome: 'Welcome to Pulso',
    loginTagline: 'Your money, your control.',
    enter: 'Log in',
    register: 'Create account',
    google: 'Continue with Google',
    or: 'or',
    fullName: 'Full name',
    email: 'Email',
    password: 'Password',
    createPassword: 'Create a password',
    remember: 'Remember me',
    forgot: 'Forgot password',
    noAccount: 'Don’t have an account?',
    createNow: 'Create now',
    alreadyHave: 'Already have an account?',
    loginGoogleHint: 'Gmail account detected — Google sign-in will be used automatically.',
    gmailRegisterHint: 'Gmail accounts can only be created with Google. Use "Continue with Google" above.',
    redirectGoogle: 'Redirecting to Google...',
    loginGoogleBtn: 'Log in with Google',
    emailRequired: 'Please enter your email.',
    passwordRequired: 'Please enter your password.',
    emailReset: 'Type your email first to reset your password.',
    resetSent: 'Password reset email sent to ',
    passwordsMin: 'Password must be at least 6 characters long.',
    createAccount: 'Creating account...',
    createAccountBtn: 'Create account',
    creating: 'Creating...',
    entering: 'Signing in...',
    logout: 'Log out',
    myAccount: 'My Account',
    share: 'Share',
    balance: 'Available balance',
    showHide: 'Show/hide values',
    dashboard: 'Dashboard',
    extract: 'Statement',
    bankExtract: 'Bank Statement',
    totalIn: 'Total Income',
    totalOut: 'Total Expenses',
    periodBalance: 'Period Balance',
    all: 'All',
    income: 'Income',
    expense: 'Expenses',
    searchPlaceholder: 'Search by description...',
    allCategories: 'All categories',
    allUsers: 'All users',
    newExpense: 'New Expense',
    newIncome: 'New Income',
    privacy: 'Privacy',
    encrypted: 'Encrypted',
    https: 'HTTPS',
    language: 'Language',
    greetingNight: 'Good evening',
    greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon',
    greetingEvening: 'Good evening'
  },
  es: {
    appName: 'Pulso',
    welcome: 'Bienvenido a Pulso',
    loginTagline: 'Tu dinero, tu control.',
    enter: 'Iniciar sesión',
    register: 'Crear cuenta',
    google: 'Continuar con Google',
    or: 'o',
    fullName: 'Nombre completo',
    email: 'Correo',
    password: 'Contraseña',
    createPassword: 'Crea una contraseña',
    remember: 'Recordarme',
    forgot: 'Olvidé mi contraseña',
    noAccount: '¿No tienes cuenta?',
    createNow: 'Crear ahora',
    alreadyHave: '¿Ya tienes cuenta?',
    loginGoogleHint: 'Cuenta de Gmail detectada: se usará el acceso con Google automáticamente.',
    gmailRegisterHint: 'Las cuentas de Gmail solo pueden crearse con Google. Usa "Continuar con Google" arriba.',
    redirectGoogle: 'Redirigiendo a Google...',
    loginGoogleBtn: 'Iniciar con Google',
    emailRequired: 'Completa tu correo.',
    passwordRequired: 'Completa tu contraseña.',
    emailReset: 'Escribe tu correo primero para restablecer la contraseña.',
    resetSent: 'Correo de restablecimiento enviado a ',
    passwordsMin: 'La contraseña debe tener al menos 6 caracteres.',
    createAccount: 'Creando cuenta...',
    createAccountBtn: 'Crear cuenta',
    creating: 'Creando...',
    entering: 'Iniciando sesión...',
    logout: 'Cerrar sesión',
    myAccount: 'Mi cuenta',
    share: 'Compartir',
    balance: 'Saldo disponible',
    showHide: 'Mostrar/ocultar valores',
    dashboard: 'Panel',
    extract: 'Extracto',
    bankExtract: 'Extracto bancario',
    totalIn: 'Total entradas',
    totalOut: 'Total salidas',
    periodBalance: 'Saldo del período',
    all: 'Todos',
    income: 'Entradas',
    expense: 'Salidas',
    searchPlaceholder: 'Buscar por descripción...',
    allCategories: 'Todas las categorías',
    allUsers: 'Todos los usuarios',
    newExpense: 'Nuevo gasto',
    newIncome: 'Nuevo ingreso',
    privacy: 'Privacidad',
    encrypted: 'Cifrado',
    https: 'HTTPS',
    language: 'Idioma',
    greetingNight: 'Buenas noches',
    greetingMorning: 'Buenos días',
    greetingAfternoon: 'Buenas tardes',
    greetingEvening: 'Buenas noches'
  }
};

window.PulsoI18n = {
  locale: 'pt',
  dictionary: pulsoTranslations,
  getPreferredLanguage() {
    const stored = localStorage.getItem('pulso-lang');
    if (stored && pulsoTranslations[stored]) return stored;
    const browserLang = (navigator.language || 'pt').toLowerCase();
    const match = Object.keys(pulsoTranslations).find(key => browserLang.startsWith(key));
    return match || 'pt';
  },
  t(key, fallback = '') {
    const lang = this.dictionary[this.locale] ? this.locale : 'pt';
    return this.dictionary[lang][key] || fallback || key;
  },
  setLanguage(lang) {
    if (!pulsoTranslations[lang]) return this.locale;
    this.locale = lang;
    localStorage.setItem('pulso-lang', lang);
    this.apply();
    return lang;
  },
  apply() {
    const lang = this.locale || this.getPreferredLanguage();
    this.locale = pulsoTranslations[lang] ? lang : 'pt';
    document.documentElement.lang = this.locale;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const value = this.dictionary[this.locale][key];
      if (!value) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.type === 'submit' || el.type === 'button') {
          el.value = value;
        } else {
          el.placeholder = value;
        }
      } else {
        el.textContent = value;
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      const value = this.dictionary[this.locale][key];
      if (value) el.setAttribute('placeholder', value);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.dataset.i18nAria;
      const value = this.dictionary[this.locale][key];
      if (value) el.setAttribute('aria-label', value);
    });
    const select = document.getElementById('languageSelect');
    if (select) select.value = this.locale;
    const topbarGreeting = document.getElementById('topbar-greeting');
    if (topbarGreeting) {
      const hour = new Date().getHours();
      const greetingKey = hour < 12 ? 'greetingMorning' : hour < 18 ? 'greetingAfternoon' : 'greetingNight';
      topbarGreeting.textContent = this.dictionary[this.locale][greetingKey] || this.dictionary[this.locale].greetingNight;
    }
    updateLanguageSwitchButton();
  }
};
window.PulsoI18n.locale = window.PulsoI18n.getPreferredLanguage();
updateKofiVisibility();

const languageCycleOrder = ['pt', 'en', 'es'];

function getLanguageMeta(locale) {
  const labels = { pt: 'Português (Brasil)', en: 'English', es: 'Español' };
  const flags = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸' };
  return {
    label: labels[locale] || 'Português (Brasil)',
    flag: flags[locale] || '🇧🇷'
  };
}

function updateLanguageSwitchButton() {
  const button = document.getElementById('languageSwitchBtn');
  if (!button) return;
  const locale = window.PulsoI18n && window.PulsoI18n.locale ? window.PulsoI18n.locale : 'pt';
  const { flag, label } = getLanguageMeta(locale);
  const flagEl = button.querySelector('.language-flag');
  if (flagEl) flagEl.textContent = flag;
  button.setAttribute('aria-label', `Idioma atual: ${label}`);
  button.setAttribute('title', `Idioma atual: ${label}`);
}

function updateKofiVisibility() {
  const kofiBtn = document.getElementById('kofiBtn');
  if (!kofiBtn) return;
  const locale = window.PulsoI18n && window.PulsoI18n.locale ? window.PulsoI18n.locale : 'pt';
  kofiBtn.style.display = locale === 'pt' ? 'none' : '';
}

function cycleLanguage() {
  const locale = window.PulsoI18n && window.PulsoI18n.locale ? window.PulsoI18n.locale : 'pt';
  const currentIndex = languageCycleOrder.indexOf(locale);
  const nextLocale = languageCycleOrder[(currentIndex + 1) % languageCycleOrder.length];
  if (window.PulsoI18n && typeof window.PulsoI18n.setLanguage === 'function') {
    window.PulsoI18n.setLanguage(nextLocale);
  }
  updateLanguageSwitchButton();
  updateKofiVisibility();
}

const languageSwitchBtn = document.getElementById('languageSwitchBtn');
if (languageSwitchBtn) {
  languageSwitchBtn.addEventListener('click', cycleLanguage);
}

let currentFilter = 'all';
let currentUser = null;
let storageMode = 'local';
let dbListener = null;
let planoListener = null;
let connectionListener = null;
let contasListener = null;
let cartoesListener = null;
let contasPagarListener = null;
let contasReceberListener = null;
let planoCache = null;

function detachRtdbListener() {
  [dbListener, planoListener, connectionListener, contasListener, cartoesListener, contasPagarListener, contasReceberListener].forEach(l => {
    if (l) { try { l.off('value'); } catch (e) {} }
  });
  dbListener = planoListener = connectionListener = null;
  contasListener = cartoesListener = contasPagarListener = contasReceberListener = null;
}

try {
  if (window.firebase) {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    if (auth && typeof auth.setPersistence === 'function') {
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
    }
    db = firebase.database();
    firebaseAvailable = true;
  }
} catch (error) {
  console.warn('Firebase indisponível, usando modo local.', error);
}

// 2. PROTEÇÃO XSS
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

// Defesa em profundidade: use setHTML() sempre que for inserir HTML derivado
// de dados do usuário. Aplica DOMPurify quando disponível (carregado via CDN)
// e cai para escapeHTML() como fallback. Combine com eslint-plugin-no-unsanitized.
function setHTML(el, str) {
  if (!el) return;
  const sanitized = (window.DOMPurify ? DOMPurify.sanitize(String(str ?? '')) : escapeHTML(str));
  el.innerHTML = sanitized;
}

// Sanitiza uma string que será interpolada dentro de um template innerHTML maior.
function safe(str) {
  return window.DOMPurify ? DOMPurify.sanitize(String(str ?? '')) : escapeHTML(str);
}

// 3. TOAST NOTIFICATION SYSTEM
function showToast(message, type = 'info', duration = 3000) {
  const existing = document.querySelectorAll('.toast-notification');
  existing.forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'toast-notification toast-' + type;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  toast.innerHTML = '<span class="toast-icon">' + (icons[type] || icons.info) + '</span><span class="toast-msg">' + escapeHTML(message) + '</span>';

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// 4. TEMA
function getStoredTheme() { return localStorage.getItem('pulso-theme') || 'dark'; }
function applyTheme(theme) {
  const isLight = theme === 'light';
  document.body.classList.toggle('light-theme', isLight);
  document.body.classList.toggle('dark', !isLight);
  document.body.classList.toggle('dark-mode', !isLight);
  const legacyToggle = document.getElementById('themeToggle');
  if (legacyToggle) legacyToggle.textContent = isLight ? '☀️' : '🌙';
  const pill = document.getElementById('themePill');
  if (pill) {
    pill.dataset.theme = theme;
    pill.setAttribute('aria-checked', isLight);
  }
}
function setTheme(theme) {
  localStorage.setItem('pulso-theme', theme);
  applyTheme(theme);
}
// Legacy toggle (emoji)
const legacyToggle = document.getElementById('themeToggle');
if (legacyToggle) {
  legacyToggle.addEventListener('click', () => {
    const next = document.body.classList.contains('light-theme') ? 'dark' : 'light';
    setTheme(next);
  });
}
// New pill toggle (visual sky/moon)
const pill = document.getElementById('themePill');
if (pill) {
  function togglePillTheme() {
    const next = pill.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }
  pill.addEventListener('click', togglePillTheme);
  pill.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePillTheme();
    }
  });
}
// Cross-tab sync
window.addEventListener('storage', (e) => {
  if (e.key === 'pulso-theme' && e.newValue) applyTheme(e.newValue);
});
applyTheme(getStoredTheme());

// 5. CHAVES DE ARMAZENAMENTO
function currentUid() { return currentUser ? currentUser.uid : null; }
function storageKey() { return 'pulso_transactions_' + (currentUid() || 'anonymous'); }

// 5b. PERFIL DO USUÁRIO (localStorage)
function saveProfileToStorage(displayName, photoURL) {
  const profile = { displayName: displayName || 'Usuário', photoURL: photoURL || 'icon:fa-user' };
  localStorage.setItem(storageKey() + '_profile', JSON.stringify(profile));
}

function loadProfileFromStorage() {
  try {
    const cached = localStorage.getItem(storageKey() + '_profile');
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return null;
}

// 6. CAMADA DE DADOS
function sanitize(t) {
  return {
    id: t.id ?? Date.now() + Math.random(),
    type: t.type === 'entrada' ? 'entrada' : 'saida',
    user: String(t.user || 'Compartilhado').slice(0, 60),
    desc: String(t.desc || '').slice(0, 200),
    val: Math.max(0, parseFloat(t.val) || 0),
    cat: String(t.cat || 'Outros').slice(0, 60),
    date: t.date || new Date().toISOString(),
    parcela: t.parcela || null,
    totalParcelas: t.totalParcelas || null,
    paymentMethod: t.paymentMethod === 'credito' ? 'credito' : 'debito',
    cardName: String(t.cardName || '').slice(0, 80),
    dueDay: Math.min(31, Math.max(1, parseInt(t.dueDay, 10) || 0)) || null
  };
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(storageKey());
    transactions = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(transactions)) transactions = [];
  } catch (e) {
    transactions = [];
  }
}

function saveToLocal() {
  localStorage.setItem(storageKey(), JSON.stringify(transactions));
}

function snapshotToArray(snapVal) {
  if (!snapVal) return [];
  let arr;
  if (Array.isArray(snapVal)) arr = snapVal;
  else arr = Object.keys(snapVal).map(key => ({ ...snapVal[key], key }));
  const seen = new Set();
  return arr.map(item => ({ ...sanitize(item), key: item?.key })).filter(o => {
    const id = o.key || o.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function setStatus(mode, text) {
  const el = document.getElementById('connection-status');
  if (el) { el.textContent = text; el.className = 'status-chip ' + mode; }
}

function updateStatusBadge() {
  const isOnline = navigator.onLine;
  if (storageMode === 'rtdb') {
    setStatus(isOnline ? 'online' : 'offline', isOnline ? 'Sincronizado' : 'Offline');
  } else {
    setStatus('local', 'Modo local');
  }
}
window.addEventListener('online', updateStatusBadge);
window.addEventListener('offline', updateStatusBadge);

function migrateLegacyToRtdb(uid) {
  if (localStorage.getItem(storageKey())) return;
  let legacy = null;
  try { legacy = JSON.parse(localStorage.getItem('transactions')); } catch (e) { return; }
  if (!Array.isArray(legacy) || legacy.length === 0) return;
  const ref = db.ref('users/' + uid + '/transactions');
  legacy.forEach(t => ref.push().set(sanitize(t)));
  localStorage.setItem(storageKey(), JSON.stringify(legacy));
}

function fallbackToLocal(msg) {
  storageMode = 'local';
  hideAuthLoader();
  detachRtdbListener();
  loadFromLocal();
  loadPlanoFromCache();
  setStatus('local', msg || 'Modo local');
  updateUI();
}

function loadPlanoFromCache() {
  try { planoCache = JSON.parse(localStorage.getItem(storageKey() + '_plano')); } catch (e) { planoCache = null; }
  renderPlano();
}

function attachRtdbListener(uid) {
  if (!db) { fallbackToLocal('Banco de dados não configurado'); return; }
  detachRtdbListener();
  try {
    storageMode = 'rtdb';
    dbListener = db.ref('users/' + uid + '/transactions');
    dbListener.on('value', snap => {
      transactions = snapshotToArray(snap.val());
      updateUI();
    }, err => {
      console.warn('Erro RTDB:', err.message);
      fallbackToLocal('Sincronização indisponível — usando modo local');
    });

    planoListener = db.ref('users/' + uid + '/planoInvestimento');
    planoListener.on('value', snap => {
      planoCache = snap.val();
      renderPlano();
    }, err => {
      console.warn('Erro ao carregar plano:', err.message);
    });

    // Listeners para novos dados
    contasListener = db.ref('users/' + uid + '/contas');
    contasListener.on('value', snap => {
      contas = snap.val() || [];
      if (!Array.isArray(contas)) contas = [];
      renderDashContas();
    });

    cartoesListener = db.ref('users/' + uid + '/cartoes');
    cartoesListener.on('value', snap => {
      cartoes = snap.val() || [];
      if (!Array.isArray(cartoes)) cartoes = [];
      renderDashCartoes();
    });

    contasPagarListener = db.ref('users/' + uid + '/contasPagar');
    contasPagarListener.on('value', snap => {
      contasPagar = snap.val() || [];
      if (!Array.isArray(contasPagar)) contasPagar = [];
      renderDashContasPagar();
    });

    contasReceberListener = db.ref('users/' + uid + '/contasReceber');
    contasReceberListener.on('value', snap => {
      contasReceber = snap.val() || [];
      if (!Array.isArray(contasReceber)) contasReceber = [];
      renderDashContasReceber();
    });

    // Indicador de conexão em tempo real
    if (connectionListener) { try { connectionListener.off('value'); } catch (e) {} }
    connectionListener = db.ref('.info/connected');
    connectionListener.on('value', s => {
      if (storageMode === 'rtdb') {
        setStatus(s.val() ? 'online' : 'offline', s.val() ? 'Sincronizado' : 'Offline');
      }
    });

    // Check if user needs onboarding
    db.ref('users/' + uid + '/profile').once('value', snap => {
      const profile = snap.val();
      // Sync Firebase profile to localStorage
      if (profile) {
        if (profile.displayName || profile.photoURL) {
          saveProfileToStorage(profile.displayName || currentUser.displayName, profile.photoURL || currentUser.photoURL);
          if (profile.displayName) currentUser.displayName = profile.displayName;
          if (profile.photoURL) currentUser.photoURL = profile.photoURL;
          renderHeaderUser();
          renderDashGreeting();
        }
        if (profile.template) {
          localStorage.setItem(storageKey() + '_template', profile.template);
        }
      }
      // Only show onboarding if NO template in Firebase AND no template in localStorage
      const localTemplate = localStorage.getItem(storageKey() + '_template');
      if ((!profile || !profile.template) && !localTemplate && !(profile && profile.onboardingDone)) {
        showOnboarding();
      }
    }).catch((e) => {
      console.warn('[Pulso] Falha ao carregar profile do Firebase:', e);
      const localTemplate = localStorage.getItem(storageKey() + '_template');
      if (!localTemplate) showOnboarding();
    });

    // Load categories from Firebase
    db.ref('users/' + uid + '/categories').once('value', snap => {
      const fbCats = snap.val();
      if (fbCats && fbCats.income && fbCats.expense) {
        customCategories.income = fbCats.income;
        customCategories.expense = fbCats.expense;
        saveCategoriesToStorage();
        updateTransactionModalCategories();
        renderCategoriesSummary();
      }
    });
  } catch (e) {
    fallbackToLocal('Banco de dados indisponível — usando modo local');
  }
}

function addTransaction(t) {
  const clean = sanitize(t);
  if (storageMode === 'rtdb' && db && currentUser) {
    const ref = db.ref('users/' + currentUser.uid + '/transactions').push();
    clean.key = ref.key;
    ref.set(clean);
    // Em modo RTDB o listener `value` é a única fonte de verdade:
    // não fazemos unshift local para evitar lançamento duplicado.
  } else {
    transactions.unshift(clean);
    saveToLocal();
  }
  updateUI();
}

function bulkReplace(final) {
  const clean = final.map(sanitize);
  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/transactions').set(clean);
  } else {
    transactions = clean;
    saveToLocal();
  }
  updateUI();
}

function deleteTransaction(id, key) {
  if (!confirm('Deseja realmente excluir este lançamento?')) return;
  if (storageMode === 'rtdb' && db && currentUser && key) {
    db.ref('users/' + currentUser.uid + '/transactions/' + key).remove();
  } else {
    transactions = transactions.filter(t => t.id !== id);
    saveToLocal();
    updateUI();
  }
}

document.addEventListener('click', function(e) {
  const txBtn = e.target.closest('.btn-delete[data-tx-id]');
  if (txBtn) {
    deleteTransaction(Number(txBtn.dataset.txId) || 0, txBtn.dataset.txKey || '');
    return;
  }
  const ativoBtn = e.target.closest('[data-remove-ativo]');
  if (ativoBtn) {
    removerAtivo(Number(ativoBtn.dataset.removeAtivo));
    return;
  }
  const invBtn = e.target.closest('[data-remove-investimento]');
  if (invBtn) {
    removerInvestimento(Number(invBtn.dataset.removeInvestimento));
    return;
  }
});

// 7. AUTENTICAÇÃO
function translateAuthError(err) {
  const map = {
    'auth/invalid-email': 'E-mail inválido. Verifique o formato.',
    'auth/user-disabled': 'Conta desativada. Contacte o suporte.',
    'auth/user-not-found': 'Nenhuma conta encontrada com este e-mail. Criar conta primeiro.',
    'auth/wrong-password': 'Senha incorreta. Tente novamente.',
    'auth/invalid-credential': 'E-mail ou senha incorretos. Se não tem conta, clique em "Criar agora".',
    'auth/weak-password': 'Senha fraca (mínimo 6 caracteres).',
    'auth/email-already-in-use': 'Este e-mail já está em uso. Faça login.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    'auth/popup-closed-by-user': 'Janela do Google fechada.',
    'auth/unauthorized-domain': 'Domínio não autorizado no Firebase.',
    'auth/network-request-failed': 'Sem conexão com a internet. Verifique sua rede.',
    'auth/operation-not-allowed': 'Este método de login não está activado no Firebase.'
  };
  const msg = map[err.code];
  if (msg) return msg;
  if (err.code && err.code.startsWith('auth/')) return 'Erro: ' + err.code.replace('auth/', '').replace(/-/g, ' ');
  return err.message || 'Erro desconhecido. Tente novamente.';
}

function setAuthMsg(text, type) {
  const el = document.getElementById('auth-message');
  if (!el) return;
  el.textContent = text;
  el.className = 'auth-msg ' + (type === 'error' ? 'error' : type === 'success' ? 'success' : 'info');
  el.style.display = 'block';
}

function isLoginPage() { return !!document.getElementById('loginForm'); }

// RATE LIMITING — proteção contra brute force
const authRateLimit = { attempts: 0, lastAttempt: 0, lockedUntil: 0 };
function checkRateLimit() {
  const now = Date.now();
  if (authRateLimit.lockedUntil > now) {
    const secs = Math.ceil((authRateLimit.lockedUntil - now) / 1000);
    return 'Conta bloqueada temporariamente. Aguarde ' + secs + 's.';
  }
  if (now - authRateLimit.lastAttempt < 2000) {
    return 'Aguarde 2 segundos entre tentativas.';
  }
  authRateLimit.lastAttempt = now;
  authRateLimit.attempts++;
  if (authRateLimit.attempts >= 5) {
    authRateLimit.lockedUntil = now + 60000;
    authRateLimit.attempts = 0;
    return 'Muitas tentativas. Conta bloqueada por 60 segundos.';
  }
  return null;
}
function resetRateLimit() { authRateLimit.attempts = 0; authRateLimit.lockedUntil = 0; }

// SESSION TIMEOUT — auto-logout após 15min de inatividade
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
let sessionTimer = null;
function resetSessionTimer() {
  if (sessionTimer) clearTimeout(sessionTimer);
  if (!currentUser) return;
  sessionTimer = setTimeout(() => {
    if (auth && auth.signOut) {
      auth.signOut().then(() => {
        showToast('Sessão expirada por inatividade.', 'info');
        setTimeout(() => { window.location.href = 'login.html'; }, 1000);
      });
    }
  }, SESSION_TIMEOUT_MS);
}
['click','keydown','scroll','mousemove','touchstart'].forEach(evt => {
  document.addEventListener(evt, resetSessionTimer, { passive: true });
});

if (isLoginPage()) {
  const loginForm = document.getElementById('loginForm');
  const googleBtn = document.getElementById('googleBtn');

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handleAuth();
    });

    const submitBtnLogin = document.getElementById('submitBtn');
    if (submitBtnLogin) {
      submitBtnLogin.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof handleAuth === 'function') handleAuth();
      });
    }

    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        if (!auth) { setAuthMsg('Sem conexão — o Firebase não carregou.', 'error'); return; }
        setAuthMsg('Conectando ao Google...', 'info');
        googleBtn.disabled = true;
        showAuthLoader();
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
          .then(() => { hideAuthLoader(); googleBtn.disabled = false; })
          .catch(err => {
            hideAuthLoader();
            googleBtn.disabled = false;
            if (err.code === 'auth/popup-blocked') {
              setAuthMsg('Popup bloqueado pelo navegador. Permita popups para este site.', 'error');
            } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
              setAuthMsg('Login com Google cancelado. Tente novamente quando quiser.', 'info');
            } else if (err.code === 'auth/network-request-failed') {
              setAuthMsg('Sem conexão com a internet. Verifique sua rede e tente novamente.', 'error');
            } else if (err.code === 'auth/unauthorized-domain') {
              setAuthMsg('Domínio não autorizado no Firebase. Adicione este domínio em Authentication → Settings.', 'error');
            } else if (err.code === 'auth/operation-not-allowed') {
              setAuthMsg('Login com Google não está ativo no Firebase. Habilite em Authentication → Sign-in method.', 'error');
            } else {
              setAuthMsg(translateAuthError(err), 'error');
            }
          });
      });
    }
  }

  // Navegação por teclado no formulário de login
  const emailEl = document.getElementById('email');
  const passEl = document.getElementById('password');
  if (emailEl) {
    emailEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); if (passEl) passEl.focus(); }
    });
  }
  if (passEl) {
    passEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); if (typeof handleAuth === 'function') handleAuth(); }
    });
  }
}

function showAuthLoader() {
  if (document.getElementById('auth-loader')) return;
  const overlay = document.createElement('div');
  overlay.id = 'auth-loader';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0b1220;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;transition:opacity .4s';
  overlay.innerHTML = '<div class="brand-mark" style="width:64px;height:64px;font-size:28px;border-radius:20px;display:flex;align-items:center;justify-content:center;background:var(--accent-primary,#6c7cff);color:#fff;font-weight:700;animation:pulse 1.5s ease-in-out infinite">P</div><p style="color:var(--text-secondary,#94a3b8);font-size:14px;letter-spacing:.5px">Verificando acesso...</p><style>@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:.8}}</style>';
  document.body.appendChild(overlay);
  // Proteção: nunca deixa o loader travado (tela em branco) se algo falhar
  if (window.__authLoaderSafety) clearTimeout(window.__authLoaderSafety);
  window.__authLoaderSafety = setTimeout(() => {
    const el = document.getElementById('auth-loader');
    if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }
  }, 8000);
}
function hideAuthLoader() {
  if (window.__authLoaderSafety) { clearTimeout(window.__authLoaderSafety); window.__authLoaderSafety = null; }
  const el = document.getElementById('auth-loader');
  if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }
}
if (!isLoginPage()) showAuthLoader();

if (auth) {
  let authInitialized = false;
  let authResolved = false;
  let authTimeout = null;

  auth.getRedirectResult().catch(err => {
    console.debug('getRedirectResult:', err.code || err.message);
  });

  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) authResolved = true;
    if (isLoginPage()) {
      if (user) window.location.href = 'index.html';
      return;
    }
    if (!user) {
      if (!authInitialized) {
        if (authTimeout) clearTimeout(authTimeout);
        // Aguarda mais tempo para acomodar restauração lenta de sessão (ex.: login Google)
        authTimeout = setTimeout(() => {
          if (!currentUser && !authInitialized && !authResolved) {
            window.location.href = 'login.html';
          }
        }, 5000);
        return;
      }
      window.location.href = 'login.html';
      return;
    }
    if (authTimeout) clearTimeout(authTimeout);
    authInitialized = true;
    try {
      hideAuthLoader();
      renderHeaderUser();
      updateStatusBadge();
      resetSessionTimer();
      loadFromLocal();
      loadCategories();
      loadPlanoFromCache();
      loadMetasPlano();
      loadContas();
      loadCartoes();
      loadContasPagar();
      loadContasReceber();
      if (db) {
        try { migrateLegacyToRtdb(user.uid); } catch (e) {}
        attachRtdbListener(user.uid);
      } else {
        fallbackToLocal('Modo local');
      }
    } catch (err) {
      console.error('Erro ao inicializar app após login:', err);
      hideAuthLoader();
      showToast('Ocorreu um erro ao carregar o app. Tente novamente.', 'error');
    }
  });
} else {
  hideAuthLoader();
  if (isLoginPage()) {
    setAuthMsg('Sem conexão — abra uma conta com e-mail/senha após conectar ao Firebase.', 'error');
  } else {
    fallbackToLocal('Modo local (conecte-se à internet para app completo)');
    const savedProfile = loadProfileFromStorage();
    if (savedProfile) {
      currentUser = {
        uid: 'local',
        displayName: savedProfile.displayName || 'Usuário',
        photoURL: savedProfile.photoURL || 'icon:fa-user',
        email: ''
      };
    } else {
      currentUser = { uid: 'local', displayName: 'Usuário', photoURL: 'icon:fa-user', email: '' };
    }
    renderHeaderUser();
    renderDashGreeting();
  }
}

function logout() {
  if (sessionTimer) clearTimeout(sessionTimer);
  if (auth && typeof auth.signOut === 'function') {
    auth.signOut().then(() => {
      const uid = currentUser ? currentUser.uid : null;
      if (uid) {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.includes(uid)) keys.push(k);
        }
        keys.push('pulso-theme');
        keys.forEach(k => localStorage.removeItem(k));
      }
      currentUser = null;
      window.location.href = 'login.html';
    });
  } else {
    localStorage.clear();
    window.location.href = 'login.html';
  }
}

// ============================================================
// USER DROPDOWN — Toggle no clique
// ============================================================
function toggleUserDropdown() {
  const dropdown = document.getElementById('user-dropdown');
  if (!dropdown) return;
  dropdown.classList.toggle('active');
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', function(e) {
  const avatar = document.getElementById('user-avatar-header');
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown && !dropdown.contains(e.target) && !avatar?.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});

// ============================================================
// GRAVATAR — Avatar automático via email
// ============================================================
function getGravatarURL(email, size) {
  if (!email) return null;
  size = size || 200;
  // MD5 simple (for Gravatar we use a lightweight approach)
  // We'll use the Gravatar URL with a hash
  let hash = 0;
  for (let i = 0; i < email.toLowerCase().trim().length; i++) {
    const char = email.toLowerCase().trim().charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Convert to hex-like string for Gravatar
  const hex = Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
  return 'https://www.gravatar.com/avatar/' + hex + '?d=identicon&s=' + size;
}

function fetchEmailAvatar() {
  if (!currentUser || !currentUser.email) {
    showToast('Email não disponível.', 'error');
    return;
  }

  const gravatarURL = getGravatarURL(currentUser.email, 400);
  if (!gravatarURL) return;

  // Test if Gravatar has a real image (not default identicon)
  const testImg = new Image();
  testImg.onload = function() {
    // Check if it's not the default identicon by comparing dimensions
    // Gravatar returns 80x80 for default, actual images vary
    if (testImg.naturalWidth > 1 && testImg.naturalHeight > 1) {
      pendingAvatarData = gravatarURL;
      const preview = document.getElementById('avatar-preview');
      const previewIcon = document.getElementById('avatar-preview-icon');
      if (preview) {
        let img = preview.querySelector('img');
        if (!img) {
          img = document.createElement('img');
          img.alt = 'Foto de perfil';
          preview.prepend(img);
        }
        img.src = gravatarURL;
      }
      if (previewIcon) previewIcon.style.display = 'none';
    document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
      showToast('Foto importada do email!', 'success');
    } else {
      showToast('Nenhuma foto encontrada para este email.', 'info');
    }
  };
  testImg.onerror = function() {
    showToast('Erro ao buscar foto do email.', 'error');
  };
  testImg.src = gravatarURL;
}

function ensureIconElement(parent, id) {
  if (!parent) return null;
  let el = document.getElementById(id);
  if (el && el.tagName === 'I') return el;
  if (el) el.remove();
  const fresh = document.createElement('i');
  fresh.id = id;
  parent.appendChild(fresh);
  return fresh;
}

function renderHeaderUser() {
  if (!currentUser) return;

  // Firebase Auth (currentUser) is source of truth for cross-device sync
  // localStorage is fallback for offline mode only
  const displayName = currentUser.displayName || (currentUser.email || '').split('@')[0] || 'Usuário';
  const email = currentUser.email || '';
  const photoURL = currentUser.photoURL;

  const dropdownName = document.getElementById('dropdown-user-name');
  const dropdownEmail = document.getElementById('dropdown-user-email');
  const avatarHeader = document.getElementById('user-avatar-header');
  const sidebarAvatar = document.getElementById('sidebar-avatar');

  if (dropdownName) dropdownName.textContent = displayName.split(' ')[0];
  if (dropdownEmail) dropdownEmail.textContent = email;

  if (photoURL && photoURL.startsWith('icon:')) {
    const iconClass = photoURL.replace('icon:', '');
    const avatarIcon = ensureIconElement(avatarHeader, 'user-avatar-icon');
    if (avatarIcon) {
      avatarIcon.className = 'fa-solid ' + iconClass;
      avatarIcon.style.display = 'block';
    }
    const img = avatarHeader ? avatarHeader.querySelector('img') : null;
    if (img) img.remove();
    // Update sidebar
    const sidebarIcon = ensureIconElement(sidebarAvatar, 'sidebar-avatar-icon');
    if (sidebarIcon) sidebarIcon.className = 'fa-solid ' + iconClass;
    const sideImg = sidebarAvatar ? sidebarAvatar.querySelector('img') : null;
    if (sideImg) sideImg.remove();
  } else if (photoURL && avatarHeader) {
    let img = avatarHeader.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.alt = 'Foto de perfil';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:14px;';
      img.onerror = () => { img.remove(); const ic = ensureIconElement(avatarHeader,'user-avatar-icon'); if(ic){ ic.className='fa-solid fa-user'; ic.style.display='block'; } };
      avatarHeader.prepend(img);
    } else {
      img.onerror = () => { img.remove(); const ic = ensureIconElement(avatarHeader,'user-avatar-icon'); if(ic){ ic.className='fa-solid fa-user'; ic.style.display='block'; } };
    }
    img.src = photoURL;
    const avatarIcon = document.getElementById('user-avatar-icon');
    if (avatarIcon) avatarIcon.style.display = 'none';
    // Update sidebar
    let sideImg = sidebarAvatar ? sidebarAvatar.querySelector('img') : null;
    if (!sideImg && sidebarAvatar) {
      sideImg = document.createElement('img');
      sideImg.alt = 'Foto de perfil';
      sideImg.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:14px;';
      sideImg.onerror = () => { sideImg.remove(); const ic = ensureIconElement(sidebarAvatar,'sidebar-avatar-icon'); if(ic){ ic.className='fa-solid fa-user'; ic.style.display='block'; } };
      sidebarAvatar.prepend(sideImg);
    } else if (sideImg) {
      sideImg.onerror = () => { sideImg.remove(); const ic = ensureIconElement(sidebarAvatar,'sidebar-avatar-icon'); if(ic){ ic.className='fa-solid fa-user'; ic.style.display='block'; } };
    }
    if (sideImg) sideImg.src = photoURL;
    const sidebarIcon = document.getElementById('sidebar-avatar-icon');
    if (sidebarIcon) sidebarIcon.style.display = 'none';
  } else if (avatarHeader) {
    // Sem foto: garante ícone visível
    const img = avatarHeader.querySelector('img'); if (img) img.remove();
    const sideImg = sidebarAvatar ? sidebarAvatar.querySelector('img') : null; if (sideImg) sideImg.remove();
    const ic1 = ensureIconElement(avatarHeader,'user-avatar-icon'); if(ic1){ ic1.className='fa-solid fa-user'; ic1.style.display='block'; }
    const ic2 = ensureIconElement(sidebarAvatar,'sidebar-avatar-icon'); if(ic2){ ic2.className='fa-solid fa-user'; ic2.style.display='block'; }
  }
}

function openProfileModal() {
  const overlay = document.getElementById('profile-modal-overlay');
  if (!overlay) return;
  overlay.classList.add('active');

  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const previewIcon = document.getElementById('avatar-preview-icon');
  const preview = document.getElementById('avatar-preview');

  if (nameInput) {
    nameInput.value = currentUser ? (currentUser.displayName || '') : '';
  }
  if (emailInput) emailInput.value = currentUser ? (currentUser.email || '') : '';

  // Reset avatar selection
  const profilePhotoURL = currentUser && currentUser.photoURL;
  const savedIcon = profilePhotoURL && profilePhotoURL.startsWith('icon:')
    ? profilePhotoURL.replace('icon:', '') : 'fa-user';

  document.querySelectorAll('.avatar-opt').forEach(btn => {
    btn.classList.remove('selected');
    if (btn.dataset.icon === savedIcon) btn.classList.add('selected');
  });

  // Show preview
  function getPreviewIcon() {
    return ensureIconElement(preview, 'avatar-preview-icon');
  }

  if (profilePhotoURL && profilePhotoURL.startsWith('icon:')) {
    const iconClass = profilePhotoURL.replace('icon:', '');
    const img = preview.querySelector('img');
    if (img) img.remove();
    const pi = getPreviewIcon();
    pi.style.display = 'block';
    pi.className = 'fa-solid ' + iconClass;
  } else if (profilePhotoURL && profilePhotoURL.startsWith('http')) {
    let img = preview.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.alt = 'Foto de perfil';
      preview.prepend(img);
    }
    img.src = profilePhotoURL;
    const pi = getPreviewIcon();
    pi.style.display = 'none';
    document.querySelectorAll('.avatar-opt').forEach(btn => btn.classList.remove('selected'));
  } else {
    const img = preview.querySelector('img');
    if (img) img.remove();
    const pi = getPreviewIcon();
    pi.style.display = 'block';
    pi.className = 'fa-solid fa-user';
  }

  // Icon click handlers
  document.querySelectorAll('.avatar-opt').forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      const iconClass = this.dataset.icon;
      const img = preview.querySelector('img');
      if (img) {
        img.remove();
        pendingAvatarData = null;
      }
      // Re-query the icon element each time — FA6 may replace <i> with <svg>
      const currentIcon = document.getElementById('avatar-preview-icon');
      if (currentIcon) {
        currentIcon.style.display = 'block';
        currentIcon.className = 'fa-solid ' + iconClass;
        // If FA replaced <i> with <svg>, the old id is gone — recreate the <i>
        if (currentIcon.tagName !== 'I') {
          const newI = document.createElement('i');
          newI.id = 'avatar-preview-icon';
          newI.className = 'fa-solid ' + iconClass;
          currentIcon.parentNode.replaceChild(newI, currentIcon);
        }
      } else {
        // Element was replaced by FA — create fresh <i>
        const newI = document.createElement('i');
        newI.id = 'avatar-preview-icon';
        newI.className = 'fa-solid ' + iconClass;
        preview.appendChild(newI);
      }
    };
  });

  const firstInput = overlay.querySelector('input:not([disabled])');
  if (firstInput) setTimeout(() => firstInput.focus(), 200);
}



function closeProfileModal() {
  const overlay = document.getElementById('profile-modal-overlay');
  if (overlay) overlay.classList.remove('active');
}

let pendingAvatarData = null;

function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Selecione uma imagem válida.', 'error');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast('Imagem muito grande (máx 2MB).', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    pendingAvatarData = e.target.result;
    const preview = document.getElementById('avatar-preview');
    const previewIcon = document.getElementById('avatar-preview-icon');
    let img = preview.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.alt = 'Foto de perfil';
      preview.prepend(img);
    }
    img.src = pendingAvatarData;
    if (previewIcon) previewIcon.style.display = 'none';
    document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

function saveProfile() {
  if (!currentUser) return;
  const nameInput = document.getElementById('profile-name');
  const newName = nameInput ? nameInput.value.trim() : '';
  if (!newName) {
    showToast('Digite um nome.', 'error');
    return;
  }

  const selectedIcon = document.querySelector('.avatar-opt.selected');
  const iconData = selectedIcon ? selectedIcon.dataset.icon : null;

  const updates = { displayName: newName };

  if (pendingAvatarData) {
    updates.photoURL = pendingAvatarData;
  } else if (iconData) {
    updates.photoURL = 'icon:' + iconData;
  }

  // Always save locally first
  currentUser.displayName = newName;
  if (updates.photoURL) currentUser.photoURL = updates.photoURL;
  saveProfileToStorage(newName, updates.photoURL || currentUser.photoURL);
  pendingAvatarData = null;
  renderHeaderUser();
  renderDashGreeting();
  closeProfileModal();
  showToast('Perfil atualizado!', 'success');

  // Then try Firebase in background
  if (auth && typeof auth.updateProfile === 'function') {
    auth.updateProfile(updates).catch((e) => { console.warn('[Pulso] updateProfile falhou:', e); });
  }
  if (db && storageMode === 'rtdb') {
    const uid = currentUser.uid;
    db.ref('users/' + uid + '/profile').update({
      displayName: newName,
      photoURL: updates.photoURL || null,
      updatedAt: new Date().toISOString()
    }).catch((e) => { console.warn('[Pulso] profile update RTDB falhou:', e); });
  }
}

function confirmDeleteAccount() {
  showFormModal({
    title: 'Excluir minha conta',
    fields: [
      { id: 'fd-confirm', label: 'Digite EXCLUIR para confirmar', type: 'text', placeholder: 'EXCLUIR' }
    ],
    onSubmit(values) {
      if (values['fd-confirm'] !== 'EXCLUIR') {
        showToast('Digite EXCLUIR para confirmar.', 'error');
        return;
      }
      deleteAccount();
    }
  });
}

function deleteAccount() {
  if (!currentUser || !auth) return;
  const uid = currentUser.uid;

  const deleteData = () => {
    if (db && storageMode === 'rtdb') {
      db.ref('users/' + uid).remove().then(() => {
        return currentUser.delete();
      }).then(() => {
        showToast('Conta excluída.', 'success');
        window.location.href = 'login.html';
      }).catch(err => {
        showToast('Erro ao excluir: ' + err.message, 'error');
      });
    } else {
      currentUser.delete().then(() => {
        localStorage.clear();
        showToast('Conta excluída.', 'success');
        window.location.href = 'login.html';
      }).catch(err => {
        showToast('Erro ao excluir: ' + err.message, 'error');
      });
    }
  };

  deleteData();
}

// 8. ABAS + HERO
function updateHeroContent(tabId) {
  const topbarTitle = document.querySelector('.topbar h1');
  const topbarEyebrow = document.querySelector('.topbar .eyebrow');
  const contentMap = {
    dashboard: { eyebrow: 'Orçamento familiar', title: 'Visão geral' },
    entrada: { eyebrow: 'Lançamentos', title: 'Extrato Bancário' },
    investimentos: { eyebrow: 'Investimentos', title: 'Patrimônio e Metas' },
    historico: { eyebrow: 'Histórico', title: 'Últimos lançamentos' },
    banco: { eyebrow: 'Banco', title: 'Backup e Importação' }
  };
  const selected = contentMap[tabId] || contentMap.dashboard;
  if (topbarEyebrow) topbarEyebrow.textContent = selected.eyebrow;
  if (topbarTitle) topbarTitle.textContent = selected.title;
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('.tab-btn, .nav-link, .mbn-item').forEach(btn => btn.classList.remove('active'));
  const targetSection = document.getElementById(tabId);
  if (targetSection) targetSection.classList.add('active');

  const targetButton = Array.from(document.querySelectorAll('[onclick*="switchTab"]')).find(btn => {
    const onclick = btn.getAttribute('onclick') || '';
    const dataTab = btn.getAttribute('data-tab');
    return onclick.includes("'" + tabId + "'") || dataTab === tabId;
  });
  if (targetButton) targetButton.classList.add('active');
  updateHeroContent(tabId);
  updateUI();
  if (tabId === 'entrada') renderLancamentos();
}

function toggleCategoryBars() {
  const container = document.getElementById('category-bars');
  const text = document.getElementById('category-toggle-text');
  if (!container || !text) return;
  const isExpanded = container.classList.contains('category-bars-expanded');
  if (isExpanded) {
    container.classList.add('category-bars-collapsed');
    container.classList.remove('category-bars-expanded');
    text.textContent = 'Ver todas';
  } else {
    container.classList.remove('category-bars-collapsed');
    container.classList.add('category-bars-expanded');
    text.textContent = 'Recolher';
  }
}


// 9. MODAL DE LANÇAMENTO
function clampDueDay(v) {
  return Math.min(31, Math.max(1, parseInt(v, 10) || 10));
}

function isCreditExpense(tx) {
  return tx.type === 'saida' && tx.paymentMethod === 'credito';
}

function impactsBalance(tx) {
  return !(tx.type === 'saida' && tx.paymentMethod === 'credito');
}

function getInvoiceDueDate(baseDateStr, dueDay, installmentIndex) {
  const base = new Date(baseDateStr + 'T12:00:00');
  const normalizedDueDay = clampDueDay(dueDay);
  const firstDueOffset = base.getDate() > normalizedDueDay ? 1 : 0;
  const due = new Date(base.getFullYear(), base.getMonth() + firstDueOffset + installmentIndex, 1, 12, 0, 0, 0);
  const lastDay = new Date(due.getFullYear(), due.getMonth() + 1, 0).getDate();
  due.setDate(Math.min(normalizedDueDay, lastDay));
  return due.toISOString();
}

function populateCartaoSelect() {
  const cardSelect = document.getElementById('m-cartao');
  if (!cardSelect) return;
  loadCartoes();
  if (cartoes.length === 0) {
    cardSelect.innerHTML = '<option value="">Nenhum cartão cadastrado</option>';
    return;
  }
  cardSelect.innerHTML = cartoes.map((c, idx) =>
    '<option value="' + idx + '">' + escapeHTML(c.nome || ('Cartão ' + (idx + 1))) + '</option>'
  ).join('');
}

function syncCreditFieldsFromCard() {
  const cardSelect = document.getElementById('m-cartao');
  const dueInput = document.getElementById('m-dia-vencimento');
  if (!cardSelect || !dueInput) return;
  const idx = parseInt(cardSelect.value, 10);
  if (Number.isNaN(idx) || !cartoes[idx]) return;
  dueInput.value = clampDueDay(cartoes[idx].diaVencimento || dueInput.value || 10);
}

function updatePaymentFields() {
  const type = document.getElementById('m-type')?.value;
  const pagamento = document.getElementById('m-pagamento')?.value || 'debito';
  const pagamentoGroup = document.getElementById('pagamento-group');
  const cardGroup = document.getElementById('cartao-group');
  const dueGroup = document.getElementById('vencimento-group');
  const parcelasGroup = document.getElementById('parcelas-group');
  const isExpense = type === 'saida';
  const isCredit = isExpense && pagamento === 'credito';

  if (pagamentoGroup) pagamentoGroup.style.display = isExpense ? '' : 'none';
  if (cardGroup) cardGroup.style.display = isCredit ? '' : 'none';
  if (dueGroup) dueGroup.style.display = isCredit ? '' : 'none';
  if (parcelasGroup) parcelasGroup.style.display = isCredit ? 'flex' : 'none';
  updateParcelaInfo();
}

function openModal(type) {
  const overlay = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const typeInput = document.getElementById('m-type');
  const submitBtn = document.getElementById('modal-submit-btn');

  if (!overlay) return;

  typeInput.value = type;

  if (type === 'saida') {
    title.textContent = 'Nova despesa';
    submitBtn.className = 'modal-submit tipo-despesa';
  } else {
    title.textContent = 'Nova receita';
    submitBtn.className = 'modal-submit tipo-receita';
  }

  // Categoria padrão coerente com o tipo (evita Salário em despesas)
  updateTransactionModalCategories();
  const catSelect = document.getElementById('m-cat');
  if (catSelect) {
    const isSaida = type === 'saida';
    const list = isSaida ? customCategories.expense : customCategories.income;
    const fallback = isSaida ? 'Gastos Essenciais' : 'Salário';
    const def = (list && list.length) ? list[0] : fallback;
    if ([...catSelect.options].some(o => o.value === def)) catSelect.value = def;
    // Opcional: esconde optgroup irrelevante para não confundir
    const incG = catSelect.querySelector('optgroup[label="Entradas"]');
    const expG = catSelect.querySelector('optgroup[label="Saídas"]');
    if (incG) incG.style.display = isSaida ? 'none' : '';
    if (expG) expG.style.display = isSaida ? '' : 'none';
  }

  // Data atual
  const dateInput = document.getElementById('m-date');
  if (dateInput) {
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];
  }

  const pagamentoInput = document.getElementById('m-pagamento');
  const parcelasInput = document.getElementById('m-parcelas');
  const dueInput = document.getElementById('m-dia-vencimento');
  if (pagamentoInput) pagamentoInput.value = 'debito';
  if (parcelasInput) parcelasInput.value = '1';
  if (dueInput) dueInput.value = '10';
  populateCartaoSelect();
  syncCreditFieldsFromCard();
  updatePaymentFields();

  overlay.classList.add('modal-open');
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    const descInput = document.getElementById('m-desc');
    if (descInput) descInput.focus();
  }, 400);
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('modal-open');
  document.body.style.overflow = '';

  const form = document.getElementById('modalTransactionForm');
  if (form) form.reset();

  const pagamentoInput = document.getElementById('m-pagamento');
  if (pagamentoInput) pagamentoInput.value = 'debito';
  const parcelasInput = document.getElementById('m-parcelas');
  if (parcelasInput) parcelasInput.value = '1';
  const dueInput = document.getElementById('m-dia-vencimento');
  if (dueInput) dueInput.value = '10';

  const parcelasGroup = document.getElementById('parcelas-group');
  if (parcelasGroup) parcelasGroup.style.display = 'none';
  const cardGroup = document.getElementById('cartao-group');
  if (cardGroup) cardGroup.style.display = 'none';
  const dueGroup = document.getElementById('vencimento-group');
  if (dueGroup) dueGroup.style.display = 'none';
}

// Toggle parcelas
const pagamentoSelect = document.getElementById('m-pagamento');
if (pagamentoSelect) {
  pagamentoSelect.addEventListener('change', updatePaymentFields);
}

const parcelasInput = document.getElementById('m-parcelas');
if (parcelasInput) {
  parcelasInput.addEventListener('input', updateParcelaInfo);
}

const valorInput = document.getElementById('m-val');
if (valorInput) {
  valorInput.addEventListener('input', updateParcelaInfo);
}

const cardInput = document.getElementById('m-cartao');
if (cardInput) {
  cardInput.addEventListener('change', () => {
    syncCreditFieldsFromCard();
    updateParcelaInfo();
  });
}

const dueDayInput = document.getElementById('m-dia-vencimento');
if (dueDayInput) {
  dueDayInput.addEventListener('input', () => {
    dueDayInput.value = String(clampDueDay(dueDayInput.value));
    updateParcelaInfo();
  });
}

function updateParcelaInfo() {
  const valor = parseFloat(document.getElementById('m-val')?.value) || 0;
  const parcelasRaw = parseInt(document.getElementById('m-parcelas')?.value, 10) || 1;
  const parcelas = Math.min(12, Math.max(1, parcelasRaw));
  const parcelasField = document.getElementById('m-parcelas');
  if (parcelasField) parcelasField.value = String(parcelas);
  const pagamento = document.getElementById('m-pagamento')?.value || 'debito';
  const isCredit = pagamento === 'credito';
  const info = document.getElementById('parcela-info');
  if (info) {
    const valorParcela = valor / Math.max(parcelas, 1);
    const futuros = Math.max(0, parcelas - 1);
    if (!isCredit) {
      info.textContent = 'Débito: sem lançamentos futuros';
      return;
    }
    info.textContent = 'de R$ ' + valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' · ' + futuros + ' lançamentos futuros';
  }
}

// Submit do modal
const modalForm = document.getElementById('modalTransactionForm');
if (modalForm) {
  modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Evita lançamento duplicado (duplo clique / Enter repetido)
    if (modalForm.dataset.submitting === '1') return;
    modalForm.dataset.submitting = '1';
    const submitBtn = document.getElementById('modal-submit-btn');
    if (submitBtn) submitBtn.disabled = true;
    try {

    const type = document.getElementById('m-type').value;
    const desc = document.getElementById('m-desc').value.trim();
    const val = parseFloat(document.getElementById('m-val').value);
    const date = document.getElementById('m-date').value;
    const cat = document.getElementById('m-cat').value;
    const pagamento = document.getElementById('m-pagamento').value;
    const parcelas = Math.min(12, Math.max(1, parseInt(document.getElementById('m-parcelas')?.value, 10) || 1));
    const cardIdx = parseInt(document.getElementById('m-cartao')?.value, 10);
    const dueDay = clampDueDay(document.getElementById('m-dia-vencimento')?.value);

    if (!desc || !val || !date) {
      showToast('Preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    if (type === 'saida' && pagamento === 'credito') {
      if (Number.isNaN(cardIdx) || !cartoes[cardIdx]) {
        showToast('Selecione um cartão para lançamento no crédito.', 'warning');
        return;
      }
      const card = cartoes[cardIdx];
      const valorParcela = val / parcelas;
      for (let i = 0; i < parcelas; i++) {
        const dueDateIso = getInvoiceDueDate(date, dueDay, i);
        const parcelaDesc = desc + (parcelas > 1 ? ' (' + (i + 1) + '/' + parcelas + ')' : '');
        addTransaction({
          id: Date.now() + i + Math.random(),
          type: type,
          user: 'Compartilhado',
          desc: parcelaDesc,
          val: valorParcela,
          cat: cat,
          date: dueDateIso,
          parcela: i + 1,
          totalParcelas: parcelas,
          paymentMethod: 'credito',
          cardName: card.nome || '',
          dueDay
        });

        contasPagar.push({
          descricao: 'Fatura ' + (card.nome || 'Cartão') + ' — ' + parcelaDesc,
          valor: valorParcela,
          vencimento: dueDateIso,
          pago: false,
          recorrencia: 'unico',
          origem: 'cartao',
          cartaoNome: card.nome || '',
          criadoEm: new Date().toISOString()
        });
      }
      saveContasPagar();
      renderDashContasPagar();
      renderDashCartoes();
      showToast('Lançamento no crédito salvo (' + parcelas + 'x).', 'success');
    } else {
      addTransaction({
        id: Date.now(),
        type: type,
        user: 'Compartilhado',
        desc: desc,
        val: val,
        cat: cat,
        date: new Date(date + 'T12:00:00').toISOString(),
        paymentMethod: 'debito'
      });
      showToast('Lançamento salvo com sucesso!', 'success');
    }

    closeModal();
    } finally {
      delete modalForm.dataset.submitting;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// Fechar modal com Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// 10. FILTROS E HISTÓRICO
function filterHistory(filterType) {
  currentFilter = filterType;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById('filter-' + filterType);
  if (activeBtn) activeBtn.classList.add('active');
  renderHistory();
}

function renderHistory() {
  const container = document.getElementById('transaction-list-container');
  if (!container) return;

  container.innerHTML = '';
  let filtered = transactions;
  const now = new Date();

  if (currentFilter === 'mensal') {
    filtered = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  } else if (currentFilter === 'anual') {
    filtered = transactions.filter(t => new Date(t.date).getFullYear() === now.getFullYear());
  }

  if (filtered.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">Nenhuma transação encontrada.</p>';
    return;
  }

  filtered.forEach(t => {
    const dateFormatted = new Date(t.date).toLocaleDateString('pt-BR');
    const isEntrada = t.type === 'entrada';
    const icon = isEntrada ? '📥' : '📤';
    const typeClass = isEntrada ? 'entrada' : 'saida';
    const sign = isEntrada ? '+' : '-';
    const color = isEntrada ? 'var(--accent-success)' : 'var(--accent-danger)';
    const parcelaTag = t.totalParcelas ? ' <span class="t-user-tag">' + t.parcela + '/' + t.totalParcelas + '</span>' : '';
    const payTag = isEntrada
      ? ''
      : ' • ' + (t.paymentMethod === 'credito'
        ? ('Crédito' + (t.cardName ? (' (' + escapeHTML(t.cardName) + ')') : ''))
        : 'Débito');
    const deleteBtn = (t.key || (storageMode === 'local'))
      ? '<button class="btn-delete" data-tx-id="' + t.id + '" data-tx-key="' + escapeHTML(t.key || '') + '" title="Excluir" aria-label="Excluir lançamento">🗑️</button>'
      : '';

    container.innerHTML += '<div class="transaction-item">' +
      '<div class="t-info">' +
        '<div class="t-icon ' + typeClass + '">' + icon + '</div>' +
        '<div class="t-details">' +
          '<h4>' + escapeHTML(t.desc) + parcelaTag + '</h4>' +
          '<p>' + escapeHTML(t.cat) + payTag + ' • ' + escapeHTML(dateFormatted) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="t-amount" style="color: ' + color + ';">' +
        sign + ' R$ ' + t.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
        deleteBtn +
      '</div>' +
    '</div>';
  });
}

// 11. ATUALIZAÇÃO GERAL DA INTERFACE
function updateUI() {
  const appShell = document.querySelector('.app-shell');
  if (appShell) {
    if (!currentUser) { appShell.style.display = 'none'; return; }
    appShell.style.display = 'block';
  }

  let totalIncome = 0;
  let totalExpense = 0;
  let totalExpenseCash = 0;
  let lastIncome = null;
  let lastExpense = null;
  const categories = {};
  let investimentoTotal = 0;
  let joaoExpense = 0;
  let vickExpense = 0;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  let monthlyExpense = 0;
  let incomeByCategory = {};

  transactions.forEach(t => {
    if (t.type === 'entrada') {
      totalIncome += t.val;
      incomeByCategory[t.cat] = (incomeByCategory[t.cat] || 0) + t.val;
      if (!lastIncome) lastIncome = t;
    } else {
      totalExpense += t.val;
      if (impactsBalance(t)) totalExpenseCash += t.val;
      if (!lastExpense) lastExpense = t;
      categories[t.cat] = (categories[t.cat] || 0) + t.val;
      if (t.cat === 'Investimento' || t.cat === 'Investimentos') {
        investimentoTotal += t.val;
      }
      if (t.user === 'João') joaoExpense += t.val;
      else if (t.user === 'Vick') vickExpense += t.val;

      const txDate = new Date(t.date);
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        monthlyExpense += t.val;
      }
    }
  });

  const formatCurrency = value => 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  // Última entrada
  const lastIncomeVal = document.getElementById('last-income');
  const lastIncomeUser = document.getElementById('last-income-user');
  if (lastIncomeVal && lastIncomeUser) {
    if (lastIncome) {
      lastIncomeVal.textContent = formatCurrency(lastIncome.val);
      lastIncomeUser.textContent = lastIncome.desc + ' por ' + lastIncome.user;
    } else {
      lastIncomeVal.textContent = 'R$ 0,00';
      lastIncomeUser.textContent = 'Nenhum registro';
    }
  }

  // Última saída
  const lastExpenseVal = document.getElementById('last-expense');
  const lastExpenseUser = document.getElementById('last-expense-user');
  if (lastExpenseVal && lastExpenseUser) {
    if (lastExpense) {
      lastExpenseVal.textContent = formatCurrency(lastExpense.val);
      lastExpenseUser.textContent = lastExpense.desc + ' por ' + lastExpense.user;
    } else {
      lastExpenseVal.textContent = 'R$ 0,00';
      lastExpenseUser.textContent = 'Nenhum registro';
    }
  }

  // Stats gerais
  const balance = totalIncome - totalExpenseCash;
  const patrimonioLiquido = balance + investimentoTotal;

  const dashIncome = document.getElementById('dash-income');
  const dashExpense = document.getElementById('dash-expense');
  const dashBalance = document.getElementById('dash-balance');
  const heroIncome = document.getElementById('hero-income');
  const heroExpense = document.getElementById('hero-expense');
  const heroBalance = document.getElementById('hero-balance');
  const inlineIncome = document.getElementById('dash-income-inline');
  const inlineExpense = document.getElementById('dash-expense-inline');
  const inlineBalance = document.getElementById('dash-balance-inline');

  if (dashIncome) dashIncome.textContent = formatCurrency(totalIncome);
  if (dashExpense) dashExpense.textContent = formatCurrency(totalExpense);
  if (dashBalance) {
    dashBalance.textContent = formatCurrency(balance);
    dashBalance.style.color = balance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
  }
  if (heroIncome) heroIncome.textContent = 'Entradas: ' + formatCurrency(totalIncome);
  if (heroExpense) heroExpense.textContent = 'Saídas: ' + formatCurrency(totalExpense);
  if (heroBalance) {
    heroBalance.textContent = formatCurrency(balance);
    heroBalance.style.color = balance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
  }
  if (inlineIncome) inlineIncome.textContent = formatCurrency(totalIncome);
  if (inlineExpense) inlineExpense.textContent = formatCurrency(totalExpense);
  if (inlineBalance) {
    inlineBalance.textContent = formatCurrency(balance);
    inlineBalance.style.color = balance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
  }

  // Patrimônio
  const patrimonioEl = document.getElementById('patrimonio-liquido');
  if (patrimonioEl) patrimonioEl.textContent = formatCurrency(patrimonioLiquido);

  // Barras de categorias
  const categoryBarsContainer = document.getElementById('category-bars');
  if (categoryBarsContainer) {
    categoryBarsContainer.innerHTML = '';
    const catKeys = Object.keys(categories);
    if (catKeys.length === 0) {
      categoryBarsContainer.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">Nenhuma despesa registrada.</p>';
    } else {
      const maxCategoryVal = Math.max(...Object.values(categories), 1);
      catKeys.forEach(cat => {
        const val = categories[cat];
        const pct = totalExpense > 0 ? (val / totalExpense) * 100 : 0;
        const barWidth = (val / maxCategoryVal) * 100;
        categoryBarsContainer.innerHTML += '<div class="category-row">' +
          '<div class="category-info"><span>' + escapeHTML(cat) + '</span>' +
          '<span>' + pct.toFixed(1) + '% (' + formatCurrency(val) + ')</span></div>' +
          '<div class="category-bar-bg"><div class="category-bar-fill" style="width: ' + barWidth + '%;"></div></div>' +
        '</div>';
      });
    }

    const toggleBtn = document.getElementById('categoryToggle');
    if (toggleBtn) {
      toggleBtn.style.display = catKeys.length > 3 ? 'flex' : 'none';
      categoryBarsContainer.classList.add('category-bars-collapsed');
      categoryBarsContainer.classList.remove('category-bars-expanded');
      document.getElementById('category-toggle-text').textContent = 'Ver todas';
    }
  }

  // Fundo de emergência
  const emergenciaMeta = totalExpense > 0 ? totalExpense * 6 : 40000;
  const emergenciaAtual = investimentoTotal;
  const emergenciaPct = emergenciaMeta > 0 ? Math.min((emergenciaAtual / emergenciaMeta) * 100, 100) : 0;
  const emergenciaAtualEl = document.getElementById('emergencia-atual');
  const emergenciaPctEl = document.getElementById('emergencia-pct');
  const emergenciaBar = document.getElementById('emergencia-bar');
  const emergenciaMetaEl = document.getElementById('emergencia-meta');
  if (emergenciaAtualEl) emergenciaAtualEl.textContent = formatCurrency(emergenciaAtual);
  if (emergenciaPctEl) emergenciaPctEl.textContent = emergenciaPct.toFixed(0) + '%';
  if (emergenciaBar) emergenciaBar.style.width = emergenciaPct + '%';
  if (emergenciaMetaEl) emergenciaMetaEl.textContent = emergenciaMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  // Total investimentos
  const investTotalEl = document.getElementById('invest-total');
  if (investTotalEl) investTotalEl.textContent = formatCurrency(investimentoTotal);

  // Mini chart investimentos
  const investChart = document.getElementById('invest-chart');
  if (investChart) {
    const points = [];
    const months = 6;
    for (let i = 0; i <= months; i++) {
      const x = (i / months) * 100;
      const baseValue = investimentoTotal || 1;
      const projection = baseValue * Math.pow(1.12, i / 12);
      const y = 25 - Math.min((projection / (baseValue * 2)) * 25, 25);
      points.push(x + ',' + y);
    }
    investChart.innerHTML = '<path d="M' + points.join(' L') + '" fill="none" stroke="var(--accent-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  // Donut chart gastos mensais
  const donutMeta = 10000;
  const donutPct = donutMeta > 0 ? Math.min((monthlyExpense / donutMeta) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 15.915;
  const dashoffset = circumference * (1 - donutPct / 100);
  const donutSegment = document.getElementById('donut-segment');
  const donutValor = document.getElementById('donut-valor');
  const donutMetaEl = document.getElementById('donut-meta');
  if (donutSegment) {
    donutSegment.style.strokeDasharray = circumference;
    donutSegment.style.strokeDashoffset = dashoffset;
  }
  if (donutValor) donutValor.textContent = formatCurrency(monthlyExpense);
  if (donutMetaEl) donutMetaEl.textContent = donutMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  // Últimas movimentações
  const movimentacoesList = document.getElementById('movimentacoes-list');
  if (movimentacoesList) {
    const recent = transactions.slice(0, 5);
    if (recent.length === 0) {
      movimentacoesList.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.85rem; text-align: center; padding: 20px;">Nenhuma movimentação registrada.</p>';
    } else {
      movimentacoesList.innerHTML = recent.map(t => {
        const dateFormatted = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const isEntrada = t.type === 'entrada';
        const sign = isEntrada ? '+' : '-';
        const color = isEntrada ? 'var(--accent-success)' : 'var(--accent-warning)';
        return '<div class="mov-item">' +
          '<div class="mov-info">' +
            '<span class="mov-title">' + dateFormatted + ' - ' + escapeHTML(t.desc) + '</span>' +
            '<span class="mov-date">' + escapeHTML(t.cat) + ' • ' + escapeHTML(t.user) + '</span>' +
          '</div>' +
          '<span class="mov-value" style="color: ' + color + ';">' + sign + ' ' + formatCurrency(t.val) + '</span>' +
        '</div>';
      }).join('');
    }
  }

  // Gráfico de donut divisão de gastos
  renderDivisaoChart(categories, totalExpense);

  // Gráfico de receitas por categoria (doughnut)
  renderReceitasChart(incomeByCategory);

  // Divisão de gastos por pessoa
  const totalUserExpense = joaoExpense + vickExpense;
  const joaoPct = totalUserExpense > 0 ? (joaoExpense / totalUserExpense) * 100 : 0;
  const vickPct = totalUserExpense > 0 ? (vickExpense / totalUserExpense) * 100 : 0;
  const shareJoao = document.getElementById('share-joao');
  const barJoao = document.getElementById('bar-joao');
  const shareVick = document.getElementById('share-vick');
  const barVick = document.getElementById('bar-vick');
  if (shareJoao && barJoao) {
    shareJoao.textContent = joaoPct.toFixed(1) + '% (' + formatCurrency(joaoExpense) + ')';
    barJoao.style.width = joaoPct + '%';
  }
  if (shareVick && barVick) {
    shareVick.textContent = vickPct.toFixed(1) + '% (' + formatCurrency(vickExpense) + ')';
    barVick.style.width = vickPct + '%';
  }

  // Resumo mensal no hero
  renderResumoMensal(totalIncome, totalExpense, balance);

  // Dashboard Organize-style
  renderDashGreeting();
  renderDashMonthSummary(monthlyExpense);
  renderDashSaldoGeral(balance, investimentoTotal);
  renderDashContas();
  renderDashCartoes();
  renderDashContasPagar();
  renderDashContasReceber();
  renderDashMaioresGastos(monthlyExpense);

  renderMetasUI();
  renderHistory();
  renderLancamentos();
  configureComparativoControls();
  renderComparativo();
}

// 12. RESUMO MENSAL
function renderResumoMensal(totalIncome, totalExpense, balance) {
  const container = document.getElementById('hero-monthly-summary');
  if (!container) return;

  const now = new Date();
  const mesAtual = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const saidasMes = transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'saida' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const gastosPorCategoria = {};
  saidasMes.forEach(t => {
    gastosPorCategoria[t.cat] = (gastosPorCategoria[t.cat] || 0) + t.val;
  });

  const formatCurrency = v => 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const pct = (parte, total) => total > 0 ? ((parte / total) * 100).toFixed(1) + '%' : '0%';

  let categoriasHTML = '';
  const cats = Object.entries(gastosPorCategoria).sort((a, b) => b[1] - a[1]);
  cats.forEach(([cat, val]) => {
    categoriasHTML += '<div class="monthly-cat-row">' +
      '<span class="monthly-cat-name">' + escapeHTML(cat) + '</span>' +
      '<span class="monthly-cat-value">' + formatCurrency(val) + ' <small>(' + pct(val, totalExpense) + ')</small></span>' +
    '</div>';
  });

  container.innerHTML = '<div class="monthly-header">' +
    '<h3>Resumo de ' + mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1) + '</h3>' +
  '</div>' +
  '<div class="monthly-stats">' +
    '<div class="monthly-stat"><span class="monthly-stat-label">Entradas</span><span class="monthly-stat-value positive">' + formatCurrency(totalIncome) + '</span></div>' +
    '<div class="monthly-stat"><span class="monthly-stat-label">Saídas</span><span class="monthly-stat-value negative">' + formatCurrency(totalExpense) + '</span></div>' +
    '<div class="monthly-stat"><span class="monthly-stat-label">Saldo</span><span class="monthly-stat-value ' + (balance >= 0 ? 'positive' : 'negative') + '">' + formatCurrency(balance) + '</span></div>' +
  '</div>' +
  (categoriasHTML ? '<div class="monthly-cats"><h4>Gastos por categoria</h4>' + categoriasHTML + '</div>' : '');
}

// ============================================================
// 12B. COMPARATIVO MENSAL + VISÃO ANUAL
// ============================================================
const comparativoState = {
  view: 'year',
  referenceMonth: new Date().getMonth(),
  currentMonth: new Date().getMonth(),
  year: new Date().getFullYear()
};

function configureComparativoControls() {
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const refSelect = document.getElementById('comp-reference-month');
  const curSelect = document.getElementById('comp-current-month');
  if (!refSelect || !curSelect) return;

  const options = monthFull.map((label, index) => '<option value="' + index + '">' + label + '</option>').join('');
  refSelect.innerHTML = options;
  curSelect.innerHTML = options;
  refSelect.value = String(comparativoState.referenceMonth);
  curSelect.value = String(comparativoState.currentMonth);

  refSelect.onchange = (event) => {
    comparativoState.referenceMonth = Number(event.target.value);
    renderComparativo();
  };

  curSelect.onchange = (event) => {
    comparativoState.currentMonth = Number(event.target.value);
    renderComparativo();
  };

  document.querySelectorAll('.view-btn').forEach(btn => {
    const isActive = btn.dataset.view === comparativoState.view;
    btn.classList.toggle('active', isActive);
    btn.onclick = () => {
      comparativoState.view = btn.dataset.view;
      document.querySelectorAll('.view-btn').forEach(item => item.classList.toggle('active', item.dataset.view === comparativoState.view));
      renderComparativo();
    };
  });
}

function renderComparativo() {
  const now = new Date();
  const curMonth = Number(comparativoState.currentMonth ?? now.getMonth());
  const refMonth = Number(comparativoState.referenceMonth ?? (curMonth === 0 ? 11 : curMonth - 1));
  const curYear = Number(comparativoState.year ?? now.getFullYear());

  function monthTotals(month, year) {
    let income = 0, expense = 0;
    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        if (t.type === 'entrada') income += t.val;
        else expense += t.val;
      }
    });
    return { income, expense, balance: income - expense };
  }

  function buildCarryBalanceSeries() {
    const byMonth = new Map();
    for (let year = curYear - 1; year <= curYear; year++) {
      for (let month = 0; month < 12; month++) {
        const totals = monthTotals(month, year);
        byMonth.set(year + '-' + month, {
          year,
          month,
          ...totals,
          openingBalance: 0,
          closingBalance: 0
        });
      }
    }

    const ordered = [...byMonth.values()].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    let running = 0;
    ordered.forEach(item => {
      item.openingBalance = running;
      item.closingBalance = running + item.balance;
      running = item.closingBalance;
    });

    return ordered;
  }

  const carrySeries = buildCarryBalanceSeries();
  const currentCarry = carrySeries.find(item => item.year === curYear && item.month === curMonth) || carrySeries[carrySeries.length - 1] || { openingBalance: 0, closingBalance: 0 };
  const refCarry = carrySeries.find(item => item.year === curYear && item.month === refMonth) || { openingBalance: 0, closingBalance: 0 };
  const avgMonthlyNet = carrySeries.length ? carrySeries.reduce((sum, item) => sum + item.balance, 0) / carrySeries.length : 0;
  const projectedBalance = currentCarry.closingBalance + (avgMonthlyNet * 3);

  const prev = monthTotals(refMonth, curYear);
  const cur = monthTotals(curMonth, curYear);
  const formatCurrency = v => 'R$ ' + Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const viewLabel = document.getElementById('comp-view-label');
  if (viewLabel) {
    const labels = { quarter: 'trimestral', half: 'semestral', year: 'anual' };
    viewLabel.textContent = labels[comparativoState.view] || 'anual';
  }

  const prevLabel = document.getElementById('comp-prev-label');
  const curLabel = document.getElementById('comp-cur-label');
  const yearLabel = document.getElementById('annual-year');
  if (prevLabel) prevLabel.textContent = monthFull[refMonth];
  if (curLabel) curLabel.textContent = monthFull[curMonth];
  if (yearLabel) yearLabel.textContent = curYear;

  const prevIncome = document.getElementById('comp-prev-income');
  const prevExpense = document.getElementById('comp-prev-expense');
  const prevBalance = document.getElementById('comp-prev-balance');
  if (prevIncome) prevIncome.textContent = formatCurrency(prev.income);
  if (prevExpense) prevExpense.textContent = formatCurrency(prev.expense);
  if (prevBalance) {
    prevBalance.textContent = (prev.balance < 0 ? '- ' : '') + formatCurrency(prev.balance);
    prevBalance.className = 'comp-row-value ' + (prev.balance >= 0 ? 'positive' : 'negative');
  }

  const statusPrev = document.getElementById('comp-status-prev');
  if (statusPrev) {
    statusPrev.className = 'comp-status-bar ' + (prev.balance > 0 ? 'status-positive' : prev.balance < 0 ? 'status-negative' : 'status-neutral');
  }

  const curIncome = document.getElementById('comp-cur-income');
  const curExpense = document.getElementById('comp-cur-expense');
  const curBalance = document.getElementById('comp-cur-balance');
  if (curIncome) curIncome.textContent = formatCurrency(cur.income);
  if (curExpense) curExpense.textContent = formatCurrency(cur.expense);
  if (curBalance) {
    curBalance.textContent = (cur.balance < 0 ? '- ' : '') + formatCurrency(cur.balance);
    curBalance.className = 'comp-row-value ' + (cur.balance >= 0 ? 'positive' : 'negative');
  }

  const statusCur = document.getElementById('comp-status-cur');
  if (statusCur) {
    statusCur.className = 'comp-status-bar ' + (cur.balance > 0 ? 'status-positive' : cur.balance < 0 ? 'status-negative' : 'status-neutral');
  }

  const openingBalanceEl = document.getElementById('comp-opening-balance');
  const closingBalanceEl = document.getElementById('comp-closing-balance');
  const projectionBalanceEl = document.getElementById('comp-projection-balance');
  if (openingBalanceEl) openingBalanceEl.textContent = (refCarry.openingBalance < 0 ? '- ' : '') + formatCurrency(refCarry.openingBalance);
  if (closingBalanceEl) closingBalanceEl.textContent = (currentCarry.closingBalance < 0 ? '- ' : '') + formatCurrency(currentCarry.closingBalance);
  if (projectionBalanceEl) projectionBalanceEl.textContent = (projectedBalance < 0 ? '- ' : '') + formatCurrency(projectedBalance);

  function renderDelta(elId, prevVal, curVal, invert) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (prevVal === 0 && curVal === 0) {
      el.textContent = '—';
      el.className = 'comp-row-delta neutral';
      return;
    }
    if (prevVal === 0) {
      el.textContent = (curVal > 0 ? '+' : '') + formatCurrency(curVal);
      const isUp = curVal > prevVal;
      el.className = 'comp-row-delta ' + (invert ? (isUp ? 'down' : 'up') : (isUp ? 'up' : 'down'));
      return;
    }
    const pct = ((curVal - prevVal) / Math.abs(prevVal)) * 100;
    const sign = pct > 0 ? '+' : '';
    el.textContent = sign + pct.toFixed(1) + '%';
    const isUp = pct > 0;

    if (invert) {
      el.className = 'comp-row-delta ' + (isUp ? 'down' : pct < 0 ? 'up' : 'neutral');
    } else {
      el.className = 'comp-row-delta ' + (isUp ? 'up' : pct < 0 ? 'down' : 'neutral');
    }
  }

  renderDelta('comp-delta-income', prev.income, cur.income, false);
  renderDelta('comp-delta-expense', prev.expense, cur.expense, false);
  renderDelta('comp-delta-balance', prev.balance, cur.balance, true);

  const statusVar = document.getElementById('comp-status-variation');
  if (statusVar) {
    const balanceChange = cur.balance - prev.balance;
    statusVar.className = 'comp-status-bar ' + (balanceChange > 0 ? 'status-positive' : balanceChange < 0 ? 'status-negative' : 'status-neutral');
  }

  const annualChart = document.getElementById('annual-chart');
  if (!annualChart) return;

  const viewLength = comparativoState.view === 'quarter' ? 3 : comparativoState.view === 'half' ? 6 : 12;
  const months = [];
  for (let i = viewLength - 1; i >= 0; i--) {
    let monthIndex = curMonth - i;
    let yearIndex = curYear;
    while (monthIndex < 0) {
      monthIndex += 12;
      yearIndex -= 1;
    }
    months.push({ month: monthIndex, year: yearIndex });
  }
  months.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

  const values = months.flatMap(m => {
    const totals = monthTotals(m.month, m.year);
    return [totals.income, totals.expense];
  });
  const maxVal = Math.max(...values, 1);

  annualChart.innerHTML = months.map((m) => {
    const totals = monthTotals(m.month, m.year);
    const incomeH = (totals.income / maxVal) * 100;
    const expenseH = (totals.expense / maxVal) * 100;
    const isCurrent = m.month === curMonth && m.year === curYear;
    return '<div class="annual-month ' + (isCurrent ? 'current' : '') + '" style="opacity:' + (isCurrent ? '1' : '0.9') + '">' +
      '<div class="annual-bars">' +
        '<div class="annual-bar income" style="height:' + incomeH + '%"></div>' +
        '<div class="annual-bar expense" style="height:' + expenseH + '%"></div>' +
      '</div>' +
      '<span class="annual-month-label">' + monthNames[m.month] + '</span>' +
    '</div>';
  }).join('');
}

// ============================================================
// 12C. DASHBOARD ORGANIZE-STYLE — FUNÇÕES
// ============================================================

// Saudação
function renderDashGreeting() {
  const topGreeting = document.getElementById('topbar-greeting');

  const hour = new Date().getHours();
  let greeting;
  if (hour < 12) { greeting = 'Bom dia'; }
  else if (hour < 18) { greeting = 'Boa tarde'; }
  else { greeting = 'Boa noite'; }

  const fullName = currentUser ? (currentUser.displayName || (currentUser.email || '').split('@')[0] || 'Usuário') : 'Usuário';
  const firstName = fullName.split(' ')[0];

  if (topGreeting) topGreeting.textContent = greeting + ', ' + firstName;
}

// Resumo do mês no dashboard
function renderDashMonthSummary(monthlyExpense) {
  const receitasEl = document.getElementById('dash-receitas-mes');
  const despesasEl = document.getElementById('dash-despesas-mes');
  const formatCurrency = v => 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const now = new Date();
  let monthlyIncome = 0;
  transactions.forEach(t => {
    if (t.type === 'entrada') {
      const d = new Date(t.date);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        monthlyIncome += t.val;
      }
    }
  });

  if (receitasEl) receitasEl.textContent = formatCurrency(monthlyIncome);
  if (despesasEl) despesasEl.textContent = formatCurrency(monthlyExpense);

  const heroRec = document.getElementById('hero-receitas');
  const heroDesp = document.getElementById('hero-despesas');
  if (heroRec) heroRec.textContent = formatCurrency(monthlyIncome);
  if (heroDesp) heroDesp.textContent = formatCurrency(monthlyExpense);
}

// Saldo geral
let saldoVisivel = true;

function renderDashSaldoGeral(balance, investimentoTotal) {
  const saldoEl = document.getElementById('dash-saldo-geral');
  const heroSaldoEl = document.getElementById('hero-saldo-valor');
  const total = balance + investimentoTotal;
  const formatted = 'R$ ' + (total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  if (saldoEl) {
    saldoEl.textContent = formatted;
    saldoEl.style.color = total >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
  }
  if (heroSaldoEl) {
    heroSaldoEl.textContent = formatted;
  }
}

function toggleAllValuesVisibility() {
  saldoVisivel = !saldoVisivel;
  const icon = document.getElementById('global-eye-icon');
  const heroIcon = document.getElementById('hero-eye-icon');
  const cls = saldoVisivel ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
  if (icon) icon.className = cls;
  if (heroIcon) heroIcon.className = cls;

  if (saldoVisivel) {
    document.body.classList.remove('values-hidden');
  } else {
    document.body.classList.add('values-hidden');
  }
}

// Contas bancárias
let contas = [];
function loadContas() {
  try {
    const cached = localStorage.getItem(storageKey() + '_contas');
    if (cached) contas = JSON.parse(cached);
  } catch (e) { contas = []; }
}

function saveContas() {
  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/contas').set(contas);
  } else {
    localStorage.setItem(storageKey() + '_contas', JSON.stringify(contas));
  }
}

function renderDashContas() {
  const container = document.getElementById('contas-list');
  if (!container) return;
  loadContas();

  if (contas.length === 0) {
    container.innerHTML = '<div class="empty-state-small"><i class="fa-solid fa-building-columns"></i><p>Adicione sua primeira conta</p></div>';
    return;
  }

  const formatCurrency = v => 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  container.innerHTML = contas.map((c, i) =>
    '<div class="conta-item">' +
      '<div class="conta-info">' +
        '<div class="conta-icon"><i class="fa-solid fa-building-columns"></i></div>' +
        '<div><div class="conta-nome">' + escapeHTML(c.nome) + '</div><div class="conta-tipo">' + escapeHTML(c.tipo || 'Conta corrente') + '</div></div>' +
      '</div>' +
      '<span class="conta-saldo" style="color: ' + (c.saldo >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)') + ';">' + formatCurrency(c.saldo) + '</span>' +
    '</div>'
  ).join('');
}

// ============================================================
// FORM MODAL GENÉRICO — substitui prompt() nativo
// ============================================================
function showFormModal({ title, fields, onSubmit }) {
  const overlay = document.createElement('div');
  overlay.className = 'form-modal-overlay active';

  let fieldsHTML = fields.map(f => {
    if (f.type === 'select') {
      const opts = f.options.map(o => '<option value="' + escapeHTML(o) + '">' + escapeHTML(o) + '</option>').join('');
      return '<div class="form-modal-field">' +
        '<label for="' + escapeHTML(f.id) + '">' + escapeHTML(f.label) + '</label>' +
        '<select id="' + escapeHTML(f.id) + '">' + opts + '</select>' +
        '</div>';
    }
    return '<div class="form-modal-field">' +
      '<label for="' + escapeHTML(f.id) + '">' + escapeHTML(f.label) + '</label>' +
      '<input type="' + escapeHTML(f.type) + '" id="' + escapeHTML(f.id) + '" placeholder="' + escapeHTML(f.placeholder || '') + '"' +
      (f.step ? ' step="' + escapeHTML(String(f.step)) + '"' : '') +
      (f.min !== undefined ? ' min="' + escapeHTML(String(f.min)) + '"' : '') + '></div>';
  }).join('');

  overlay.innerHTML =
    '<div class="form-modal">' +
      '<h3>' + escapeHTML(title) + '</h3>' +
      fieldsHTML +
      '<div class="form-modal-actions">' +
        '<button type="button" class="form-modal-cancel">Cancelar</button>' +
        '<button type="button" class="form-modal-submit" id="form-modal-ok">Confirmar</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.querySelector('.form-modal-cancel').addEventListener('click', () => overlay.remove());

  const firstInput = overlay.querySelector('input, select');
  if (firstInput) setTimeout(() => firstInput.focus(), 100);

  overlay.querySelector('#form-modal-ok').addEventListener('click', () => {
    const values = {};
    fields.forEach(f => {
      values[f.id] = overlay.querySelector('#' + f.id).value;
    });
    overlay.remove();
    onSubmit(values);
  });

  overlay.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      overlay.querySelector('#form-modal-ok').click();
    }
    if (e.key === 'Escape') {
      overlay.remove();
    }
  });
}

function openContaModal(options = {}) {
  const { editIndex = null, manager = undefined } = options;

  if (editIndex !== null) {
    const conta = contas[editIndex];
    if (!conta) return;

    showFormModal({
      title: 'Editar conta bancária',
      fields: [
        { id: 'fc-nome', label: 'Nome da conta', type: 'text', placeholder: 'Ex: Nubank, Itaú' },
        { id: 'fc-saldo', label: 'Saldo atual (R$)', type: 'number', placeholder: '0,00', step: '0.01' },
        { id: 'fc-tipo', label: 'Tipo', type: 'select', options: ['Conta corrente', 'Poupança', 'Investimento', 'Carteira'] }
      ],
      onSubmit(values) {
        const nome = values['fc-nome'];
        if (!nome) return;
        conta.nome = nome;
        conta.saldo = parseFloat(values['fc-saldo']) || 0;
        conta.tipo = values['fc-tipo'] || conta.tipo || 'Conta corrente';
        saveContas();
        renderDashContas();
        showToast('Conta "' + nome + '" atualizada!', 'success');
      }
    });

    setTimeout(() => {
      const nomeEl = document.getElementById('fc-nome');
      const saldoEl = document.getElementById('fc-saldo');
      const tipoEl = document.getElementById('fc-tipo');
      if (nomeEl) nomeEl.value = conta.nome || '';
      if (saldoEl) saldoEl.value = String(conta.saldo || 0);
      if (tipoEl) tipoEl.value = conta.tipo || 'Conta corrente';
    }, 20);
    return;
  }

  if (manager === true || (manager === undefined && contas.length > 0)) {
    const overlay = document.createElement('div');
    overlay.className = 'form-modal-overlay active';

    overlay.innerHTML = '<div class="form-modal manage-modal">' +
      '<h3>Gerenciar contas</h3>' +
      '<div class="manage-list">' + contas.map((conta, index) =>
        '<div class="manage-list-item">' +
          '<div class="manage-list-info">' +
            '<div class="manage-list-icon"><i class="fa-solid fa-building-columns"></i></div>' +
            '<div>' +
              '<strong>' + escapeHTML(conta.nome || 'Conta') + '</strong>' +
              '<small>' + escapeHTML(conta.tipo || 'Conta corrente') + '</small>' +
            '</div>' +
          '</div>' +
          '<div class="manage-list-actions">' +
            '<button type="button" class="manage-inline-action primary" data-manage-kind="conta-edit" data-index="' + index + '">Editar</button>' +
            '<button type="button" class="manage-inline-action danger" data-manage-kind="conta-delete" data-index="' + index + '">Excluir</button>' +
          '</div>' +
        '</div>'
      ).join('') + '</div>' +
      '<div class="form-modal-actions manage-actions-row">' +
        '<button type="button" class="form-modal-cancel">Fechar</button>' +
        '<button type="button" class="form-modal-submit" id="manage-add-conta">+ Nova conta</button>' +
      '</div>' +
    '</div>';

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) overlay.remove();
      const actionBtn = event.target.closest('[data-manage-kind]');
      if (!actionBtn) return;
      const idx = Number(actionBtn.dataset.index);
      const kind = actionBtn.dataset.manageKind;
      if (kind === 'conta-edit') {
        overlay.remove();
        openContaModal({ editIndex: idx });
      }
      if (kind === 'conta-delete') {
        const item = contas[idx];
        if (!item) return;
        if (!confirm('Deseja excluir a conta "' + item.nome + '"?')) return;
        contas.splice(idx, 1);
        saveContas();
        renderDashContas();
        overlay.remove();
        if (contas.length === 0) {
          openContaModal();
        } else {
          openContaModal();
        }
      }
    });

    overlay.querySelector('.form-modal-cancel')?.addEventListener('click', () => overlay.remove());
    overlay.querySelector('#manage-add-conta')?.addEventListener('click', () => {
      overlay.remove();
      showFormModal({
        title: 'Nova conta bancária',
        fields: [
          { id: 'fc-nome', label: 'Nome da conta', type: 'text', placeholder: 'Ex: Nubank, Itaú' },
          { id: 'fc-saldo', label: 'Saldo atual (R$)', type: 'number', placeholder: '0,00', step: '0.01' },
          { id: 'fc-tipo', label: 'Tipo', type: 'select', options: ['Conta corrente', 'Poupança', 'Investimento', 'Carteira'] }
        ],
        onSubmit(values) {
          const nome = values['fc-nome'];
          if (!nome) return;
          const saldo = parseFloat(values['fc-saldo']) || 0;
          const tipo = values['fc-tipo'] || 'Conta corrente';
          contas.push({ nome, saldo, tipo, criadoEm: new Date().toISOString() });
          saveContas();
          renderDashContas();
          showToast('Conta "' + nome + '" adicionada!', 'success');
        }
      });
    });
    return;
  }

  showFormModal({
    title: 'Nova conta bancária',
    fields: [
      { id: 'fc-nome', label: 'Nome da conta', type: 'text', placeholder: 'Ex: Nubank, Itaú' },
      { id: 'fc-saldo', label: 'Saldo atual (R$)', type: 'number', placeholder: '0,00', step: '0.01' },
      { id: 'fc-tipo', label: 'Tipo', type: 'select', options: ['Conta corrente', 'Poupança', 'Investimento', 'Carteira'] }
    ],
    onSubmit(values) {
      const nome = values['fc-nome'];
      if (!nome) return;
      const saldo = parseFloat(values['fc-saldo']) || 0;
      const tipo = values['fc-tipo'] || 'Conta corrente';
      contas.push({ nome, saldo, tipo, criadoEm: new Date().toISOString() });
      saveContas();
      renderDashContas();
      showToast('Conta "' + nome + '" adicionada!', 'success');
    }
  });
}

// Cartões
let cartoes = [];
function loadCartoes() {
  try {
    const cached = localStorage.getItem(storageKey() + '_cartoes');
    if (cached) cartoes = JSON.parse(cached);
  } catch (e) { cartoes = []; }
}

function saveCartoes() {
  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/cartoes').set(cartoes);
  } else {
    localStorage.setItem(storageKey() + '_cartoes', JSON.stringify(cartoes));
  }
}

function renderDashCartoes() {
  const container = document.getElementById('cartoes-list');
  if (!container) return;
  loadCartoes();
  loadContasPagar();

  const mesAtual = document.getElementById('faturas-mes-atual');
  if (mesAtual) {
    mesAtual.textContent = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  }

  if (cartoes.length === 0) {
    container.innerHTML = '<div class="empty-state-small"><i class="fa-solid fa-credit-card"></i><p>Adicione seu primeiro cartão</p></div>';
    return;
  }

  const formatCurrency = v => 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const now = new Date();
  container.innerHTML = cartoes.map(c => {
    const faturaAtual = contasPagar
      .filter(cp => !cp.pago && cp.origem === 'cartao' && (cp.cartaoNome || '') === (c.nome || ''))
      .filter(cp => {
        const d = new Date(cp.vencimento);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, cp) => sum + (parseFloat(cp.valor) || 0), 0);
    const diaVencimento = clampDueDay(c.diaVencimento || 10);
    return '<div class="cartao-item">' +
      '<div class="cartao-info">' +
        '<div class="cartao-icon"><i class="fa-solid fa-credit-card"></i></div>' +
        '<div>' +
          '<div class="cartao-nome">' + escapeHTML(c.nome) + ' <span class="cartao-badge">' + escapeHTML(c.bandeira || 'Manual') + '</span></div>' +
          '<div class="cartao-tipo">Vencimento dia ' + diaVencimento + '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="cartao-limite-row">' +
      '<div class="cartao-limite-item"><span class="cartao-limite-label">Limite Disponível</span><span class="cartao-limite-valor">' + formatCurrency((c.limite || 0) - faturaAtual) + '</span></div>' +
      '<div class="cartao-limite-item"><span class="cartao-limite-label">Fatura atual</span><span class="cartao-fatura-valor">' + formatCurrency(faturaAtual) + '</span></div>' +
    '</div>';
  }).join('');

  // Atualizar total de faturas
  const totalFaturas = contasPagar
    .filter(cp => !cp.pago && cp.origem === 'cartao')
    .filter(cp => {
      const d = new Date(cp.vencimento);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, cp) => sum + (parseFloat(cp.valor) || 0), 0);
  const faturasTotalEl = document.getElementById('dash-faturas-total');
  if (faturasTotalEl) faturasTotalEl.textContent = formatCurrency(totalFaturas);
}

function openCartaoModal(options = {}) {
  const { editIndex = null, manager = undefined } = options;

  if (editIndex !== null) {
    const cartao = cartoes[editIndex];
    if (!cartao) return;

    showFormModal({
      title: 'Editar cartão de crédito',
      fields: [
        { id: 'fc-nome', label: 'Nome do cartão', type: 'text', placeholder: 'Ex: Nubank, Inter' },
        { id: 'fc-limite', label: 'Limite total (R$)', type: 'number', placeholder: '0,00', step: '0.01' },
        { id: 'fc-bandeira', label: 'Bandeira', type: 'select', options: ['Visa', 'Mastercard', 'Elo', 'Amex', 'Outro'] },
        { id: 'fc-vencimento', label: 'Dia de vencimento da fatura', type: 'number', placeholder: '10', min: '1' }
      ],
      onSubmit(values) {
        const nome = values['fc-nome'];
        if (!nome) return;
        cartao.nome = nome;
        cartao.limite = parseFloat(values['fc-limite']) || 0;
        cartao.bandeira = values['fc-bandeira'] || cartao.bandeira || 'Manual';
        cartao.diaVencimento = clampDueDay(values['fc-vencimento']);
        saveCartoes();
        renderDashCartoes();
        showToast('Cartão "' + nome + '" atualizado!', 'success');
      }
    });

    setTimeout(() => {
      const nomeEl = document.getElementById('fc-nome');
      const limiteEl = document.getElementById('fc-limite');
      const bandeiraEl = document.getElementById('fc-bandeira');
      const vencimentoEl = document.getElementById('fc-vencimento');
      if (nomeEl) nomeEl.value = cartao.nome || '';
      if (limiteEl) limiteEl.value = String(cartao.limite || 0);
      if (bandeiraEl) bandeiraEl.value = cartao.bandeira || 'Outro';
      if (vencimentoEl) vencimentoEl.value = String(clampDueDay(cartao.diaVencimento || 10));
    }, 20);
    return;
  }

  if (manager === true || (manager === undefined && cartoes.length > 0)) {
    const overlay = document.createElement('div');
    overlay.className = 'form-modal-overlay active';

    overlay.innerHTML = '<div class="form-modal manage-modal">' +
      '<h3>Gerenciar cartões</h3>' +
      '<div class="manage-list">' + cartoes.map((cartao, index) =>
        '<div class="manage-list-item">' +
          '<div class="manage-list-info">' +
            '<div class="manage-list-icon"><i class="fa-solid fa-credit-card"></i></div>' +
            '<div>' +
              '<strong>' + escapeHTML(cartao.nome || 'Cartão') + '</strong>' +
              '<small>' + escapeHTML(cartao.bandeira || 'Manual') + '</small>' +
            '</div>' +
          '</div>' +
          '<div class="manage-list-actions">' +
            '<button type="button" class="manage-inline-action primary" data-manage-kind="cartao-edit" data-index="' + index + '">Editar</button>' +
            '<button type="button" class="manage-inline-action danger" data-manage-kind="cartao-delete" data-index="' + index + '">Excluir</button>' +
          '</div>' +
        '</div>'
      ).join('') + '</div>' +
      '<div class="form-modal-actions manage-actions-row">' +
        '<button type="button" class="form-modal-cancel">Fechar</button>' +
        '<button type="button" class="form-modal-submit" id="manage-add-cartao">+ Novo cartão</button>' +
      '</div>' +
    '</div>';

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) overlay.remove();
      const actionBtn = event.target.closest('[data-manage-kind]');
      if (!actionBtn) return;
      const idx = Number(actionBtn.dataset.index);
      const kind = actionBtn.dataset.manageKind;
      if (kind === 'cartao-edit') {
        overlay.remove();
        openCartaoModal({ editIndex: idx });
      }
      if (kind === 'cartao-delete') {
        const item = cartoes[idx];
        if (!item) return;
        if (!confirm('Deseja excluir o cartão "' + item.nome + '"?')) return;
        cartoes.splice(idx, 1);
        saveCartoes();
        renderDashCartoes();
        overlay.remove();
        if (cartoes.length === 0) {
          openCartaoModal();
        } else {
          openCartaoModal();
        }
      }
    });

    overlay.querySelector('.form-modal-cancel')?.addEventListener('click', () => overlay.remove());
    overlay.querySelector('#manage-add-cartao')?.addEventListener('click', () => {
      overlay.remove();
      showFormModal({
        title: 'Novo cartão de crédito',
        fields: [
          { id: 'fc-nome', label: 'Nome do cartão', type: 'text', placeholder: 'Ex: Nubank, Inter' },
          { id: 'fc-limite', label: 'Limite total (R$)', type: 'number', placeholder: '0,00', step: '0.01' },
          { id: 'fc-bandeira', label: 'Bandeira', type: 'select', options: ['Visa', 'Mastercard', 'Elo', 'Amex', 'Outro'] },
          { id: 'fc-vencimento', label: 'Dia de vencimento da fatura', type: 'number', placeholder: '10', min: '1' }
        ],
        onSubmit(values) {
          const nome = values['fc-nome'];
          if (!nome) return;
          const limite = parseFloat(values['fc-limite']) || 0;
          const bandeira = values['fc-bandeira'] || 'Manual';
          const diaVencimento = clampDueDay(values['fc-vencimento']);
          cartoes.push({ nome, limite, bandeira, diaVencimento, faturaAtual: 0, criadoEm: new Date().toISOString() });
          saveCartoes();
          renderDashCartoes();
          showToast('Cartão "' + nome + '" adicionado!', 'success');
        }
      });
    });
    return;
  }

  showFormModal({
    title: 'Novo cartão de crédito',
    fields: [
      { id: 'fc-nome', label: 'Nome do cartão', type: 'text', placeholder: 'Ex: Nubank, Inter' },
      { id: 'fc-limite', label: 'Limite total (R$)', type: 'number', placeholder: '0,00', step: '0.01' },
      { id: 'fc-bandeira', label: 'Bandeira', type: 'select', options: ['Visa', 'Mastercard', 'Elo', 'Amex', 'Outro'] },
      { id: 'fc-vencimento', label: 'Dia de vencimento da fatura', type: 'number', placeholder: '10', min: '1' }
    ],
    onSubmit(values) {
      const nome = values['fc-nome'];
      if (!nome) return;
      const limite = parseFloat(values['fc-limite']) || 0;
      const bandeira = values['fc-bandeira'] || 'Manual';
      const diaVencimento = clampDueDay(values['fc-vencimento']);
      cartoes.push({ nome, limite, bandeira, diaVencimento, faturaAtual: 0, criadoEm: new Date().toISOString() });
      saveCartoes();
      renderDashCartoes();
      showToast('Cartão "' + nome + '" adicionado!', 'success');
    }
  });
}

// Contas a pagar
let contasPagar = [];
function loadContasPagar() {
  try {
    const cached = localStorage.getItem(storageKey() + '_contasPagar');
    if (cached) contasPagar = JSON.parse(cached);
  } catch (e) { contasPagar = []; }
}

function saveContasPagar() {
  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/contasPagar').set(contasPagar);
  } else {
    localStorage.setItem(storageKey() + '_contasPagar', JSON.stringify(contasPagar));
  }
}

function renderDashContasPagar() {
  const container = document.getElementById('contas-pagar-list');
  if (!container) return;
  loadContasPagar();

  if (contasPagar.length === 0) {
    container.innerHTML = '<div class="empty-state-small"><i class="fa-solid fa-calendar-check"></i><p>No momento você não possui contas a pagar</p></div>';
    return;
  }

  const formatCurrency = v => 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const now = new Date();

  container.innerHTML = contasPagar.filter(c => !c.pago).map(c => {
    const venc = new Date(c.vencimento);
    const diaVenc = venc.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    const isAtrasado = venc < now;
    const badgeRec = c.recorrencia === 'fixo'
      ? '<span class="bill-badge-rec" style="background: var(--accent-primary); color: #fff;">Fixo</span>'
      : '';
    const badgeCartao = c.origem === 'cartao'
      ? '<span class="bill-badge-rec" style="background: rgba(255,193,7,0.15); color: #ffcc66;">Cartão' + (c.cartaoNome ? (' · ' + escapeHTML(c.cartaoNome)) : '') + '</span>'
      : '';
    return '<div class="bill-item">' +
      '<div class="bill-info">' +
        '<div class="bill-icon pagar"><i class="fa-solid fa-file-invoice-dollar"></i></div>' +
        '<div><div class="bill-nome">' + escapeHTML(c.descricao) + ' ' + badgeRec + ' ' + badgeCartao + '</div><div class="bill-venc" style="color: ' + (isAtrasado ? 'var(--accent-danger)' : 'var(--text-secondary)') + ';">Venc. ' + diaVenc + '</div></div>' +
      '</div>' +
      '<span class="bill-valor" style="color: var(--accent-danger);">- ' + formatCurrency(c.valor) + '</span>' +
    '</div>';
  }).join('');
}

function openContaPagarModal() {
  showFormModal({
    title: 'Nova conta a pagar',
    fields: [
      { id: 'fc-desc', label: 'Descrição', type: 'text', placeholder: 'Ex: Aluguel, Conta de luz' },
      { id: 'fc-valor', label: 'Valor (R$)', type: 'number', placeholder: '0,00', step: '0.01' },
      { id: 'fc-venc', label: 'Data de vencimento', type: 'date' },
      { id: 'fc-recorrencia', label: 'Recorrência', type: 'select', options: ['Fixo todo mês', 'Evento único'] }
    ],
    onSubmit(values) {
      const desc = values['fc-desc'];
      if (!desc) return;
      const valor = parseFloat(values['fc-valor']) || 0;
      const vencStr = values['fc-venc'];
      if (!vencStr) return;
      const vencimento = new Date(vencStr + 'T12:00:00').toISOString();
      const recorrencia = values['fc-recorrencia'] === 'Fixo todo mês' ? 'fixo' : 'unico';
      contasPagar.push({ descricao: desc, valor, vencimento, pago: false, recorrencia, criadoEm: new Date().toISOString() });
      saveContasPagar();
      renderDashContasPagar();
      showToast('Conta a pagar adicionada!', 'success');
    }
  });
}

// Contas a receber
let contasReceber = [];
function loadContasReceber() {
  try {
    const cached = localStorage.getItem(storageKey() + '_contasReceber');
    if (cached) contasReceber = JSON.parse(cached);
  } catch (e) { contasReceber = []; }
}

function saveContasReceber() {
  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/contasReceber').set(contasReceber);
  } else {
    localStorage.setItem(storageKey() + '_contasReceber', JSON.stringify(contasReceber));
  }
}

function renderDashContasReceber() {
  const container = document.getElementById('contas-receber-list');
  if (!container) return;
  loadContasReceber();

  if (contasReceber.length === 0) {
    container.innerHTML = '<div class="empty-state-small"><i class="fa-solid fa-hand-holding-dollar"></i><p>No momento você não possui contas a receber</p></div>';
    return;
  }

  const formatCurrency = v => 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  container.innerHTML = contasReceber.filter(c => !c.recebido).map(c => {
    const venc = new Date(c.vencimento);
    const diaVenc = venc.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    const badgeRec = c.recorrencia === 'fixo'
      ? '<span class="bill-badge-rec" style="background: var(--accent-primary); color: #fff;">Fixo</span>'
      : '';
    return '<div class="bill-item">' +
      '<div class="bill-info">' +
        '<div class="bill-icon receber"><i class="fa-solid fa-hand-holding-dollar"></i></div>' +
        '<div><div class="bill-nome">' + escapeHTML(c.descricao) + ' ' + badgeRec + '</div><div class="bill-venc">Venc. ' + diaVenc + '</div></div>' +
      '</div>' +
      '<span class="bill-valor" style="color: var(--accent-success);">+ ' + formatCurrency(c.valor) + '</span>' +
    '</div>';
  }).join('');
}

function openContaReceberModal() {
  showFormModal({
    title: 'Novo recebimento',
    fields: [
      { id: 'fc-desc', label: 'Descrição', type: 'text', placeholder: 'Ex: Salário, Freelance' },
      { id: 'fc-valor', label: 'Valor (R$)', type: 'number', placeholder: '0,00', step: '0.01' },
      { id: 'fc-venc', label: 'Data de recebimento', type: 'date' },
      { id: 'fc-recorrencia', label: 'Recorrência', type: 'select', options: ['Fixo todo mês', 'Evento único'] }
    ],
    onSubmit(values) {
      const desc = values['fc-desc'];
      if (!desc) return;
      const valor = parseFloat(values['fc-valor']) || 0;
      const vencStr = values['fc-venc'];
      if (!vencStr) return;
      const vencimento = new Date(vencStr + 'T12:00:00').toISOString();
      const recorrencia = values['fc-recorrencia'] === 'Fixo todo mês' ? 'fixo' : 'unico';
      contasReceber.push({ descricao: desc, valor, vencimento, recebido: false, recorrencia, criadoEm: new Date().toISOString() });
      saveContasReceber();
      renderDashContasReceber();
      showToast('Conta a receber adicionada!', 'success');
    }
  });
}

// Maiores gastos do mês
function renderDashMaioresGastos(monthlyExpense) {
  const container = document.getElementById('maiores-gastos-list');
  if (!container) return;

  const now = new Date();
  const gastosMes = transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'saida' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).sort((a, b) => b.val - a.val).slice(0, 5);

  if (gastosMes.length === 0) {
    container.innerHTML = '<div class="empty-state-small"><i class="fa-solid fa-receipt"></i><p>Sem gastos no período</p></div>';
    return;
  }

  const formatCurrency = v => 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  container.innerHTML = gastosMes.map((t, i) =>
    '<div class="gasto-item">' +
      '<div class="gasto-info">' +
        '<span class="gasto-rank">' + (i + 1) + '</span>' +
        '<div><div class="conta-nome">' + escapeHTML(t.desc) + '</div><div class="conta-tipo">' + escapeHTML(t.cat) + ' • ' + escapeHTML(t.user) + '</div></div>' +
      '</div>' +
      '<span class="gasto-valor">- ' + formatCurrency(t.val) + '</span>' +
    '</div>'
  ).join('');
}

// 13. BACKUP / LIMPAR
function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "backup_orcamento.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Backup exportado com sucesso!', 'success');
}

function clearData() {
  if (!confirm('Tem certeza que deseja apagar TODOS os dados? Esta ação não pode ser desfeita.')) return;
  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/transactions').remove();
  } else {
    transactions = [];
    saveToLocal();
    updateUI();
  }
  showToast('Todos os dados foram limpos.', 'warning');
}

// 14. IMPORTADOR DE PLANILHAS
const MESES_PT = {
  'janeiro': 0, 'fevereiro': 1, 'março': 2, 'marco': 2, 'abril': 3,
  'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7, 'setembro': 8,
  'outubro': 9, 'novembro': 10, 'dezembro': 11
};

const PALAVRAS_INVESTIMENTO = ['invest', 'poupan', 'aplicaç', 'aplicac', 'reserva'];

function parseSheetNameToDate(sheetName) {
  const nome = sheetName.trim().toLowerCase();
  let ano = new Date().getFullYear();
  const anoMatch = nome.match(/20\d{2}/);
  if (anoMatch) ano = parseInt(anoMatch[0]);
  for (const mesNome in MESES_PT) {
    if (nome.includes(mesNome)) return new Date(ano, MESES_PT[mesNome], 1).toISOString();
  }
  const numMatch = nome.match(/(\d{1,2})[\/\-](\d{4})/);
  if (numMatch) return new Date(parseInt(numMatch[2]), parseInt(numMatch[1]) - 1, 1).toISOString();
  return null;
}

function parseValor(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw === 'number') return Math.max(0, raw);
  const texto = String(raw).trim();
  if (texto === '-' || texto === '–' || texto === '') return null;
  const limpo = texto.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
  const num = parseFloat(limpo);
  return isNaN(num) || num < 0 ? null : num;
}

function encontrarBlocos(linhas) {
  const blocosAlvo = {
    'renda': 'renda',
    'sobrevivência': 'essenciais',
    'sobrevivencia': 'essenciais',
    'despesas variáveis': 'pessoais',
    'despesas variaveis': 'pessoais'
  };
  const blocos = [];
  linhas.forEach((linha, i) => {
    if (!linha) return;
    linha.forEach((celula, col) => {
      const texto = String(celula || '').trim().toLowerCase();
      if (blocosAlvo[texto]) blocos.push({ tipo: blocosAlvo[texto], linhaInicio: i + 1, coluna: col });
    });
  });
  return blocos;
}

function importMeses(workbook, log) {
  const mesesParaSubstituir = new Set(workbook.SheetNames.map(parseSheetNameToDate).filter(Boolean));
  if (mesesParaSubstituir.size) {
    const mesesNomes = [...mesesParaSubstituir].map(d => new Date(d).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })).join(', ');
    if (!confirm('As abas encontradas (' + mesesNomes + ') já existem e serão SUBSTITUÍDAS. Continuar?')) return;
  }

  const base = transactions.filter(t => !mesesParaSubstituir.has(t.date));
  const novos = [];
  const mesesIgnorados = [];
  const itensIgnorados = [];

  workbook.SheetNames.forEach(sheetName => {
    const dataMes = parseSheetNameToDate(sheetName);
    if (!dataMes) { mesesIgnorados.push(sheetName); return; }

    const linhas = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    const blocos = encontrarBlocos(linhas);
    const dizimos = {};

    blocos.forEach(bloco => {
      let row = bloco.linhaInicio;
      while (row < linhas.length) {
        const linha = linhas[row] || [];
        const rotulo = String(linha[bloco.coluna] || '').trim();
        if (!rotulo) break;
        const rotuloLower = rotulo.toLowerCase();
        if (rotuloLower.includes('total')) break;

        const valor = parseValor(linha[bloco.coluna + 1]);
        row++;

        if (valor === null) {
          itensIgnorados.push(sheetName + ': "' + rotulo + '"');
          continue;
        }

        if (rotuloLower.includes('dízimo') || rotuloLower.includes('dizimo')) {
          if (rotuloLower.includes('jp')) dizimos['João'] = (dizimos['João'] || 0) + valor;
          else if (rotuloLower.includes('vick')) dizimos['Vick'] = (dizimos['Vick'] || 0) + valor;
          continue;
        }

        if (bloco.tipo === 'renda') {
          const usuario = (rotuloLower.includes('amor') || rotuloLower.includes('vick')) ? 'Vick' : 'João';
          novos.push({ id: Date.now() + Math.random(), type: 'entrada', user: usuario, desc: rotulo, val: valor, cat: 'Renda', date: dataMes });
        } else {
          let categoria = bloco.tipo === 'essenciais' ? 'Gastos Essenciais' : 'Pessoais';
          if (PALAVRAS_INVESTIMENTO.some(p => rotuloLower.includes(p))) categoria = 'Investimento';
          novos.push({ id: Date.now() + Math.random(), type: 'saida', user: 'Compartilhado', desc: rotulo, val: valor, cat: categoria, date: dataMes });
        }
      }
    });

    Object.keys(dizimos).forEach(pessoa => {
      const salario = novos.find(t => t.date === dataMes && t.cat === 'Renda' && t.user === pessoa && /sal[aá]rio/i.test(t.desc));
      if (salario) salario.val = Math.max(0, salario.val - dizimos[pessoa]);
    });
  });

  bulkReplace([...novos, ...base]);

  let resumo = '✅ ' + novos.length + ' lançamentos importados para o seu login.';
  if (mesesIgnorados.length) resumo += '\n⚠️ Abas não reconhecidas como mês: ' + mesesIgnorados.join(', ');
  if (itensIgnorados.length) resumo += '\n⚠️ Linhas sem valor numérico (ignoradas): ' + itensIgnorados.slice(0, 10).join('; ');
  log.textContent = resumo;
  showToast(novos.length + ' lançamentos importados!', 'success');
}

function toNum(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw === 'number') return raw;
  const t = String(raw).trim().replace(/\s+/g, '');
  if (t === '' || t === '-' || t === '–') return null;
  const limpo = t.replace('R$', '').replace(/%$/, '').replace(/\./g, '').replace(',', '.').trim();
  const n = parseFloat(limpo);
  return isNaN(n) ? null : n;
}

function looksLikeSimulador(workbook) {
  if (workbook.SheetNames.some(n => /simul/i.test(n))) return true;
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const texto = rows.map(r => (r || []).join(' ').toLowerCase()).join(' ');
  return ['valor inicial', 'aporte mensal', 'cdb', 'tesouro', 'cdi'].every(k => texto.includes(k));
}

function importSimulador(workbook, log) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const plano = {
    valorInicial: 0,
    aporteMensal: 0,
    meses: 0,
    cdi: 0,
    ipca: 0,
    ativos: [],
    criadoEm: new Date().toISOString()
  };

  let ativoRow = -1;

  rows.forEach((row, i) => {
    if (!row) return;
    const cells = row.map(c => String(c ?? '').trim().toLowerCase());

    cells.forEach((cell, col) => {
      if (cell === 'valor inicial') plano.valorInicial = toNum(row[col + 1]) ?? plano.valorInicial;
      else if (cell === 'aporte mensal') plano.aporteMensal = toNum(row[col + 1]) ?? plano.aporteMensal;
      else if (cell === 'meses') plano.meses = toNum(row[col + 1]) ?? plano.meses;
      else if (cell === 'cdi') plano.cdi = toNum(row[col + 1]) ?? plano.cdi;
      else if (cell === 'ipca') plano.ipca = toNum(row[col + 1]) ?? plano.ipca;
      else if (cell === 'ativo' && ativoRow === -1) ativoRow = i;
    });
  });

  if (ativoRow >= 0) {
    for (let i = ativoRow + 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const nome = String(row[0] || '').trim();
      if (!nome || /total|6 meses|1 ano|2 anos|mais que 2/i.test(nome)) break;
      plano.ativos.push({
        ativo: nome,
        indexador: String(row[1] || '').trim(),
        taxa: toNum(row[2]) ?? 0
      });
    }
  }

  if (plano.ativos.length === 0 && plano.valorInicial === 0 && plano.aporteMensal === 0) {
    log.textContent = '⚠️ Simulador detectado, mas não foi possível extrair valores.';
    return;
  }

  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/planoInvestimento').set(plano);
  } else {
    localStorage.setItem(storageKey() + '_plano', JSON.stringify(plano));
  }
  renderPlano();

  const fmt = v => 'R$ ' + (v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const pct = v => (v ? (v * 100).toFixed(2) + '%' : '—');
  log.textContent =
    '✅ Simulador importado e salvo no seu login.\n' +
    'Valor inicial: ' + fmt(plano.valorInicial) + '\n' +
    'Aporte mensal: ' + fmt(plano.aporteMensal) + '\n' +
    'CDI: ' + pct(plano.cdi) + ' | IPCA: ' + pct(plano.ipca) + '\n' +
    'Ativos: ' + (plano.ativos.length > 0 ? plano.ativos.map(a => a.ativo + ' (' + pct(a.taxa) + ')').join(', ') : 'nenhum preenchido');
}

function renderPlano() {
  const el = document.getElementById('plano-resumo');
  if (!el) return;
  renderPlanoHTML(el, planoCache);
}

function renderPlanoHTML(el, plano) {
  const fmt = v => 'R$ ' + (v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const pct = v => (v ? (v * 100).toFixed(2) + '%' : '—');
  const ativos = Array.isArray(plano?.ativos) ? plano.ativos : [];
  if (!plano || (plano.valorInicial === 0 && plano.aporteMensal === 0 && ativos.length === 0)) {
    el.innerHTML = '<p>Nenhum plano importado ainda. Use a aba <strong>Banco</strong> para importar o simulador.</p>';
    return;
  }
  const ativosHTML = ativos.length
    ? ativos.map(a => '<li>' + escapeHTML(a.ativo) + ' — ' + escapeHTML(a.indexador || '—') + ' · taxa ' + pct(a.taxa) + '</li>').join('')
    : '<li>Nenhum ativo preenchido.</li>';
  el.innerHTML =
    '<p><strong>Valor inicial:</strong> ' + fmt(plano.valorInicial) + ' · <strong>Aporte:</strong> ' + fmt(plano.aporteMensal) + '/mês</p>' +
    '<p><strong>CDI:</strong> ' + pct(plano.cdi) + ' · <strong>IPCA:</strong> ' + pct(plano.ipca) + '</p>' +
    '<ul style="margin-top:8px; padding-left:18px; line-height:1.7;">' + ativosHTML + '</ul>';
}

function importExcel() {
  const input = document.getElementById('excel-file-input');
  const log = document.getElementById('import-log');
  if (!input.files || !input.files[0]) {
    log.textContent = 'Selecione um arquivo .xlsx primeiro.';
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      if (looksLikeSimulador(workbook)) {
        importSimulador(workbook, log);
      } else {
        importMeses(workbook, log);
      }
    } catch (err) {
      log.textContent = 'Erro ao ler a planilha: ' + err.message;
    }
  };
  reader.onerror = () => { log.textContent = 'Não foi possível ler o arquivo.'; };
  reader.readAsArrayBuffer(input.files[0]);
}

// 15. METAS E INVESTIMENTOS
let metasPlano = {
  curto: { meta: 0, atual: 1800, descricao: 'Reserva de emergência (6 meses)' },
  medio: { meta: 0, atual: 15900, descricao: 'Carro novo + financiamento' },
  longo: { meta: 0, atual: 15900, descricao: 'Casa quitada' }
};

function calcularGastoMensal() {
  if (transactions.length === 0) return 0;
  const saidas = transactions.filter(t => t.type === 'saida');
  if (saidas.length === 0) return 0;
  const datas = saidas.map(t => new Date(t.date).getTime());
  const minData = new Date(Math.min(...datas));
  const maxData = new Date(Math.max(...datas));
  const mesesDiferenca = (maxData.getFullYear() - minData.getFullYear()) * 12 +
                         (maxData.getMonth() - minData.getMonth()) + 1;
  const totalSaidas = saidas.reduce((sum, t) => sum + t.val, 0);
  return totalSaidas / Math.max(mesesDiferenca, 1);
}

function loadMetasPlano() {
  try {
    const cached = localStorage.getItem(storageKey() + '_metas');
    if (cached) {
      const loaded = JSON.parse(cached);
      metasPlano = { ...metasPlano, ...loaded };
    }
  } catch (e) {
    console.warn('Erro ao carregar metas:', e.message);
  }
  if (metasPlano.curto.meta === 0 && transactions.length > 0) {
    const gastoMensal = calcularGastoMensal();
    metasPlano.curto.meta = gastoMensal * 6;
  }
}

function saveMetasPlano() {
  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/metasInvestimento').set(metasPlano);
  } else {
    localStorage.setItem(storageKey() + '_metas', JSON.stringify(metasPlano));
  }
}

function renderMetasUI() {
  const curtoBar = document.getElementById('meta-curto-bar');
  if (!curtoBar) return;

  const formatCurrency = v => 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const pctCurto = metasPlano.curto.meta > 0
    ? Math.min((metasPlano.curto.atual / metasPlano.curto.meta) * 100, 100) : 0;
  const faltaCurto = Math.max(0, metasPlano.curto.meta - metasPlano.curto.atual);
  curtoBar.style.width = pctCurto + '%';
  document.getElementById('meta-curto-pct').textContent = 'Progresso: ' + pctCurto.toFixed(1) + '%';
  document.getElementById('meta-curto-falta').textContent = 'Falta: ' + formatCurrency(faltaCurto);

  const curtoCards = document.querySelectorAll('.card');
  if (curtoCards[0]) {
    const curtoValue = curtoCards[0].querySelector('.card-value');
    if (curtoValue) curtoValue.textContent = formatCurrency(metasPlano.curto.atual) + ' / ' + formatCurrency(metasPlano.curto.meta);
  }

  const pctMedio = metasPlano.medio.meta > 0
    ? Math.min((metasPlano.medio.atual / metasPlano.medio.meta) * 100, 100) : 0;
  const faltaMedio = Math.max(0, metasPlano.medio.meta - metasPlano.medio.atual);
  document.getElementById('meta-medio-bar').style.width = pctMedio + '%';
  document.getElementById('meta-medio-pct').textContent = 'Progresso: ' + pctMedio.toFixed(1) + '%';
  document.getElementById('meta-medio-falta').textContent = 'Falta: ' + formatCurrency(faltaMedio);
  if (curtoCards[1]) {
    const medioValue = curtoCards[1].querySelector('.card-value');
    if (medioValue) medioValue.textContent = formatCurrency(metasPlano.medio.atual) + ' / ' + formatCurrency(metasPlano.medio.meta);
  }

  const pctLongo = metasPlano.longo.meta > 0
    ? Math.min((metasPlano.longo.atual / metasPlano.longo.meta) * 100, 100) : 0;
  const faltaLongo = Math.max(0, metasPlano.longo.meta - metasPlano.longo.atual);
  document.getElementById('meta-longo-bar').style.width = pctLongo + '%';
  document.getElementById('meta-longo-pct').textContent = 'Progresso: ' + pctLongo.toFixed(1) + '%';
  document.getElementById('meta-longo-falta').textContent = 'Falta: ' + formatCurrency(faltaLongo);
  if (curtoCards[2]) {
    const longoValue = curtoCards[2].querySelector('.card-value');
    if (longoValue) longoValue.textContent = formatCurrency(metasPlano.longo.atual) + ' / ' + formatCurrency(metasPlano.longo.meta);
  }

  document.getElementById('meta-curto-val').value = metasPlano.curto.meta > 0 ? Math.round(metasPlano.curto.meta) : '';
  document.getElementById('meta-medio-val').value = metasPlano.medio.meta > 0 ? Math.round(metasPlano.medio.meta) : '';
  document.getElementById('meta-longo-val').value = metasPlano.longo.meta > 0 ? Math.round(metasPlano.longo.meta) : '';
}

const metasForm = document.getElementById('metasForm');
if (metasForm) {
  metasForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const curtoVal = parseFloat(document.getElementById('meta-curto-val').value) || 0;
    const medioVal = parseFloat(document.getElementById('meta-medio-val').value) || 0;
    const longoVal = parseFloat(document.getElementById('meta-longo-val').value) || 0;

    if (curtoVal === 0 || medioVal === 0 || longoVal === 0) {
      showToast('Preencha todas as metas com valores maiores que zero.', 'warning');
      return;
    }

    metasPlano.curto.meta = curtoVal;
    metasPlano.medio.meta = medioVal;
    metasPlano.longo.meta = longoVal;

    saveMetasPlano();
    renderMetasUI();
    showToast('Metas atualizadas com sucesso!', 'success');
  });
}

// 16. PATRIMÔNIO
const patrimonioBtn = document.getElementById('salvar-patrimonio');
if (patrimonioBtn) {
  patrimonioBtn.addEventListener('click', () => {
    const input = document.getElementById('patrimonio-input');
    if (!input) return;
    const valor = parseFloat(input.value) || 0;
    if (valor <= 0) {
      showToast('Digite um valor maior que zero.', 'warning');
      return;
    }
    const patrimonioEl = document.getElementById('patrimonio-liquido');
    if (patrimonioEl) {
      patrimonioEl.textContent = 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }
    if (storageMode === 'rtdb' && db && currentUser) {
      db.ref('users/' + currentUser.uid + '/patrimonio').set({ valor, atualizadoEm: new Date().toISOString() });
    } else {
      localStorage.setItem(storageKey() + '_patrimonio', valor);
    }
    showToast('Patrimônio salvo!', 'success');
  });

  // Carregar patrimônio salvo
  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/patrimonio').once('value', snap => {
      const data = snap.val();
      if (data && data.valor) {
        const input = document.getElementById('patrimonio-input');
        if (input) input.value = data.valor;
      }
    });
  }
}

// ============================================================
// MEUS ATIVOS E INVESTIMENTOS (controle manual)
// ============================================================
let meusAtivos = [];
let meusInvestimentos = [];

function loadMeusAtivos() {
  try {
    const cached = localStorage.getItem(storageKey() + '_meusAtivos');
    if (cached) meusAtivos = JSON.parse(cached);
  } catch (e) { meusAtivos = []; }
}

function saveMeusAtivos() {
  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/meusAtivos').set(meusAtivos);
  } else {
    localStorage.setItem(storageKey() + '_meusAtivos', JSON.stringify(meusAtivos));
  }
}

function loadMeusInvestimentos() {
  try {
    const cached = localStorage.getItem(storageKey() + '_meusInvestimentos');
    if (cached) meusInvestimentos = JSON.parse(cached);
  } catch (e) { meusInvestimentos = []; }
}

function saveMeusInvestimentos() {
  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/meusInvestimentos').set(meusInvestimentos);
  } else {
    localStorage.setItem(storageKey() + '_meusInvestimentos', JSON.stringify(meusInvestimentos));
  }
}

const formatCurrencyShort = v => 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

function renderMeusAtivos() {
  loadMeusAtivos();
  const grid = document.getElementById('patrimonio-grid');
  const emptyEl = document.getElementById('patrimonio-empty');
  if (!grid) return;

  const existingCards = grid.querySelectorAll('.card');
  existingCards.forEach(c => c.remove());

  if (meusAtivos.length === 0) {
    if (emptyEl) emptyEl.style.display = '';
  } else {
    if (emptyEl) emptyEl.style.display = 'none';
    meusAtivos.forEach((ativo, idx) => {
      const card = document.createElement('div');
      card.className = 'card card-gradient-success';
      card.innerHTML = '<div class="card-title">' + escapeHTML(ativo.nome) + '</div>' +
        '<div class="card-value card-value-success">' + formatCurrencyShort(ativo.valor) + '</div>' +
        '<p class="card-subtitle">' + escapeHTML(ativo.tipo) + '</p>' +
        '<button type="button" class="btn-delete-inline" data-remove-ativo="' + idx + '" title="Remover"><i class="fa-solid fa-xmark"></i></button>';
      grid.appendChild(card);
    });
  }

  const totalAtivos = meusAtivos.reduce((s, a) => s + (a.valor || 0), 0);
  const totalInv = meusInvestimentos.reduce((s, i) => s + (i.valor || 0), 0);
  const totalEl = document.getElementById('total-ativos');
  const invEl = document.getElementById('total-investimentos');
  const patEl = document.getElementById('total-patrimonio');
  if (totalEl) totalEl.textContent = formatCurrencyShort(totalAtivos);
  if (invEl) invEl.textContent = formatCurrencyShort(totalInv);
  if (patEl) patEl.textContent = formatCurrencyShort(totalAtivos + totalInv);
}

function renderMeusInvestimentos() {
  loadMeusInvestimentos();
  const container = document.getElementById('investimentos-list');
  const emptyEl = document.getElementById('investimentos-list-empty');
  if (!container) return;

  container.innerHTML = '';

  if (meusInvestimentos.length === 0) {
    if (emptyEl) emptyEl.style.display = '';
  } else {
    if (emptyEl) emptyEl.style.display = 'none';
    meusInvestimentos.forEach((inv, idx) => {
      const item = document.createElement('div');
      item.className = 'bill-item';
      item.innerHTML = '<div class="bill-info">' +
        '<div class="bill-icon" style="background: rgba(99,102,241,0.15); color: var(--accent-primary);"><i class="fa-solid fa-chart-line"></i></div>' +
        '<div><div class="bill-nome">' + escapeHTML(inv.nome) + '</div><div class="bill-venc">' + escapeHTML(inv.tipo) + '</div></div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span class="bill-valor" style="color: var(--accent-primary);">' + formatCurrencyShort(inv.valor) + '</span>' +
        '<button type="button" class="btn-delete-inline" data-remove-investimento="' + idx + '" title="Remover"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>';
      container.appendChild(item);
    });
  }

  const totalAtivos = meusAtivos.reduce((s, a) => s + (a.valor || 0), 0);
  const totalInv = meusInvestimentos.reduce((s, i) => s + (i.valor || 0), 0);
  const totalEl = document.getElementById('total-ativos');
  const invEl = document.getElementById('total-investimentos');
  const patEl = document.getElementById('total-patrimonio');
  if (totalEl) totalEl.textContent = formatCurrencyShort(totalAtivos);
  if (invEl) invEl.textContent = formatCurrencyShort(totalInv);
  if (patEl) patEl.textContent = formatCurrencyShort(totalAtivos + totalInv);
}

function openAddAtivoModal() {
  showFormModal({
    title: 'Adicionar ativo',
    fields: [
      { id: 'fc-nome', label: 'Nome', type: 'text', placeholder: 'Ex: Carro, Móvel, Celular' },
      { id: 'fc-valor', label: 'Valor estimado (R$)', type: 'number', placeholder: '0,00', step: '0.01' },
      { id: 'fc-tipo', label: 'Tipo', type: 'select', options: ['Veículo', 'Imóvel', 'Móvel', 'Eletrônico', 'Outro'] }
    ],
    onSubmit(values) {
      const nome = values['fc-nome'];
      if (!nome) return;
      const valor = parseFloat(values['fc-valor']) || 0;
      if (valor <= 0) { showToast('Informe um valor válido.', 'warning'); return; }
      const tipo = values['fc-tipo'];
      meusAtivos.push({ nome, valor, tipo, criadoEm: new Date().toISOString() });
      saveMeusAtivos();
      renderMeusAtivos();
      showToast('Ativo adicionado!', 'success');
    }
  });
}

function openAddInvestimentoModal() {
  showFormModal({
    title: 'Adicionar investimento',
    fields: [
      { id: 'fc-nome', label: 'Nome', type: 'text', placeholder: 'Ex: Poupança, CDB Itaú, Ações VALE' },
      { id: 'fc-valor', label: 'Valor aplicado (R$)', type: 'number', placeholder: '0,00', step: '0.01' },
      { id: 'fc-tipo', label: 'Tipo', type: 'select', options: ['Poupança', 'CDB', 'LCI/LCA', 'Ações', 'FIIs', 'ETFs', 'Tesouro Direto', 'Cripto', 'Outro'] }
    ],
    onSubmit(values) {
      const nome = values['fc-nome'];
      if (!nome) return;
      const valor = parseFloat(values['fc-valor']) || 0;
      if (valor <= 0) { showToast('Informe um valor válido.', 'warning'); return; }
      const tipo = values['fc-tipo'];
      meusInvestimentos.push({ nome, valor, tipo, criadoEm: new Date().toISOString() });
      saveMeusInvestimentos();
      renderMeusInvestimentos();
      showToast('Investimento adicionado!', 'success');
    }
  });
}

function removerAtivo(idx) {
  meusAtivos.splice(idx, 1);
  saveMeusAtivos();
  renderMeusAtivos();
  showToast('Ativo removido.', 'info');
}

function removerInvestimento(idx) {
  meusInvestimentos.splice(idx, 1);
  saveMeusInvestimentos();
  renderMeusInvestimentos();
  showToast('Investimento removido.', 'info');
}

// Inicialização
if (!isLoginPage()) {
  loadMetasPlano();
  renderMeusAtivos();
  renderMeusInvestimentos();
}


// ============================================================
// INVESTIMENTOS — Leitura em tempo real do Firebase
// ============================================================
const INVEST_DB_URL = 'https://planejamento-familiar-b3a1c-default-rtdb.firebaseio.com';

function carregarInvestimentos() {
  fetch(INVEST_DB_URL + '/investimentos.json')
    .then(r => r.json())
    .then(data => {
      if (data) {
        renderizarAcoes(data.acoes);
        renderizarFIIs(data.fiis);
        renderizarETFs(data.etfs);
        renderizarPortfolio(data.portfolio);
      }
    })
    .catch(err => console.error('Erro ao carregar investimentos:', err));
}

function renderizarAcoes(acoes) {
  const tbody = document.getElementById('acoesBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!acoes || acoes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state-small">Carregando dados...</td></tr>';
    return;
  }
  acoes.forEach(a => {
    const statusClass = (a.status || '').toLowerCase().includes('compr') ? 'comprar'
      : (a.status || '').toLowerCase().includes('evit') ? 'evitar' : 'neutro';
    tbody.innerHTML += '<tr>' +
      '<td class="td-codigo">' + escapeHTML(a.codigo) + '</td>' +
      '<td>' + escapeHTML(a.nome) + '</td>' +
      '<td class="td-preco">R$ ' + (a.preco != null ? Number(a.preco).toFixed(2) : '-') + '</td>' +
      '<td>' + (((a.dy || 0) * 100).toFixed(2)) + '%</td>' +
      '<td><span class="td-status ' + statusClass + '">' + escapeHTML(a.status) + '</span></td>' +
    '</tr>';
  });
}

function renderizarFIIs(fiis) {
  const tbody = document.getElementById('fiisBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!fiis || fiis.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state-small">Carregando dados...</td></tr>';
    return;
  }
  fiis.forEach(f => {
    const statusClass = (f.status || '').toLowerCase().includes('compr') ? 'comprar'
      : (f.status || '').toLowerCase().includes('evit') ? 'evitar' : 'neutro';
    tbody.innerHTML += '<tr>' +
      '<td class="td-codigo">' + escapeHTML(f.codigo) + '</td>' +
      '<td>' + (f.pvp != null ? Number(f.pvp).toFixed(2) : '-') + '</td>' +
      '<td>' + ((f.desconto || 0).toFixed(1)) + '%</td>' +
      '<td>' + (((f.dy || 0) * 100).toFixed(2)) + '%</td>' +
      '<td><span class="td-status ' + statusClass + '">' + escapeHTML(f.status) + '</span></td>' +
    '</tr>';
  });
}

function renderizarETFs(etfs) {
  const tbody = document.getElementById('etfsBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!etfs || etfs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state-small">Carregando dados...</td></tr>';
    return;
  }
  etfs.forEach(e => {
    const statusClass = (e.status || '').toLowerCase().includes('compr') ? 'comprar'
      : (e.status || '').toLowerCase().includes('evit') ? 'evitar' : 'neutro';
    tbody.innerHTML += '<tr>' +
      '<td class="td-codigo">' + escapeHTML(e.codigo) + '</td>' +
      '<td>' + escapeHTML(e.indice || e.nome || '-') + '</td>' +
      '<td class="td-preco">R$ ' + (e.preco != null ? Number(e.preco).toFixed(2) : '-') + '</td>' +
      '<td>' + (((e.dy || 0) * 100).toFixed(2)) + '%</td>' +
      '<td><span class="td-status ' + statusClass + '">' + escapeHTML(e.status) + '</span></td>' +
    '</tr>';
  });
}

let portfolioChartInstance = null;

function renderizarPortfolio(portfolio) {
  if (!portfolio || typeof Chart === 'undefined') return;
  const labels = [];
  const values = [];
  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
  Object.entries(portfolio).forEach(([classe, dados], i) => {
    labels.push(classe.charAt(0).toUpperCase() + classe.slice(1));
    values.push(dados.alocacao * 100);
  });
  const ctx = document.getElementById('portfolioChart');
  if (!ctx) return;
  if (portfolioChartInstance) portfolioChartInstance.destroy();
  portfolioChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors.slice(0, values.length) }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333', font: { size: 13 } } }
      }
    }
  });
}

function configurarListenerInvestimentos() {
  if (!firebaseAvailable || !db) {
    carregarInvestimentos();
    return;
  }
  const dbRef = db.ref('investimentos');
  dbRef.on('value', snapshot => {
    const data = snapshot.val();
    if (data) {
      renderizarAcoes(data.acoes);
      renderizarFIIs(data.fiis);
      renderizarETFs(data.etfs);
      renderizarPortfolio(data.portfolio);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  configurarListenerInvestimentos();
  carregarLimitesGastos();
  maybeShowUpdateModal();
  const fbText = document.getElementById('feedback-text');
  if (fbText) fbText.addEventListener('input', () => {
    const c = document.getElementById('feedback-counter');
    if (c) c.textContent = fbText.value.length;
  });
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch((e) => { console.warn('[Pulso] serviceWorker registro falhou:', e); });
  }
});

// — Update modal v3.1.9 (aparece 1x) —
function maybeShowUpdateModal() {
  if (isLoginPage()) return;
  const KEY = 'pulso-update-3.1.9-seen';
  if (localStorage.getItem(KEY)) return;
  setTimeout(() => {
    const el = document.getElementById('update-modal-overlay');
    if (el) el.classList.add('active');
  }, 800);
}
function closeUpdateModal() {
  const el = document.getElementById('update-modal-overlay');
  if (el) el.classList.remove('active');
  localStorage.setItem('pulso-update-3.1.9-seen', '1');
}
// fechar modal de update com ESC também marca como visto
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const upd = document.getElementById('update-modal-overlay');
    if (upd && upd.classList.contains('active')) closeUpdateModal();
  }
});

// — Feedback —
function openFeedbackModal() {
  const el = document.getElementById('feedback-modal-overlay');
  if (el) { el.classList.add('active'); setTimeout(() => document.getElementById('feedback-text')?.focus(), 100); }
}
function closeFeedbackModal() {
  const el = document.getElementById('feedback-modal-overlay');
  if (el) el.classList.remove('active');
}
function submitFeedback() {
  const ta = document.getElementById('feedback-text');
  const btn = document.getElementById('feedback-submit-btn');
  const msg = ta ? ta.value.trim() : '';
  if (!msg) { showToast('Escreva seu feedback primeiro.', 'warning'); return; }
  if (msg.length > 1000) { showToast('Máximo 1000 caracteres.', 'warning'); return; }
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }
  const payload = {
    uid: currentUser ? currentUser.uid : 'anon',
    displayName: currentUser ? (currentUser.displayName || '') : '',
    email: currentUser ? (currentUser.email || '') : '',
    photoURL: currentUser ? (currentUser.photoURL || '') : '',
    message: msg,
    version: '3.1.9',
    createdAt: new Date().toISOString(),
    userAgent: navigator.userAgent.slice(0,300)
  };
  const done = () => {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar'; }
    if (ta) ta.value = '';
    const c = document.getElementById('feedback-counter'); if (c) c.textContent = '0';
    closeFeedbackModal();
    showToast('Obrigado pelo feedback! 💜', 'success');
  };
  const fail = (e) => {
    console.warn('[Pulso] feedback falhou:', e);
    showToast('Falha ao enviar. Tente novamente.', 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar'; }
  };
  try {
    if (db && currentUser && storageMode === 'rtdb') {
      db.ref('feedbacks').push(payload).then(done).catch(fail);
    } else if (db && currentUser) {
      // sem RTDB mas com auth: tenta mesmo assim
      db.ref('feedbacks').push(payload).then(done).catch(() => {
        // fallback local
        const arr = JSON.parse(localStorage.getItem('pulso-feedbacks') || '[]');
        arr.push(payload); localStorage.setItem('pulso-feedbacks', JSON.stringify(arr));
        done();
      });
    } else {
      const arr = JSON.parse(localStorage.getItem('pulso-feedbacks') || '[]');
      arr.push(payload); localStorage.setItem('pulso-feedbacks', JSON.stringify(arr));
      // tenta RTDB anonimizado se houver db
      if (db) db.ref('feedbacks').push(payload).catch(()=>{});
      done();
    }
  } catch(e) { fail(e); }
}

// ============================================================
// LIMITES DE GASTOS POR CATEGORIA
// ============================================================
let limitesCache = {};

function carregarLimitesGastos() {
  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/limites_gastos').on('value', snap => {
      limitesCache = snap.val() || {};
      renderizarLimites();
    });
  } else {
    const saved = localStorage.getItem(storageKey() + '_limites_gastos');
    limitesCache = saved ? JSON.parse(saved) : {};
    renderizarLimites();
  }
}

function renderizarLimites() {
  const container = document.getElementById('limites-categorias');
  if (!container) return;

  const categories = {};
  transactions.forEach(t => {
    if (t.type === 'saida' && t.cat) {
      categories[t.cat] = (categories[t.cat] || 0) + Math.abs(parseFloat(t.val) || 0);
    }
  });

  const catNames = Object.keys(categories).sort();
  if (catNames.length === 0) {
    catNames.push('Gastos Essenciais', 'Pessoais');
  }

  container.innerHTML = catNames.map(cat => {
    const gasto = categories[cat] || 0;
    const limite = parseFloat(limitesCache[cat]) || 0;
    const pct = limite > 0 ? Math.round((gasto / limite) * 100) : 0;
    const pctClass = limite <= 0 ? 'ok' : pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok';
    return `<div class="limite-item">
      <span class="limite-cat-name">${escapeHTML(cat)}</span>
      <div class="limite-input-wrap">
        <span>R$</span>
        <input type="number" class="limite-input" data-cat="${escapeHTML(cat)}" value="${limite > 0 ? limite.toFixed(2) : ''}" placeholder="0,00" step="50" min="0">
      </div>
      ${limite > 0 ? `<span class="limite-pct ${pctClass}">${pct}%</span>` : ''}
    </div>`;
  }).join('');
}

function salvarLimitesGastos() {
  const inputs = document.querySelectorAll('.limite-input');
  const novosLimites = {};
  inputs.forEach(input => {
    const cat = input.dataset.cat;
    const val = parseFloat(input.value) || 0;
    if (val > 0) novosLimites[cat] = val;
  });

  limitesCache = novosLimites;

  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/limites_gastos').set(novosLimites)
      .then(() => showToast('Limites salvos no Firebase!', 'success'))
      .catch(err => showToast('Erro ao salvar: ' + err.message, 'error'));
  } else {
    localStorage.setItem(storageKey() + '_limites_gastos', JSON.stringify(novosLimites));
    showToast('Limites salvos localmente!', 'success');
  }

  renderizarLimites();
}

// ============================================================
// GRÁFICO DE RECEITAS — Doughnut Chart.js
// ============================================================
let receitasChartInstance = null;

function renderReceitasChart(incomeByCategory) {
  const canvas = document.getElementById('receitas-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  const labels = Object.keys(incomeByCategory);
  const values = Object.values(incomeByCategory);

  if (labels.length === 0) {
    canvas.style.display = 'none';
    const wrap = canvas.parentElement;
    if (wrap && !wrap.querySelector('.empty-state-small')) {
      wrap.innerHTML = '<div class="empty-state-small"><i class="fa-solid fa-chart-pie"></i><p>Nenhuma receita registrada</p></div>';
    }
    return;
  }

  canvas.style.display = 'block';
  const colors = [
    '#22c55e', '#4ade80', '#86efac', '#a3e635',
    '#facc15', '#fb923c', '#38bdf8', '#818cf8'
  ];

  if (receitasChartInstance) receitasChartInstance.destroy();

  receitasChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, values.length),
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'rgba(255,255,255,0.7)',
            padding: 12,
            usePointStyle: true,
            pointStyleWidth: 10,
            font: { size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
              return ctx.label + ': R$ ' + ctx.raw.toFixed(2) + ' (' + pct + '%)';
            }
          }
        }
      }
    }
  });
}

// ============================================================
// DONUT SPLIT — Divisão de Gastos por Categoria (anel)
// ============================================================
let divisaoChartInstance = null;

const DIVISAO_COLORS = [
  '#6c7cff', '#24c38b', '#ff6b6b', '#ffb454', '#2196f3',
  '#9b59b6', '#e91e63', '#00bcd4', '#ff9800', '#8bc34a',
  '#3f51b5', '#009688', '#f44336', '#cddc39', '#795548'
];

function renderDivisaoChart(categories, totalExpense) {
  const canvas = document.getElementById('divisao-chart');
  const legend = document.getElementById('divisao-legend');
  const totalEl = document.getElementById('divisao-total');
  if (!canvas || typeof Chart === 'undefined') return;

  const catKeys = Object.keys(categories).sort((a, b) => categories[b] - categories[a]);

  if (catKeys.length === 0) {
    canvas.style.display = 'none';
    if (legend) legend.innerHTML = '<div class="donut-legend-empty">Nenhuma despesa registrada.</div>';
    if (totalEl) totalEl.textContent = 'R$ 0,00';
    return;
  }

  canvas.style.display = 'block';
  const values = catKeys.map(c => categories[c]);
  const colors = catKeys.map((_, i) => DIVISAO_COLORS[i % DIVISAO_COLORS.length]);

  if (divisaoChartInstance) divisaoChartInstance.destroy();

  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#fff';

  divisaoChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: catKeys,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#111c30',
        hoverBorderColor: textColor,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '58%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          titleFont: { weight: '700' },
          bodyFont: { size: 13 },
          padding: 10,
          cornerRadius: 10,
          callbacks: {
            label: function(ctx) {
              const pct = totalExpense > 0 ? ((ctx.raw / totalExpense) * 100).toFixed(1) : 0;
              return ' R$ ' + ctx.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' (' + pct + '%)';
            }
          }
        }
      },
      animation: { animateRotate: true, duration: 800 }
    }
  });

  // Total no centro
  if (totalEl) {
    totalEl.textContent = 'R$ ' + totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }

  // Legenda customizada
  if (legend) {
    legend.innerHTML = catKeys.map((cat, i) => {
      const val = categories[cat];
      const pct = totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(1) : 0;
      const color = colors[i];
      return '<div class="donut-legend-item">' +
        '<span class="donut-legend-color" style="background:' + color + ';"></span>' +
        '<div class="donut-legend-info">' +
          '<div class="donut-legend-name">' + escapeHTML(cat) + '</div>' +
          '<div class="donut-legend-meta">R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '</div>' +
        '</div>' +
        '<span class="donut-legend-pct">' + pct + '%</span>' +
      '</div>';
    }).join('');
  }
}

// ============================================================
// UPLOAD ZONE — Drag & Drop + File Select
// ============================================================
let selectedFile = null;

function initUploadZone() {
  const zone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('excel-file-input');
  if (!zone || !fileInput) return;

  zone.addEventListener('click', () => fileInput.click());

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('drag-over');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelection(files[0]);
  });
}

function handleFileSelect(event) {
  const files = event.target.files;
  if (files.length > 0) handleFileSelection(files[0]);
}

function handleFileSelection(file) {
  if (!file.name.match(/\.xlsx?$/i)) {
    showToast('Selecione um arquivo .xlsx ou .xls', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('Arquivo muito grande (máx. 5MB)', 'error');
    return;
  }

  selectedFile = file;

  const preview = document.getElementById('file-preview');
  const fileName = document.getElementById('file-name');
  const importBtn = document.getElementById('import-btn');
  const zone = document.getElementById('upload-zone');

  if (preview) preview.style.display = 'flex';
  if (fileName) fileName.textContent = file.name;
  if (importBtn) importBtn.disabled = false;
  if (zone) zone.style.display = 'none';
}

function removeSelectedFile() {
  selectedFile = null;
  const preview = document.getElementById('file-preview');
  const importBtn = document.getElementById('import-btn');
  const zone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('excel-file-input');

  if (preview) preview.style.display = 'none';
  if (importBtn) importBtn.disabled = true;
  if (zone) zone.style.display = 'block';
  if (fileInput) fileInput.value = '';
}

document.addEventListener('DOMContentLoaded', initUploadZone);

// ============================================================
// COMPARTILHAR CONTA
// ============================================================
let sharedMembers = [];

function openShareModal() {
  const overlay = document.getElementById('share-modal-overlay');
  if (overlay) overlay.classList.add('active');
  loadSharedMembers();
}

function closeShareModal() {
  const overlay = document.getElementById('share-modal-overlay');
  if (overlay) overlay.classList.remove('active');
}

function loadSharedMembers() {
  const container = document.getElementById('share-members-list');
  if (!container) return;
  
  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/sharedWith').on('value', snap => {
      sharedMembers = snap.val() || [];
      if (!Array.isArray(sharedMembers)) sharedMembers = [];
      renderSharedMembers();
    });
  } else {
    const saved = localStorage.getItem(storageKey() + '_shared_members');
    sharedMembers = saved ? JSON.parse(saved) : [];
    renderSharedMembers();
  }
}

function renderSharedMembers() {
  const container = document.getElementById('share-members-list');
  if (!container) return;
  
  // Always show current user as owner
  const ownerName = currentUser ? (currentUser.displayName || currentUser.email || 'Proprietário') : 'Proprietário';
  const ownerEmail = currentUser ? (currentUser.email || '') : '';
  const ownerInitial = ownerName.charAt(0).toUpperCase();
  
  let html = `<div class="share-member-item">
    <div class="share-member-info">
      <div class="share-member-avatar">${escapeHTML(ownerInitial)}</div>
      <div>
        <div class="share-member-name">${escapeHTML(ownerName)} <span style="font-size:0.72rem;color:var(--accent-success);font-weight:700;">(você)</span></div>
        <div class="share-member-email">${escapeHTML(ownerEmail)}</div>
      </div>
    </div>
    <span class="share-member-role">Proprietário</span>
  </div>`;
  
  sharedMembers.forEach((m, idx) => {
    const initial = (m.name || m.email || '?').charAt(0).toUpperCase();
    const roleLabel = m.role === 'editor' ? 'Editor' : 'Visualizador';
    html += `<div class="share-member-item">
      <div class="share-member-info">
        <div class="share-member-avatar">${escapeHTML(initial)}</div>
        <div>
          <div class="share-member-name">${escapeHTML(m.name || m.email)}</div>
          <div class="share-member-email">${escapeHTML(m.email)}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="share-member-role">${roleLabel}</span>
        <button type="button" class="share-member-remove" data-idx="${idx}" title="Remover">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>`;
  });
  
  container.innerHTML = html;
  container.querySelectorAll('.share-member-remove[data-idx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.getAttribute('data-idx'), 10);
      if (!isNaN(i)) removeSharedMember(i);
    });
  });
}

function sendShareInvite() {
  const emailInput = document.getElementById('share-email-input');
  const roleRadio = document.querySelector('input[name="share-role"]:checked');
  if (!emailInput || !roleRadio) return;
  
  const email = emailInput.value.trim().toLowerCase();
  const role = roleRadio.value;
  
  if (!email) {
    showToast('Digite um email.', 'error');
    return;
  }
  if (!email.includes('@') || !email.includes('.')) {
    showToast('Email inválido.', 'error');
    return;
  }
  if (currentUser && email === currentUser.email) {
    showToast('Você não pode convidar a si mesmo.', 'error');
    return;
  }
  
  // Check if already invited
  if (sharedMembers.some(m => m.email === email)) {
    showToast('Este email já foi convidado.', 'error');
    return;
  }
  
  const newMember = { email, name: email.split('@')[0], role, invitedAt: Date.now() };
  sharedMembers.push(newMember);
  
  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/sharedWith').set(sharedMembers)
      .then(() => showToast('Convite enviado!', 'success'))
      .catch(err => showToast('Erro: ' + err.message, 'error'));
  } else {
    localStorage.setItem(storageKey() + '_shared_members', JSON.stringify(sharedMembers));
    showToast('Membro adicionado!', 'success');
  }
  
  emailInput.value = '';
  renderSharedMembers();
}

function removeSharedMember(idx) {
  sharedMembers.splice(idx, 1);
  
  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/sharedWith').set(sharedMembers)
      .then(() => showToast('Membro removido.', 'success'))
      .catch(err => showToast('Erro: ' + err.message, 'error'));
  } else {
    localStorage.setItem(storageKey() + '_shared_members', JSON.stringify(sharedMembers));
    showToast('Membro removido.', 'success');
  }
  
  renderSharedMembers();
}

// ============================================================
// CATEGORIAS CUSTOMIZÁVEIS
// ============================================================
const DEFAULT_CATEGORIES = {
  income: ['Salário', 'Dividendos', 'Renda Extra', 'Outros Ganhos'],
  expense: ['Gastos Essenciais', 'Pessoais', 'Investimento']
};

let customCategories = { income: [], expense: [] };

function loadCategories() {
  const saved = localStorage.getItem(storageKey() + '_categories');
  if (saved) {
    try { customCategories = JSON.parse(saved); } catch(e) {}
  }
  // Merge with defaults (avoid duplicates)
  DEFAULT_CATEGORIES.income.forEach(c => {
    if (!customCategories.income.includes(c)) customCategories.income.push(c);
  });
  DEFAULT_CATEGORIES.expense.forEach(c => {
    if (!customCategories.expense.includes(c)) customCategories.expense.push(c);
  });
  renderCategoriesSummary();
}

function saveCategoriesToStorage() {
  localStorage.setItem(storageKey() + '_categories', JSON.stringify(customCategories));
  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/categories').set(customCategories);
  }
  renderCategoriesSummary();
  updateTransactionModalCategories();
}

function renderCategoriesSummary() {
  const container = document.getElementById('categories-summary');
  if (!container) return;
  const all = [...customCategories.income, ...customCategories.expense];
  container.innerHTML = all.map(c => '<span class="cat-mini-tag">' + escapeHTML(c) + '</span>').join('');
}

function updateTransactionModalCategories() {
  const select = document.getElementById('m-cat');
  if (!select) return;

  const incomeGroup = select.querySelector('optgroup[label="Entradas"]');
  const expenseGroup = select.querySelector('optgroup[label="Saídas"]');

  if (incomeGroup) {
    incomeGroup.innerHTML = customCategories.income.map(c =>
      '<option value="' + escapeHTML(c) + '">' + escapeHTML(c) + '</option>'
    ).join('');
  }
  if (expenseGroup) {
    expenseGroup.innerHTML = customCategories.expense.map(c =>
      '<option value="' + escapeHTML(c) + '">' + escapeHTML(c) + '</option>'
    ).join('');
  }
}

function openCategoriesModal() {
  loadCategories();
  const overlay = document.getElementById('categories-modal-overlay');
  if (overlay) overlay.classList.add('active');
  renderCategoriesList('income');
  renderCategoriesList('expense');
}

function closeCategoriesModal() {
  const overlay = document.getElementById('categories-modal-overlay');
  if (overlay) overlay.classList.remove('active');
}

function renderCategoriesList(type) {
  const container = document.getElementById(type === 'income' ? 'income-categories-list' : 'expense-categories-list');
  if (!container) return;
  const cats = customCategories[type] || [];
  const defaults = DEFAULT_CATEGORIES[type] || [];

  container.innerHTML = cats.map(c => {
    const isDefault = defaults.includes(c);
    return '<span class="cat-tag ' + (isDefault ? 'default' : '') + '">' +
      escapeHTML(c) +
      (isDefault ? '' : '<button type="button" class="cat-remove" data-cat-type="' + escapeHTML(type) + '" data-cat-name="' + escapeHTML(c) + '"><i class="fa-solid fa-xmark"></i></button>') +
    '</span>';
  }).join('');
  container.querySelectorAll('.cat-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.getAttribute('data-cat-type');
      const n = btn.getAttribute('data-cat-name');
      if (t && n) removeCategory(t, n);
    });
  });
}

function addCategory(type) {
  const input = document.getElementById(type === 'income' ? 'new-income-cat' : 'new-expense-cat');
  if (!input) return;
  const name = input.value.trim();
  if (!name) return;

  if (!customCategories[type]) customCategories[type] = [];
  if (customCategories[type].includes(name)) {
    showToast('Categoria já existe.', 'error');
    return;
  }
  customCategories[type].push(name);
  input.value = '';
  renderCategoriesList(type);
}

function removeCategory(type, name) {
  if (!customCategories[type]) return;
  customCategories[type] = customCategories[type].filter(c => c !== name);
  renderCategoriesList(type);
}

function saveCategories() {
  saveCategoriesToStorage();
  closeCategoriesModal();
  showToast('Categorias salvas!', 'success');
}

// ============================================================
// ONBOARDING — Category Templates
// ============================================================
const CATEGORY_TEMPLATES = {
  simples: {
    income: ['Salário', 'Freelance', 'Outros Ganhos'],
    expense: ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Pessoal', 'Outros']
  },
  detalhado: {
    income: ['Salário', 'Freelance', 'Dividendos', 'Aluguel Recebido', 'Renda Extra', 'Outros Ganhos'],
    expense: ['Aluguel', 'Condomínio', 'Contas (Luz/Água/Gás)', 'Internet/Telefone', 'Mercado', 'Restaurante', 'Transporte', 'Combustível', 'Saúde', 'Educação', 'Lazer', 'Vestuário', 'Compras', 'Assinaturas', 'Seguros', 'Impostos', 'Presentes', 'Doações', 'Viagens', 'Manutenção', 'Pet', 'Outros']
  },
  investidor: {
    income: ['Salário', 'Freelance', 'Dividendos', 'Rendimentos', 'Aluguel Recebido', 'Juros', 'Outros Ganhos'],
    expense: ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Renda Fixa', 'Ações', 'FIIs', 'ETFs', 'Criptomoedas', 'Poupança', 'Reserva de Emergência', 'Seguros', 'Impostos', 'Outros']
  }
};

function showOnboarding() {
  // Don't show if user already selected a template (localStorage is primary guard)
  const localTemplate = localStorage.getItem(storageKey() + '_template');
  if (localTemplate) return;
  const overlay = document.getElementById('onboarding-overlay');
  if (overlay) overlay.classList.add('active');
}

function closeOnboarding() {
  const overlay = document.getElementById('onboarding-overlay');
  if (overlay) overlay.classList.remove('active');
}

function selectTemplate(templateId) {
  const template = CATEGORY_TEMPLATES[templateId];
  if (!template) return;
  
  customCategories.income = [...template.income];
  customCategories.expense = [...template.expense];
  
  saveCategoriesToStorage();
  
  // Save template + categories to Firebase
  if (storageMode === 'rtdb' && db && currentUser) {
    const uid = currentUser.uid;
    db.ref('users/' + uid + '/profile').update({
      template: templateId,
      onboardingDone: true
    });
    db.ref('users/' + uid + '/categories').set(customCategories)
      .catch(err => console.warn('Erro ao salvar template:', err));
  }
  
  // Also save to localStorage as fallback
  localStorage.setItem(storageKey() + '_template', templateId);
  
  const overlay = document.getElementById('onboarding-overlay');
  if (overlay) overlay.classList.remove('active');
  
  const msg = customCategories.expense.length > 7 
    ? 'Template "' + templateId + '" aplicado! Categorias configuradas.'
    : 'Template aplicado! Você pode alterar depois em Dashboard > Categorias > Trocar template.';
  showToast(msg, 'success');
  updateUI();
}

// loadCategories is called from onAuthStateChanged after auth resolves
// (not on DOMContentLoaded to avoid race with Firebase data)

// ============================================================
// LANÇAMENTOS — Extrato Bancário
// ============================================================
let lancMonth = new Date().getMonth();
let lancYear = new Date().getFullYear();
let lancFilter = 'all';
let lancSearch = '';
let lancCatFilter = 'all';
let lancUserFilter = 'all';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const CATEGORY_COLORS = [
  { bg: 'rgba(36, 195, 139, 0.15)', fg: '#24c38b' },
  { bg: 'rgba(108, 124, 255, 0.15)', fg: '#6c7cff' },
  { bg: 'rgba(255, 107, 107, 0.15)', fg: '#ff6b6b' },
  { bg: 'rgba(255, 180, 84, 0.15)', fg: '#ffb454' },
  { bg: 'rgba(33, 150, 243, 0.15)', fg: '#2196f3' },
  { bg: 'rgba(156, 39, 176, 0.15)', fg: '#9c27b0' },
  { bg: 'rgba(255, 127, 179, 0.15)', fg: '#ff7fb3' },
  { bg: 'rgba(0, 188, 212, 0.15)', fg: '#00bcd4' },
  { bg: 'rgba(139, 195, 74, 0.15)', fg: '#8bc34a' },
  { bg: 'rgba(255, 152, 0, 0.15)', fg: '#ff9800' },
  { bg: 'rgba(121, 85, 72, 0.15)', fg: '#795548' },
  { bg: 'rgba(96, 125, 139, 0.15)', fg: '#607d8b' }
];

function getCategoryColor(cat) {
  let hash = 0;
  const str = String(cat || '');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

function getCategoryIcon(cat) {
  const c = (cat || '').toLowerCase();
  if (c.includes('salário') || c.includes('salario') || c.includes('renda')) return 'fa-solid fa-money-bill-wave';
  if (c.includes('dividendo')) return 'fa-solid fa-chart-line';
  if (c.includes('invest') || c.includes('poupan') || c.includes('aplicaç')) return 'fa-solid fa-piggy-bank';
  if (c.includes('aliment') || c.includes('mercado') || c.includes('superm')) return 'fa-solid fa-cart-shopping';
  if (c.includes('moradia') || c.includes('aluguel') || c.includes('condom') || c.includes('essenciais')) return 'fa-solid fa-house';
  if (c.includes('transporte') || c.includes('combustível') || c.includes('combustiv') || c.includes('gasolina')) return 'fa-solid fa-car';
  if (c.includes('saúde') || c.includes('saude') || c.includes('farmácia') || c.includes('farmacia') || c.includes('médic')) return 'fa-solid fa-heart-pulse';
  if (c.includes('educação') || c.includes('educacao') || c.includes('escola') || c.includes('curso')) return 'fa-solid fa-graduation-cap';
  if (c.includes('lazer') || c.includes('entretenimento') || c.includes('viagem') || c.includes(' Spaß')) return 'fa-solid fa-film';
  if (c.includes('pessoais') || c.includes('pessoa')) return 'fa-solid fa-user';
  if (c.includes('cartão') || c.includes('cartao') || c.includes('fatura')) return 'fa-solid fa-credit-card';
  if (c.includes('salúde') || c.includes('vacina')) return 'fa-solid fa-syringe';
  if (c.includes('pet') || c.includes('animal')) return 'fa-solid fa-paw';
  if (c.includes('extra') || c.includes('freelance') || c.includes('bico')) return 'fa-solid fa-briefcase';
  if (c.includes('outro')) return 'fa-solid fa-ellipsis';
  return 'fa-solid fa-receipt';
}

function renderLancamentos() {
  const listEl = document.getElementById('lanc-list');
  const monthNameEl = document.getElementById('lanc-month-name');
  if (!listEl) return;

  const formatCurrency = v => 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  // Month name
  if (monthNameEl) {
    monthNameEl.textContent = MONTH_NAMES[lancMonth] + ' ' + lancYear;
  }

  // Filter transactions by month
  let filtered = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === lancMonth && d.getFullYear() === lancYear;
  });

  // Type filter
  if (lancFilter === 'entrada') {
    filtered = filtered.filter(t => t.type === 'entrada');
  } else if (lancFilter === 'saida') {
    filtered = filtered.filter(t => t.type === 'saida');
  }

  // Search filter
  if (lancSearch) {
    const q = lancSearch.toLowerCase();
    filtered = filtered.filter(t =>
      (t.desc || '').toLowerCase().includes(q) ||
      (t.cat || '').toLowerCase().includes(q)
    );
  }

  // Category filter
  if (lancCatFilter !== 'all') {
    filtered = filtered.filter(t => t.cat === lancCatFilter);
  }

  // User filter
  if (lancUserFilter !== 'all') {
    filtered = filtered.filter(t => (t.user || 'Compartilhado') === lancUserFilter);
  }

  // Sort by date descending, then by type
  filtered.sort((a, b) => {
    const da = new Date(a.date);
    const db = new Date(b.date);
    if (db.getTime() !== da.getTime()) return db - da;
    if (a.type === 'entrada' && b.type !== 'entrada') return -1;
    if (a.type !== 'entrada' && b.type === 'entrada') return 1;
    return 0;
  });

  // Calculate totals
  let totalEntradas = 0;
  let totalSaidas = 0;
  let totalSaidasNoSaldo = 0;
  filtered.forEach(t => {
    if (t.type === 'entrada') totalEntradas += t.val;
    else {
      totalSaidas += t.val;
      if (impactsBalance(t)) totalSaidasNoSaldo += t.val;
    }
  });
  const saldoPeriodo = totalEntradas - totalSaidasNoSaldo;

  // Update summary stats
  const entradasEl = document.getElementById('lanc-total-entradas');
  const saidasEl = document.getElementById('lanc-total-saidas');
  const saldoEl = document.getElementById('lanc-saldo-periodo');

  if (entradasEl) entradasEl.textContent = formatCurrency(totalEntradas);
  if (saidasEl) saidasEl.textContent = formatCurrency(totalSaidas);
  if (saldoEl) {
    saldoEl.textContent = formatCurrency(saldoPeriodo);
    saldoEl.style.color = saldoPeriodo >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
  }

  // Populate category dropdown
  const catSelect = document.getElementById('lanc-cat-select');
  if (catSelect) {
    const cats = new Set();
    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getMonth() === lancMonth && d.getFullYear() === lancYear) {
        cats.add(t.cat);
      }
    });
    const currentVal = catSelect.value;
    catSelect.innerHTML = '<option value="all">Todas as categorias</option>';
    Array.from(cats).sort().forEach(cat => {
      catSelect.innerHTML += '<option value="' + escapeHTML(cat) + '">' + escapeHTML(cat) + '</option>';
    });
    catSelect.value = currentVal || 'all';
  }

  // Populate user dropdown
  const userSelect = document.getElementById('lanc-user-select');
  if (userSelect) {
    const users = new Set();
    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getMonth() === lancMonth && d.getFullYear() === lancYear) {
        users.add(t.user || 'Compartilhado');
      }
    });
    const currentUserVal = userSelect.value;
    userSelect.innerHTML = '<option value="all">Todos os usuários</option>';
    if (users.size > 1) {
      Array.from(users).sort().forEach(user => {
        userSelect.innerHTML += '<option value="' + escapeHTML(user) + '">' + escapeHTML(user) + '</option>';
      });
      userSelect.parentElement.style.display = '';
    } else {
      userSelect.parentElement.style.display = 'none';
    }
    userSelect.value = currentUserVal || 'all';
  }

  // Render list
  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="lanc-empty"><i class="fa-solid fa-file-invoice"></i><p>Nenhum lançamento encontrado para este período.</p></div>';
    return;
  }

  // Group by date
  const groups = {};
  filtered.forEach(t => {
    const d = new Date(t.date);
    const key = d.toISOString().split('T')[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  let html = '';
  Object.keys(groups).sort((a, b) => new Date(b) - new Date(a)).forEach(dateKey => {
    const d = new Date(dateKey + 'T12:00:00');
    const dayNum = d.getDate();
    const weekday = WEEKDAY_NAMES[d.getDay()];
    const monthShort = d.toLocaleDateString('pt-BR', { month: 'short' });
    const dateLabel = weekday + ', ' + dayNum + ' de ' + monthShort;

    html += '<div class="lanc-date-group">';
    html += '<div class="lanc-date-header"><i class="fa-regular fa-calendar"></i>' + escapeHTML(dateLabel) + '</div>';

    groups[dateKey].forEach(t => {
      const isEntrada = t.type === 'entrada';
      const typeClass = isEntrada ? 'entrada' : 'saida';
      const icon = getCategoryIcon(t.cat);
      const catColor = getCategoryColor(t.cat);
      const sign = isEntrada ? '+' : '-';
      const parcelaTag = t.totalParcelas ? ' <span class="t-user-tag">' + t.parcela + '/' + t.totalParcelas + '</span>' : '';
      const payMeta = !isEntrada
        ? '<span>' + (t.paymentMethod === 'credito'
          ? ('Crédito' + (t.cardName ? (' · ' + escapeHTML(t.cardName)) : ''))
          : 'Débito') + '</span>'
        : '';

      html += '<div class="lanc-item">';
      html += '<div class="lanc-item-icon ' + typeClass + '"><i class="' + icon + '"></i></div>';
      html += '<div class="lanc-item-info">';
      html += '<div class="lanc-item-desc">' + escapeHTML(t.desc) + parcelaTag + '</div>';
      html += '<div class="lanc-item-meta">';
      html += '<span class="cat-badge" style="background:' + catColor.bg + ';color:' + catColor.fg + ';">' + escapeHTML(t.cat) + '</span>';
      html += payMeta;
      html += '<span>' + escapeHTML(t.user) + '</span>';
      html += '</div>';
      html += '</div>';
      html += '<div class="lanc-item-amount ' + typeClass + '">' + sign + ' ' + formatCurrency(t.val) + '</div>';
      html += '</div>';
    });

    // Day total
    let dayTotal = 0;
    groups[dateKey].forEach(t => {
      if (t.type === 'entrada') dayTotal += t.val;
      else dayTotal -= t.val;
    });
    const dayTotalColor = dayTotal >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
    html += '<div class="lanc-total-bar"><span>Total do dia:</span><span style="color:' + dayTotalColor + ';">' + (dayTotal >= 0 ? '+' : '') + ' ' + formatCurrency(Math.abs(dayTotal)) + '</span></div>';

    html += '</div>';
  });

  listEl.innerHTML = html;
}

function changeLancMonth(delta) {
  lancMonth += delta;
  if (lancMonth > 11) { lancMonth = 0; lancYear++; }
  if (lancMonth < 0) { lancMonth = 11; lancYear--; }
  renderLancamentos();
}

function setLancFilter(type) {
  lancFilter = type;
  document.querySelectorAll('.lanc-chip').forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-filter') === type);
  });
  renderLancamentos();
}

function setLancCatFilter(cat) {
  lancCatFilter = cat;
  renderLancamentos();
}

function setLancUserFilter(user) {
  lancUserFilter = user;
  renderLancamentos();
}

function onLancSearch(query) {
  lancSearch = query.trim();
  renderLancamentos();
}
