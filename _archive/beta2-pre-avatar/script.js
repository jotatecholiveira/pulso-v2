// ============================================================
// FINANCO — Orçamento Familiar Compartilhado
// v2.0 — Script consolidado e limpo
// ============================================================

// 1. CONFIGURAÇÃO FIREBASE
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
let currentFilter = 'all';
let currentUser = null;
let storageMode = 'local';
let dbListener = null;
let planoListener = null;
let connectionListener = null;
let planoCache = null;

try {
  if (window.firebase) {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
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
function getStoredTheme() { return localStorage.getItem('financo-theme') || 'dark'; }
function applyTheme(theme) {
  document.body.classList.toggle('light-theme', theme === 'light');
  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.textContent = theme === 'light' ? '☀️' : '🌙';
}
function setTheme(theme) {
  localStorage.setItem('financo-theme', theme);
  applyTheme(theme);
}
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const next = document.body.classList.contains('light-theme') ? 'dark' : 'light';
    setTheme(next);
  });
}
applyTheme(getStoredTheme());

// 5. CHAVES DE ARMAZENAMENTO
function currentUid() { return currentUser ? currentUser.uid : null; }
function storageKey() { return 'financo_transactions_' + (currentUid() || 'anonymous'); }

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
    totalParcelas: t.totalParcelas || null
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
  if (Array.isArray(snapVal)) return snapVal.map(item => ({ ...sanitize(item), key: item?.key }));
  return Object.keys(snapVal).map(key => ({ ...sanitize(snapVal[key]), key }));
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
  if (dbListener) { try { dbListener.off('value'); } catch (e) {} dbListener = null; }
  if (planoListener) { try { planoListener.off('value'); } catch (e) {} planoListener = null; }
  if (connectionListener) { try { connectionListener.off('value'); } catch (e) {} connectionListener = null; }
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
    db.ref('users/' + uid + '/contas').on('value', snap => {
      contas = snap.val() || [];
      if (!Array.isArray(contas)) contas = [];
      renderDashContas();
    });

    db.ref('users/' + uid + '/cartoes').on('value', snap => {
      cartoes = snap.val() || [];
      if (!Array.isArray(cartoes)) cartoes = [];
      renderDashCartoes();
    });

    db.ref('users/' + uid + '/contasPagar').on('value', snap => {
      contasPagar = snap.val() || [];
      if (!Array.isArray(contasPagar)) contasPagar = [];
      renderDashContasPagar();
    });

    db.ref('users/' + uid + '/contasReceber').on('value', snap => {
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
    transactions.unshift(clean);
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

// 7. AUTENTICAÇÃO
function translateAuthError(err) {
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
  return map[err.code] || (err.message || 'Erro desconhecido.');
}

function setAuthMsg(text, type) {
  const el = document.getElementById('auth-message');
  if (!el) return;
  el.textContent = text;
  el.className = 'auth-message ' + (type === 'error' ? 'error' : type === 'success' ? 'success' : 'info');
  el.style.display = 'block';
}

function isLoginPage() { return !!document.getElementById('loginForm'); }

if (isLoginPage()) {
  const loginForm = document.getElementById('loginForm');
  const registerBtn = document.getElementById('registerBtn');
  const googleBtn = document.getElementById('googleBtn');

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!auth) { setAuthMsg('Sem conexão — o Firebase não carregou.', 'error'); return; }
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      if (!email || !password) { setAuthMsg('Preencha e-mail e senha.', 'error'); return; }
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      setAuthMsg('Entrando...', 'info');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Entrando...'; }
      auth.signInWithEmailAndPassword(email, password)
        .then(() => { window.location.href = 'index.html'; })
        .catch(err => {
          setAuthMsg(translateAuthError(err), 'error');
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Entrar'; }
        });
    });

    registerBtn.addEventListener('click', () => {
      if (!auth) { setAuthMsg('Sem conexão — o Firebase não carregou.', 'error'); return; }
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      if (!email || !password) { setAuthMsg('Preencha e-mail e senha.', 'error'); return; }
      if (password.length < 6) { setAuthMsg('Senha fraca (mínimo 6 caracteres).', 'error'); return; }
      setAuthMsg('Criando conta...', 'info');
      registerBtn.disabled = true;
      auth.createUserWithEmailAndPassword(email, password)
        .then(() => { window.location.href = 'index.html'; })
        .catch(err => {
          setAuthMsg(translateAuthError(err), 'error');
          registerBtn.disabled = false;
        });
    });

    googleBtn.addEventListener('click', () => {
      if (!auth) { setAuthMsg('Sem conexão — o Firebase não carregou.', 'error'); return; }
      setAuthMsg('Abrindo Google...', 'info');
      auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
        .then(() => { window.location.href = 'index.html'; })
        .catch(err => setAuthMsg(translateAuthError(err), 'error'));
    });
  }
}

