// ============================================================
// FINANCO — Controle Financeiro Familiar
// Versão Limpa - Sem investimentos, sem código duplicado
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
let transactions = [];
let currentUser = null;
let storageMode = 'local';
let dbListener = null;

// Inicializar Firebase
try {
  if (window.firebase) {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.database();
  }
} catch (error) {
  console.warn('Firebase indisponível, usando modo local.', error);
}

// 2. PROTEÇÃO: escape de HTML
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

// 3. SANITIZAR TRANSAÇÃO
function sanitize(t) {
  return {
    id: t.id ?? Date.now() + Math.random(),
    type: t.type === 'entrada' ? 'entrada' : 'saida',
    user: String(t.user || '').slice(0, 60),
    desc: String(t.desc || '').slice(0, 200),
    val: Math.max(0, parseFloat(t.val) || 0),
    cat: String(t.cat || 'Outros').slice(0, 60),
    date: t.date || new Date().toISOString(),
    parceled: t.parceled || false,
    totalInstallments: t.totalInstallments || 0,
    currentInstallment: t.currentInstallment || 0
  };
}

// 4. CHAVES DE ARMAZENAMENTO
function currentUid() { return currentUser ? currentUser.uid : null; }
function storageKey() { return 'financo_transactions_' + (currentUid() || 'anonymous'); }

// 5. CARREGAR/SALVAR LOCAL
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

// 6. STATUS DE CONEXÃO
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

// 7. FALLBACK LOCAL
function fallbackToLocal(msg) {
  storageMode = 'local';
  if (dbListener) { try { dbListener.off('value'); } catch (e) {} dbListener = null; }
  loadFromLocal();
  setStatus('local', msg || 'Modo local');
  updateUI();
}

// 8. listener Firebase
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
  } catch (e) {
    fallbackToLocal('Banco de dados indisponível — usando modo local');
  }
}

// 9. ADICIONAR TRANSAÇÃO
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

// 10. DELETAR TRANSAÇÃO
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

// 11. AUTENTICAÇÃO
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

// Configurar login se estiver na página de login
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

    if (registerBtn) {
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
    }

    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        if (!auth) { setAuthMsg('Sem conexão — o Firebase não carregou.', 'error'); return; }
        setAuthMsg('Abrindo Google...', 'info');
        auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
          .then(() => { window.location.href = 'index.html'; })
          .catch(err => setAuthMsg(translateAuthError(err), 'error'));
      });
    }
  }
}

// Estado de autenticação global
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
    if (db) {
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
  const badge = document.getElementById('user-name');
  const emailEl = document.getElementById('user-email');
  const avatarEl = document.getElementById('user-avatar');
  
  if (currentUser) {
    const name = currentUser.email ? currentUser.email.split('@')[0] : 'Usuário';
    const initials = name.substring(0, 2).toUpperCase();
    if (badge) badge.textContent = name;
    if (emailEl) emailEl.textContent = currentUser.email || '';
    if (avatarEl) avatarEl.textContent = initials;
  }
}

// 12. ATUALIZAÇÃO GERAL DA INTERFACE
function updateUI() {
  const appContainer = document.getElementById('app-container');
  if (appContainer) {
    if (!currentUser) { appContainer.style.display = 'none'; return; }
    appContainer.style.display = 'block';
  }

  let totalIncome = 0;
  let totalExpense = 0;
  let lastIncome = null;
  let lastExpense = null;
  const categories = {};

  transactions.forEach(t => {
    if (t.type === 'entrada') {
      totalIncome += t.val;
      if (!lastIncome) lastIncome = t;
    } else {
      totalExpense += t.val;
      if (!lastExpense) lastExpense = t;
      categories[t.cat] = (categories[t.cat] || 0) + t.val;
    }
  });

  const formatCurrency = value => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  // Atualizar último income/expense se os elementos existirem
  const lastIncomeVal = document.getElementById('last-income');
  const lastIncomeUser = document.getElementById('last-income-user');
  if (lastIncomeVal && lastIncomeUser) {
    if (lastIncome) {
      lastIncomeVal.textContent = formatCurrency(lastIncome.val);
      lastIncomeUser.textContent = `${lastIncome.desc} por ${lastIncome.user}`;
    } else {
      lastIncomeVal.textContent = 'R$ 0,00';
      lastIncomeUser.textContent = 'Nenhum registro';
    }
  }

  const lastExpenseVal = document.getElementById('last-expense');
  const lastExpenseUser = document.getElementById('last-expense-user');
  if (lastExpenseVal && lastExpenseUser) {
    if (lastExpense) {
      lastExpenseVal.textContent = formatCurrency(lastExpense.val);
      lastExpenseUser.textContent = `${lastExpense.desc} por ${lastExpense.user}`;
    } else {
      lastExpenseVal.textContent = 'R$ 0,00';
      lastExpenseUser.textContent = 'Nenhum registro';
    }
  }

  // Atualizar informações do usuário
  renderHeaderUser();
}

