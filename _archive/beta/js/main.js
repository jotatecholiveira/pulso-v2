// js/main.js — Orquestrador principal do Financo v2.0

// Inicializar Firebase IMEDIATAMENTE quando o script carrega
// (antes de qualquer interação do usuário)
if (typeof firebaseConfig === 'undefined') {
  console.error('[App] firebase-config.js não carregado. Verifique se o arquivo existe.');
} else if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const App = (() => {

  let uid = null;
  let initialized = false;

  // Inicializar aplicação
  const init = async () => {
    if (initialized) return;
    try {
      // Garantir que Firebase está inicializado
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      // Inicializar Storage (detecta conexão)
      StorageModule.init();

      // Listener de status
      StorageModule.onStatusChange((status) => {
        UIModule.updateStatus(status);
      });

      // Aguardar estado de autenticação
      const user = await AuthModule.init();

      if (user) {
        uid = user.uid;
        await loadApp();
      } else {
        showLogin();
      }

      // Listener de mudanças de auth
      AuthModule.onAuthChange((user) => {
        if (user) {
          uid = user.uid;
          loadApp();
        } else {
          uid = null;
          showLogin();
        }
      });

      // Inicializar navegação
      UIModule.initNavigation();

      // Fechar modal ao clicar fora
      document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) UIModule.closeModal();
      });

      initialized = true;

    } catch (error) {
      console.error('[App] Erro ao inicializar:', error);
      UIModule.showToast('Erro ao inicializar aplicação', 'error');
    }
  };

  // Mostrar tela de login
  const showLogin = () => {
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'flex';
  };

  // Carregar aplicação (usuário autenticado)
  const loadApp = async () => {
    try {
      document.getElementById('login-container').style.display = 'none';
      document.getElementById('app-container').style.display = 'block';

      // Carregar dados
      await Promise.all([
        TransactionsModule.load(uid),
        MetasModule.load(uid),
        AssetsModule.load(uid),
        PoupancaModule.load(uid)
      ]);

      // Registrar listeners em tempo real
      TransactionsModule.onChanges(uid, () => refreshCurrentTab());
      MetasModule.onChanges(uid, () => refreshCurrentTab());
      AssetsModule.onChanges(uid, () => refreshCurrentTab());
      PoupancaModule.onChanges(uid, () => refreshCurrentTab());

      // Renderizar
      refreshCurrentTab();

    } catch (error) {
      console.error('[App] Erro ao carregar:', error);
      UIModule.showToast('Erro ao carregar dados', 'error');
    }
  };

  // Renderizar aba atual
  const refreshCurrentTab = () => {
    const tab = UIModule.getCurrentTab();
    switch (tab) {
      case 'entrada':
        renderEntrada();
        break;
      case 'investimentos':
        renderInvestimentos();
        break;
      case 'poupanca':
        renderPoupanca();
        break;
      case 'historico':
        renderHistorico();
        break;
    }
  };

  // === RENDERAÇÃO DE ABAS ===

  const renderEntrada = () => {
    const stats = TransactionsModule.getStats(uid);
    UIModule.renderSummaryCards(stats);
    UIModule.renderTransactionsTable(TransactionsModule.getAll());
  };

  const renderInvestimentos = () => {
    const metas = MetasModule.getAllWithProgress();
    UIModule.renderMetasCards(metas);
    UIModule.renderAssetsCards(AssetsModule.getAll());
  };

  const renderPoupanca = () => {
    UIModule.renderPoupancaCards(PoupancaModule.getAll());
  };

  const renderHistorico = () => {
    UIModule.renderTransactionsTable(TransactionsModule.getAll(), 'historico-transactions-list');
  };

  // === AUTENTICAÇÃO ===

  const login = async (email, password) => {
    try {
      // Garantir que Firebase está inicializado
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      await AuthModule.login(email, password);
      UIModule.showToast('Login realizado com sucesso!');
    } catch (error) {
      UIModule.showToast(error.message || 'Erro ao fazer login', 'error');
      throw error;
    }
  };

  const register = async (email, password, name) => {
    try {
      // Garantir que Firebase está inicializado
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      await AuthModule.register(email, password, name);
      UIModule.showToast('Conta criada com sucesso!');
    } catch (error) {
      UIModule.showToast(error.message || 'Erro ao criar conta', 'error');
      throw error;
    }
  };

  const logout = async () => {
    try {
      StorageModule.offAll();
      await AuthModule.logout();
      UIModule.showToast('Logout realizado');
    } catch (error) {
      UIModule.showToast('Erro ao fazer logout', 'error');
    }
  };

  // === TRANSAÇÕES ===

  const createTransaction = () => {
    UIModule.showModal('Nova Transação', UIModule.buildTransactionForm());
    document.getElementById('transaction-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await TransactionsModule.create(uid, {
          type: fd.get('type'),
          user: fd.get('user'),
          desc: fd.get('desc'),
          val: parseFloat(fd.get('val')),
          cat: fd.get('cat'),
          date: fd.get('date')
        });
        UIModule.closeModal();
        UIModule.showToast('Transação criada!');
        refreshCurrentTab();
      } catch (error) {
        UIModule.showToast(error.message, 'error');
      }
    });
  };

  const editTransaction = (id) => {
    const t = TransactionsModule.getById(id);
    if (!t) return;
    UIModule.showModal('Editar Transação', UIModule.buildTransactionForm(t));
    document.getElementById('transaction-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await TransactionsModule.update(uid, id, {
          desc: fd.get('desc'),
          val: parseFloat(fd.get('val')),
          cat: fd.get('cat')
        });
        UIModule.closeModal();
        UIModule.showToast('Transação atualizada!');
        refreshCurrentTab();
      } catch (error) {
        UIModule.showToast(error.message, 'error');
      }
    });
  };

  const deleteTransaction = async (id) => {
    if (!confirm('Excluir esta transação?')) return;
    try {
      await TransactionsModule.remove(uid, id);
      UIModule.showToast('Transação excluída!');
      refreshCurrentTab();
    } catch (error) {
      UIModule.showToast('Erro ao excluir', 'error');
    }
  };

  // === METAS ===

  const createMeta = (key) => {
    UIModule.showModal('Criar Meta', UIModule.buildMetaForm(key));
    document.getElementById('meta-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await MetasModule.save(uid, fd.get('key'), {
          name: fd.get('name'),
          goal: parseFloat(fd.get('goal')),
          current: parseFloat(fd.get('current')),
          deadline: fd.get('deadline') || null,
          priority: fd.get('priority')
        });
        UIModule.closeModal();
        UIModule.showToast('Meta criada!');
        refreshCurrentTab();
      } catch (error) {
        UIModule.showToast(error.message, 'error');
      }
    });
  };

  const editMeta = (key) => {
    const metas = MetasModule.getAllWithProgress();
    const meta = metas[key];
    UIModule.showModal('Editar Meta', UIModule.buildMetaForm(key, meta));
    document.getElementById('meta-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await MetasModule.save(uid, fd.get('key'), {
          name: fd.get('name'),
          goal: parseFloat(fd.get('goal')),
          current: parseFloat(fd.get('current')),
          deadline: fd.get('deadline') || null,
          priority: fd.get('priority')
        });
        UIModule.closeModal();
        UIModule.showToast('Meta atualizada!');
        refreshCurrentTab();
      } catch (error) {
        UIModule.showToast(error.message, 'error');
      }
    });
  };

  // === ASSETS ===

  const createAsset = () => {
    UIModule.showModal('Novo Ativo', UIModule.buildAssetForm());
    document.getElementById('asset-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await AssetsModule.create(uid, {
          name: fd.get('name'),
          type: fd.get('type'),
          value: parseFloat(fd.get('value')),
          purchasePrice: fd.get('purchasePrice') ? parseFloat(fd.get('purchasePrice')) : null,
          purchaseDate: fd.get('purchaseDate') || null,
          description: fd.get('description') || ''
        });
        UIModule.closeModal();
        UIModule.showToast('Ativo adicionado!');
        refreshCurrentTab();
      } catch (error) {
        UIModule.showToast(error.message, 'error');
      }
    });
  };

  const editAsset = (id) => {
    const a = AssetsModule.getById(id);
    if (!a) return;
    UIModule.showModal('Editar Ativo', UIModule.buildAssetForm(a));
    document.getElementById('asset-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await AssetsModule.update(uid, id, {
          name: fd.get('name'),
          value: parseFloat(fd.get('value')),
          description: fd.get('description') || ''
        });
        UIModule.closeModal();
        UIModule.showToast('Ativo atualizado!');
        refreshCurrentTab();
      } catch (error) {
        UIModule.showToast(error.message, 'error');
      }
    });
  };

  const deleteAsset = async (id) => {
    if (!confirm('Excluir este ativo?')) return;
    try {
      await AssetsModule.remove(uid, id);
      UIModule.showToast('Ativo excluído!');
      refreshCurrentTab();
    } catch (error) {
      UIModule.showToast('Erro ao excluir', 'error');
    }
  };

  // === POUPANÇA ===

  const createPoupanca = () => {
    UIModule.showModal('Nova Conta', UIModule.buildPoupancaForm());
    document.getElementById('poupanca-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await PoupancaModule.create(uid, {
          name: fd.get('name'),
          bank: fd.get('bank'),
          amount: parseFloat(fd.get('amount')),
          interestRate: fd.get('interestRate') ? parseFloat(fd.get('interestRate')) / 100 : 0,
          description: fd.get('description') || ''
        });
        UIModule.closeModal();
        UIModule.showToast('Conta criada!');
        refreshCurrentTab();
      } catch (error) {
        UIModule.showToast(error.message, 'error');
      }
    });
  };

  const editPoupanca = (id) => {
    const p = PoupancaModule.getById(id);
    if (!p) return;
    UIModule.showModal('Editar Conta', UIModule.buildPoupancaForm(p));
    document.getElementById('poupanca-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await PoupancaModule.update(uid, id, {
          amount: parseFloat(fd.get('amount')),
          interestRate: fd.get('interestRate') ? parseFloat(fd.get('interestRate')) / 100 : 0
        });
        UIModule.closeModal();
        UIModule.showToast('Conta atualizada!');
        refreshCurrentTab();
      } catch (error) {
        UIModule.showToast(error.message, 'error');
      }
    });
  };

  const deletePoupanca = async (id) => {
    if (!confirm('Excluir esta conta?')) return;
    try {
      await PoupancaModule.remove(uid, id);
      UIModule.showToast('Conta excluída!');
      refreshCurrentTab();
    } catch (error) {
      UIModule.showToast('Erro ao excluir', 'error');
    }
  };

  // Inicializar quando o DOM carregar
  document.addEventListener('DOMContentLoaded', init);

  return {
    login,
    register,
    logout,
    createTransaction,
    editTransaction,
    deleteTransaction,
    createMeta,
    editMeta,
    createAsset,
    editAsset,
    deleteAsset,
    createPoupanca,
    editPoupanca,
    deletePoupanca
  };
})();