if (auth) {
  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (isLoginPage()) {
      if (user) window.location.href = 'index.html';
      return;
    }
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    renderHeaderUser();
    updateStatusBadge();
    loadFromLocal();
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
  });
} else {
  if (isLoginPage()) {
    setAuthMsg('Sem conexão — abra uma conta com e-mail/senha após conectar ao Firebase.', 'error');
  } else {
    fallbackToLocal('Modo local (conecte-se à internet para app completo)');
    renderHeaderUser();
  }
}

function logout() {
  if (auth && typeof auth.signOut === 'function') {
    auth.signOut().finally(() => { window.location.href = 'login.html'; });
  } else {
    window.location.href = 'login.html';
  }
}

function renderHeaderUser() {
  if (!currentUser) return;
  const displayName = currentUser.displayName || (currentUser.email || '').split('@')[0] || 'Usuário';
  const email = currentUser.email || '';
  const photoURL = currentUser.photoURL;

  const dropdownName = document.getElementById('dropdown-user-name');
  const dropdownEmail = document.getElementById('dropdown-user-email');
  const avatarIcon = document.getElementById('user-avatar-icon');
  const avatarHeader = document.getElementById('user-avatar-header');
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  const sidebarIcon = document.getElementById('sidebar-avatar-icon');

  if (dropdownName) dropdownName.textContent = displayName;
  if (dropdownEmail) dropdownEmail.textContent = email;

  if (photoURL && photoURL.startsWith('icon:')) {
    const iconClass = photoURL.replace('icon:', '');
    if (avatarIcon) {
      avatarIcon.className = 'fa-solid ' + iconClass;
      avatarIcon.style.display = 'block';
    }
    const img = avatarHeader ? avatarHeader.querySelector('img') : null;
    if (img) img.remove();
    // Update sidebar
    if (sidebarIcon) sidebarIcon.className = 'fa-solid ' + iconClass;
    const sideImg = sidebarAvatar ? sidebarAvatar.querySelector('img') : null;
    if (sideImg) sideImg.remove();
  } else if (photoURL && avatarHeader) {
    let img = avatarHeader.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.alt = 'Foto de perfil';
      avatarHeader.prepend(img);
    }
    img.src = photoURL;
    if (avatarIcon) avatarIcon.style.display = 'none';
    // Update sidebar
    let sideImg = sidebarAvatar ? sidebarAvatar.querySelector('img') : null;
    if (!sideImg && sidebarAvatar) {
      sideImg = document.createElement('img');
      sideImg.alt = 'Foto de perfil';
      sideImg.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:14px;';
      sidebarAvatar.prepend(sideImg);
    }
    if (sideImg) sideImg.src = photoURL;
    if (sidebarIcon) sidebarIcon.style.display = 'none';
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

  if (nameInput) nameInput.value = currentUser ? (currentUser.displayName || '') : '';
  if (emailInput) emailInput.value = currentUser ? (currentUser.email || '') : '';

  // Reset avatar selection
  const savedIcon = currentUser && currentUser.photoURL && currentUser.photoURL.startsWith('icon:')
    ? currentUser.photoURL.replace('icon:', '') : 'fa-user';

  document.querySelectorAll('.avatar-option').forEach(btn => {
    btn.classList.remove('selected');
    if (btn.dataset.icon === savedIcon) btn.classList.add('selected');
  });

  // Reset gender toggle to "All"
  document.querySelectorAll('.gender-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.gender === 'all') btn.classList.add('active');
  });
  document.querySelectorAll('.avatar-option').forEach(btn => {
    btn.style.display = '';
  });

  // Show preview
  if (currentUser && currentUser.photoURL && currentUser.photoURL.startsWith('icon:')) {
    const iconClass = currentUser.photoURL.replace('icon:', '');
    const img = preview.querySelector('img');
    if (img) img.remove();
    if (previewIcon) {
      previewIcon.style.display = 'block';
      previewIcon.className = 'fa-solid ' + iconClass;
    }
  } else if (currentUser && currentUser.photoURL) {
    let img = preview.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.alt = 'Foto de perfil';
      preview.prepend(img);
    }
    img.src = currentUser.photoURL;
    if (previewIcon) previewIcon.style.display = 'none';
    document.querySelectorAll('.avatar-option').forEach(btn => btn.classList.remove('selected'));
  } else {
    const img = preview.querySelector('img');
    if (img) img.remove();
    if (previewIcon) {
      previewIcon.style.display = 'block';
      previewIcon.className = 'fa-solid fa-user';
    }
  }

  // Icon click handlers
  document.querySelectorAll('.avatar-option').forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      const iconClass = this.dataset.icon;
      const img = preview.querySelector('img');
      if (img) {
        img.remove();
        pendingAvatarData = null;
      }
      if (previewIcon) {
        previewIcon.style.display = 'block';
        previewIcon.className = 'fa-solid ' + iconClass;
      }
    };
  });

  const firstInput = overlay.querySelector('input:not([disabled])');
  if (firstInput) setTimeout(() => firstInput.focus(), 200);
}