// 13. EXPORTAR DADOS
function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "backup_financo.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// 14. LIMPAR DADOS
function clearData() {
  if (!confirm('Tem certeza que deseja apagar TODOS os dados? Esta ação não pode ser desfeita.')) return;
  if (storageMode === 'rtdb' && db && currentUser) {
    db.ref('users/' + currentUser.uid + '/transactions').remove();
  } else {
    transactions = [];
    saveToLocal();
    updateUI();
  }
  alert('Todos os dados foram limpos.');
}

// 15. IMPORTAR EXCEL
const MESES_PT = {
  'janeiro': 0, 'fevereiro': 1, 'março': 2, 'marco': 2, 'abril': 3,
  'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7, 'setembro': 8,
  'outubro': 9, 'novembro': 10, 'dezembro': 11
};

function parseSheetNameToDate(sheetName) {
  const nome = sheetName.trim().toLowerCase();
  let ano = new Date().getFullYear();
  const anoMatch = nome.match(/20\d{2}/);
  if (anoMatch) ano = parseInt(anoMatch[0]);
  
  for (const mesNome in MESES_PT) {
    if (nome.includes(mesNome)) {
      return new Date(ano, MESES_PT[mesNome], 1).toISOString();
    }
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
      
      const mesesParaSubstituir = new Set(workbook.SheetNames.map(parseSheetNameToDate).filter(Boolean));
      if (mesesParaSubstituir.size) {
        const mesesNomes = [...mesesParaSubstituir].map(d => new Date(d).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })).join(', ');
        if (!confirm(`As abas encontradas (${mesesNomes}) serão adicionadas. Continuar?`)) return;
      }

      const novos = [];
      const mesesIgnorados = [];
      const itensIgnorados = [];

      workbook.SheetNames.forEach(sheetName => {
        const dataMes = parseSheetNameToDate(sheetName);
        if (!dataMes) { mesesIgnorados.push(sheetName); return; }

        const linhas = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        
        linhas.forEach((linha, i) => {
          if (!linha || linha.length < 2) return;
          
          const rotulo = String(linha[0] || '').trim();
          if (!rotulo) return;
          
          const rotuloLower = rotulo.toLowerCase();
          if (rotuloLower.includes('total') || rotuloLower.includes('subtotal')) return;

          const valor = parseValor(linha[1]);
          
          if (valor === null) {
            itensIgnorados.push(`${sheetName}: "${rotulo}"`);
            return;
          }

          // Determinar tipo e categoria
          let type = 'saida';
          let cat = 'Gastos Essenciais';
          let user = 'Compartilhado';

          if (rotuloLower.includes('salário') || rotuloLower.includes('salario') || rotuloLower.includes('renda') || rotuloLower.includes('freelance')) {
            type = 'entrada';
            cat = 'Renda';
            if (rotuloLower.includes('amor') || rotuloLower.includes('vick')) {
              user = 'Vick';
            } else {
              user = 'João';
            }
          } else if (rotuloLower.includes('aluguel') || rotuloLower.includes('conta') || rotuloLower.includes('fixo')) {
            cat = 'Gastos Essenciais';
          } else {
            cat = 'Pessoais';
          }

          novos.push({
            id: Date.now() + Math.random(),
            type,
            user,
            desc: rotulo,
            val: valor,
            cat,
            date: dataMes,
            parceled: false,
            totalInstallments: 0,
            currentInstallment: 0
          });
        });
      });

      if (novos.length === 0) {
        log.textContent = 'Nenhuma transação encontrada na planilha.';
        return;
      }

      // Adicionar transações
      novos.forEach(t => addTransaction(t));

      let resumo = `✅ ${novos.length} lançamentos importados!`;
      if (mesesIgnorados.length) resumo += `\n⚠️ Abas não reconhecidas: ${mesesIgnorados.join(', ')}`;
      if (itensIgnorados.length) resumo += `\n⚠️ Linhas sem valor: ${itensIgnorados.slice(0, 5).join('; ')}`;
      log.textContent = resumo;

    } catch (err) {
      log.textContent = 'Erro ao ler planilha: ' + err.message;
    }
  };
  
  reader.onerror = () => { log.textContent = 'Não foi possível ler o arquivo.'; };
  reader.readAsArrayBuffer(input.files[0]);
}