function filterAvatars(gender) {
  // Update toggle buttons
  document.querySelectorAll('.gender-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.gender === gender) btn.classList.add('active');
  });

  // Filter avatar options
  document.querySelectorAll('.avatar-option').forEach(btn => {
    const btnGender = btn.dataset.gender;
    if (gender === 'all') {
      btn.style.display = '';
    } else {
      btn.style.display = (btnGender === gender || btnGender === 'all') ? '' : 'none';
    }
  });
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
    document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
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

  const selectedIcon = document.querySelector('.avatar-option.selected');
  const iconData = selectedIcon ? selectedIcon.dataset.icon : null;

  const updates = { displayName: newName };

  if (pendingAvatarData) {
    updates.photoURL = pendingAvatarData;
  } else if (iconData) {
    updates.photoURL = 'icon:' + iconData;
  }

  if (auth && typeof auth.updateProfile === 'function') {
    auth.updateProfile(updates).then(() => {
      currentUser.displayName = newName;
      if (updates.photoURL) currentUser.photoURL = updates.photoURL;
      if (db && storageMode === 'rtdb') {
        const uid = currentUser.uid;
        db.ref('users/' + uid + '/profile').set({
          displayName: newName,
          photoURL: updates.photoURL || null,
          updatedAt: new Date().toISOString()
        });
      }
      pendingAvatarData = null;
      renderHeaderUser();
      renderDashGreeting();
      closeProfileModal();
      showToast('Perfil atualizado!', 'success');
    }).catch(err => {
      showToast('Erro ao atualizar: ' + err.message, 'error');
    });
  } else {
    currentUser.displayName = newName;
    if (updates.photoURL) currentUser.photoURL = updates.photoURL;
    pendingAvatarData = null;
    renderHeaderUser();
    renderDashGreeting();
    closeProfileModal();
    showToast('Perfil atualizado!', 'success');
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
  const heroTitle = document.getElementById('hero-title');
  const heroText = document.getElementById('hero-text');
  const heroChips = document.getElementById('hero-chips');
  const contentMap = {
    entrada: { title: 'Organize seu fluxo de caixa com calma.', text: 'Registre receitas e despesas, veja o saldo diário e mantenha o orçamento da casa em ordem.', chips: ['Fluxo', 'Categorias', 'Metas'] },
    dashboard: { title: 'Entenda o orçamento em números claros.', text: 'Acompanhe entradas, saídas, saldo e distribuição entre os membros da família.', chips: ['Gráficos', 'Resumo', 'Saúde financeira'] },
    investimentos: { title: 'Construa metas de longo prazo.', text: 'Acompanhe objetivos financeiros, progresso e próximos passos para cada reserva.', chips: ['Metas', 'Reserva', 'Crescimento'] },
    historico: { title: 'Revise tudo o que entrou e saiu.', text: 'Busque por mês, ano ou categoria e mantenha o histórico do orçamento sempre organizado.', chips: ['Histórico', 'Filtros', 'Organização'] },
    banco: { title: 'Proteja e restaure seus dados.', text: 'Faça backup, importe planilhas e mantenha o orçamento seguro em qualquer momento.', chips: ['Backup', 'Importação', 'Segurança'] }
  };
  const selected = contentMap[tabId] || contentMap.entrada;
  if (heroTitle) heroTitle.textContent = selected.title;
  if (heroText) heroText.textContent = selected.text;
  if (heroChips) heroChips.innerHTML = selected.chips.map(chip => '<span>' + escapeHTML(chip) + '</span>').join('');
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('.tab-btn, .nav-link').forEach(btn => btn.classList.remove('active'));
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

  // Data atual
  const dateInput = document.getElementById('m-date');
  if (dateInput) {
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];
  }

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

  const parcelasGroup = document.getElementById('parcelas-group');
  if (parcelasGroup) parcelasGroup.style.display = 'none';
}

// Toggle parcelas
const pagamentoSelect = document.getElementById('m-pagamento');
if (pagamentoSelect) {
  pagamentoSelect.addEventListener('change', () => {
    const parcelasGroup = document.getElementById('parcelas-group');
    if (parcelasGroup) {
      parcelasGroup.style.display = pagamentoSelect.value === 'parcelado' ? 'flex' : 'none';
      updateParcelaInfo();
    }
  });
}

const parcelasInput = document.getElementById('m-parcelas');
if (parcelasInput) {
  parcelasInput.addEventListener('input', updateParcelaInfo);
}

const valorInput = document.getElementById('m-val');
if (valorInput) {
  valorInput.addEventListener('input', updateParcelaInfo);
}

function updateParcelaInfo() {
  const valor = parseFloat(document.getElementById('m-val')?.value) || 0;
  const parcelas = parseInt(document.getElementById('m-parcelas')?.value) || 1;
  const info = document.getElementById('parcela-info');
  if (info) {
    const valorParcela = valor / Math.max(parcelas, 1);
    info.textContent = 'de R$ ' + valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }
}

// Submit do modal
const modalForm = document.getElementById('modalTransactionForm');
if (modalForm) {
  modalForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const type = document.getElementById('m-type').value;
    const desc = document.getElementById('m-desc').value.trim();
    const val = parseFloat(document.getElementById('m-val').value);
    const date = document.getElementById('m-date').value;
    const cat = document.getElementById('m-cat').value;
    const pagamento = document.getElementById('m-pagamento').value;
    const parcelas = parseInt(document.getElementById('m-parcelas')?.value) || 1;

    if (!desc || !val || !date) {
      showToast('Preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    if (pagamento === 'parcelado' && parcelas > 1) {
      const valorParcela = val / parcelas;
      for (let i = 0; i < parcelas; i++) {
        const parcelaDate = new Date(date);
        parcelaDate.setMonth(parcelaDate.getMonth() + i);
        addTransaction({
          id: Date.now() + i + Math.random(),
          type: type,
          user: 'Compartilhado',
          desc: desc + ' (' + (i + 1) + '/' + parcelas + ')',
          val: valorParcela,
          cat: cat,
          date: parcelaDate.toISOString(),
          parcela: i + 1,
          totalParcelas: parcelas
        });
      }
      showToast(parcelas + ' parcelas salvas com sucesso!', 'success');
    } else {
      addTransaction({
        id: Date.now(),
        type: type,
        user: 'Compartilhado',
        desc: desc,
        val: val,
        cat: cat,
        date: new Date(date).toISOString()
      });
      showToast('Lançamento salvo com sucesso!', 'success');
    }

    closeModal();
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
    const deleteBtn = (t.key || (storageMode === 'local'))
      ? '<button class="btn-delete" onclick="deleteTransaction(' + t.id + ', \'' + (t.key || '') + '\')" title="Excluir" aria-label="Excluir lançamento">🗑️</button>'
      : '';

    container.innerHTML += '<div class="transaction-item">' +
      '<div class="t-info">' +
        '<div class="t-icon ' + typeClass + '">' + icon + '</div>' +
        '<div class="t-details">' +
          '<h4>' + escapeHTML(t.desc) + parcelaTag + '</h4>' +
          '<p>' + escapeHTML(t.cat) + ' • ' + escapeHTML(dateFormatted) + '</p>' +
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
  const balance = totalIncome - totalExpense;
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

  // Gráfico de barras divisão
  const barChartContainer = document.getElementById('bar-chart-container');
  if (barChartContainer) {
    const catKeys = Object.keys(categories);
    const categoryColors = [
      'linear-gradient(180deg, #f97316, #ea580c)',
      'linear-gradient(180deg, #fb923c, #f97316)',
      'linear-gradient(180deg, #facc15, #eab308)',
      'linear-gradient(180deg, #fef08a, #facc15)',
      'linear-gradient(180deg, #a3e635, #84cc16)',
      'linear-gradient(180deg, #4ade80, #22c55e)'
    ];
    const maxVal = Math.max(...Object.values(categories), 1);
    if (catKeys.length === 0) {
      barChartContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; width: 100%;">Nenhuma despesa por categoria.</p>';
    } else {
      barChartContainer.innerHTML = catKeys.map((cat, i) => {
        const val = categories[cat];
        const heightPct = (val / maxVal) * 100;
        const color = categoryColors[i % categoryColors.length];
        return '<div class="bar-group">' +
          '<div class="bar-wrapper"><div class="bar-fill" style="background: ' + color + '; height: ' + heightPct + '%;"></div></div>' +
          '<span class="bar-label">' + escapeHTML(cat) + '</span>' +
        '</div>';
      }).join('');
    }
  }

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
// 12B. DASHBOARD ORGANIZE-STYLE — FUNÇÕES
// ============================================================

// Saudação
function renderDashGreeting() {
  const greetingEl = document.getElementById('dash-greeting');
  const userEl = document.getElementById('dash-greeting-user');
  const emojiEl = document.getElementById('greeting-emoji');
  if (!greetingEl) return;

  const hour = new Date().getHours();
  let greeting, emoji;
  if (hour < 12) { greeting = 'Bom dia'; emoji = '☀️'; }
  else if (hour < 18) { greeting = 'Boa tarde'; emoji = '⛅'; }
  else { greeting = 'Boa noite'; emoji = '🌙'; }

  greetingEl.textContent = greeting;
  if (userEl) userEl.textContent = currentUser ? (currentUser.displayName || (currentUser.email || '').split('@')[0] || 'Usuário') : 'Usuário';
  if (emojiEl) emojiEl.textContent = emoji;
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
}

// Saldo geral
let saldoVisivel = true;

function renderDashSaldoGeral(balance, investimentoTotal) {
  const saldoEl = document.getElementById('dash-saldo-geral');
  if (!saldoEl) return;
  const total = balance + investimentoTotal;
  saldoEl.textContent = 'R$ ' + (total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  saldoEl.style.color = total >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
}

function toggleAllValuesVisibility() {
  saldoVisivel = !saldoVisivel;
  const icon = document.getElementById('global-eye-icon');
  if (icon) {
    icon.className = saldoVisivel ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
  }

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
      const opts = f.options.map(o => `<option value="${o}">${o}</option>`).join('');
      return `<div class="form-modal-field">
        <label for="${f.id}">${f.label}</label>
        <select id="${f.id}">${opts}</select>
      </div>`;
    }
    return `<div class="form-modal-field">
      <label for="${f.id}">${f.label}</label>
      <input type="${f.type}" id="${f.id}" placeholder="${f.placeholder || ''}" ${f.step ? 'step="' + f.step + '"' : ''} ${f.min !== undefined ? 'min="' + f.min + '"' : ''}>
    </div>`;
  }).join('');

  overlay.innerHTML = `
    <div class="form-modal">
      <h3>${title}</h3>
      ${fieldsHTML}
      <div class="form-modal-actions">
        <button type="button" class="form-modal-cancel" onclick="this.closest('.form-modal-overlay').remove()">Cancelar</button>
        <button type="button" class="form-modal-submit" id="form-modal-ok">Confirmar</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });

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

function openContaModal() {
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

  const mesAtual = document.getElementById('faturas-mes-atual');
  if (mesAtual) {
    mesAtual.textContent = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  }

  if (cartoes.length === 0) {
    container.innerHTML = '<div class="empty-state-small"><i class="fa-solid fa-credit-card"></i><p>Adicione seu primeiro cartão</p></div>';
    return;
  }

  const formatCurrency = v => 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  container.innerHTML = cartoes.map(c => {
    const faturaAtual = c.faturaAtual || 0;
    return '<div class="cartao-item">' +
      '<div class="cartao-info">' +
        '<div class="cartao-icon"><i class="fa-solid fa-credit-card"></i></div>' +
        '<div>' +
          '<div class="cartao-nome">' + escapeHTML(c.nome) + ' <span class="cartao-badge">' + escapeHTML(c.bandeira || 'Manual') + '</span></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="cartao-limite-row">' +
      '<div class="cartao-limite-item"><span class="cartao-limite-label">Limite Disponível</span><span class="cartao-limite-valor">' + formatCurrency((c.limite || 0) - faturaAtual) + '</span></div>' +
      '<div class="cartao-limite-item"><span class="cartao-limite-label">Fatura atual</span><span class="cartao-fatura-valor">' + formatCurrency(faturaAtual) + '</span></div>' +
    '</div>';
  }).join('');

  // Atualizar total de faturas
  const totalFaturas = cartoes.reduce((s, c) => s + (c.faturaAtual || 0), 0);
  const faturasTotalEl = document.getElementById('dash-faturas-total');
  if (faturasTotalEl) faturasTotalEl.textContent = formatCurrency(totalFaturas);
}

function openCartaoModal() {
  showFormModal({
    title: 'Novo cartão de crédito',
    fields: [
      { id: 'fc-nome', label: 'Nome do cartão', type: 'text', placeholder: 'Ex: Nubank, Inter' },
      { id: 'fc-limite', label: 'Limite total (R$)', type: 'number', placeholder: '0,00', step: '0.01' },
      { id: 'fc-bandeira', label: 'Bandeira', type: 'select', options: ['Visa', 'Mastercard', 'Elo', 'Amex', 'Outro'] }
    ],
    onSubmit(values) {
      const nome = values['fc-nome'];
      if (!nome) return;
      const limite = parseFloat(values['fc-limite']) || 0;
      const bandeira = values['fc-bandeira'] || 'Manual';
      cartoes.push({ nome, limite, bandeira, faturaAtual: 0, criadoEm: new Date().toISOString() });
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
    return '<div class="bill-item">' +
      '<div class="bill-info">' +
        '<div class="bill-icon pagar"><i class="fa-solid fa-file-invoice-dollar"></i></div>' +
        '<div><div class="bill-nome">' + escapeHTML(c.descricao) + '</div><div class="bill-venc" style="color: ' + (isAtrasado ? 'var(--accent-danger)' : 'var(--text-secondary)') + ';">Venc. ' + diaVenc + '</div></div>' +
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
      { id: 'fc-venc', label: 'Data de vencimento', type: 'date' }
    ],
    onSubmit(values) {
      const desc = values['fc-desc'];
      if (!desc) return;
      const valor = parseFloat(values['fc-valor']) || 0;
      const vencStr = values['fc-venc'];
      if (!vencStr) return;
      const vencimento = new Date(vencStr + 'T12:00:00').toISOString();
      contasPagar.push({ descricao: desc, valor, vencimento, pago: false, criadoEm: new Date().toISOString() });
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
    return '<div class="bill-item">' +
      '<div class="bill-info">' +
        '<div class="bill-icon receber"><i class="fa-solid fa-hand-holding-dollar"></i></div>' +
        '<div><div class="bill-nome">' + escapeHTML(c.descricao) + '</div><div class="bill-venc">Venc. ' + diaVenc + '</div></div>' +
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
      { id: 'fc-venc', label: 'Data de recebimento', type: 'date' }
    ],
    onSubmit(values) {
      const desc = values['fc-desc'];
      if (!desc) return;
      const valor = parseFloat(values['fc-valor']) || 0;
      const vencStr = values['fc-venc'];
      if (!vencStr) return;
      const vencimento = new Date(vencStr + 'T12:00:00').toISOString();
      contasReceber.push({ descricao: desc, valor, vencimento, recebido: false, criadoEm: new Date().toISOString() });
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

// Inicialização
if (!isLoginPage()) {
  loadMetasPlano();
}

// ============================================================
// SCROLL TO RESUMO MENSAL (toggle up/down)
// ============================================================
let scrollDirection = 'down';

function scrollToResumoMensal() {
  const section = document.getElementById('hero-monthly-summary');
  const icon = document.getElementById('scroll-trend-icon');
  if (!section) return;

  if (scrollDirection === 'down') {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    scrollDirection = 'up';
    if (icon) icon.style.transform = 'rotate(180deg)';
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    scrollDirection = 'down';
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
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
    tbody.innerHTML += `<tr>
      <td class="td-codigo">${a.codigo}</td>
      <td>${a.nome}</td>
      <td class="td-preco">R$ ${a.preco?.toFixed(2) || '-'}</td>
      <td>${((a.dy || 0) * 100).toFixed(2)}%</td>
      <td><span class="td-status ${statusClass}">${a.status}</span></td>
    </tr>`;
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
    tbody.innerHTML += `<tr>
      <td class="td-codigo">${f.codigo}</td>
      <td>${f.pvp?.toFixed(2) || '-'}</td>
      <td>${(f.desconto || 0).toFixed(1)}%</td>
      <td>${((f.dy || 0) * 100).toFixed(2)}%</td>
      <td><span class="td-status ${statusClass}">${f.status}</span></td>
    </tr>`;
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
    tbody.innerHTML += `<tr>
      <td class="td-codigo">${e.codigo}</td>
      <td>${e.indice || e.nome || '-'}</td>
      <td class="td-preco">R$ ${e.preco?.toFixed(2) || '-'}</td>
      <td>${((e.dy || 0) * 100).toFixed(2)}%</td>
      <td><span class="td-status ${statusClass}">${e.status}</span></td>
    </tr>`;
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
});

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
