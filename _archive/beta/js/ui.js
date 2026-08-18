// js/ui.js — Renderização de interfaces

const UIModule = (() => {

  let currentTab = 'entrada';
  let onTabChange = null;

  // === NAVEGAÇÃO ===

  const initNavigation = () => {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        if (target) switchTab(target);
      });
    });

    // Navegação via hash
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'entrada';
      switchTab(hash, false);
    });

    // Tab inicial
    const initial = window.location.hash.replace('#', '') || 'entrada';
    switchTab(initial, false);
  };

  const switchTab = (tab, updateHash = true) => {
    currentTab = tab;
    if (updateHash) window.location.hash = tab;

    // Atualizar abas ativas
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });

    // Mostrar/esconder conteúdo
    document.querySelectorAll('.tab-content').forEach(c => {
      c.classList.toggle('active', c.id === `tab-${tab}`);
    });

    if (onTabChange) onTabChange(tab);
  };

  const onTab = (callback) => { onTabChange = callback; };

  // === MODAL ===

  const showModal = (title, content) => {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalTitle.textContent = title;
    modalBody.innerHTML = '';
    if (typeof content === 'string') {
      modalBody.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      modalBody.appendChild(content);
    }

    modal.classList.add('active');
  };

  const closeModal = () => {
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
  };

  // === STATUS ===

  const updateStatus = (status) => {
    const el = document.getElementById('status-indicator');
    if (!el) return;
    const labels = { online: 'Online', offline: 'Offline', local: 'Modo Local' };
    const colors = { online: '#22c55e', offline: '#ef4444', local: '#f59e0b' };
    el.textContent = labels[status] || status;
    el.style.backgroundColor = colors[status] || '#666';
  };

  // === TOAST ===

  const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // === CARDS RESUMO ===

  const renderSummaryCards = (stats) => {
    const container = document.getElementById('summary-cards');
    if (!container) return;
    container.innerHTML = `
      <div class="summary-card">
        <span class="summary-label">Saldo</span>
        <span class="summary-value ${stats.balance >= 0 ? 'positive' : 'negative'}">
          ${Format.currencyShort(stats.balance)}
        </span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Entradas</span>
        <span class="summary-value positive">${Format.currencyShort(stats.totalIncome)}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Saídas</span>
        <span class="summary-value negative">${Format.currencyShort(stats.totalExpense)}</span>
      </div>
    `;
  };

  // === TABELA DE TRANSAÇÕES ===

  const renderTransactionsTable = (transactions, containerId = 'transactions-list') => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const sorted = Object.values(transactions).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sorted.length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhuma transação registrada</p>';
      return;
    }

    container.innerHTML = sorted.map(t => `
      <div class="transaction-item" data-id="${t.id}">
        <div class="transaction-info">
          <span class="transaction-desc">${Security.escapeHtml(t.desc)}</span>
          <span class="transaction-meta">${Security.escapeHtml(t.user)} · ${Security.escapeHtml(t.cat)} · ${Format.date(t.date)}</span>
        </div>
        <div class="transaction-actions">
          <span class="transaction-value ${t.type === 'entrada' ? 'positive' : 'negative'}">
            ${t.type === 'entrada' ? '+' : '-'} ${Format.currencyShort(t.val)}
          </span>
          <button class="btn-icon" onclick="App.editTransaction('${t.id}')" title="Editar">✏️</button>
          <button class="btn-icon" onclick="App.deleteTransaction('${t.id}')" title="Excluir">🗑️</button>
        </div>
      </div>
    `).join('');
  };

  // === CARDS DE METAS ===

  const renderMetasCards = (metas) => {
    const container = document.getElementById('metas-container');
    if (!container) return;

    const keys = ['curto', 'medio', 'longo'];
    const labels = { curto: 'Curto Prazo', medio: 'Médio Prazo', longo: 'Longo Prazo' };

    container.innerHTML = keys.map(key => {
      const meta = metas[key];
      if (!meta) return `
        <div class="meta-card empty">
          <h3>${labels[key]}</h3>
          <p>Meta não definida</p>
          <button class="btn-sm" onclick="App.createMeta('${key}')">Criar Meta</button>
        </div>
      `;

      return `
        <div class="meta-card">
          <div class="meta-header">
            <h3>${meta.icon || '🎯'} ${Security.escapeHtml(meta.name)}</h3>
            <button class="btn-icon" onclick="App.editMeta('${key}')" title="Editar">✏️</button>
          </div>
          <div class="meta-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${meta.progressWidth}%"></div>
            </div>
            <span class="progress-text">${meta.progress}%</span>
          </div>
          <div class="meta-values">
            <span>${Format.currencyShort(meta.current)}</span>
            <span class="meta-divider">/</span>
            <span>${Format.currencyShort(meta.goal)}</span>
          </div>
          ${meta.remaining > 0 ? `<p class="meta-remaining">Falta ${Format.currencyShort(meta.remaining)}</p>` : '<p class="meta-complete">Meta atingida!</p>'}
          ${meta.daysLeft !== null ? `<p class="meta-deadline">${meta.daysLeft} dias restantes</p>` : ''}
        </div>
      `;
    }).join('');
  };

  // === CARDS DE ASSETS ===

  const renderAssetsCards = (assets) => {
    const container = document.getElementById('assets-container');
    if (!container) return;

    const entries = Object.values(assets);
    const total = entries.reduce((sum, a) => sum + (a.value || 0), 0);

    document.getElementById('assets-total').textContent = Format.currencyShort(total);

    if (entries.length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhum ativo registrado</p>';
      return;
    }

    container.innerHTML = entries.map(a => `
      <div class="asset-card">
        <div class="asset-info">
          <span class="asset-icon">${a.icon || '📦'}</span>
          <div>
            <span class="asset-name">${Security.escapeHtml(a.name)}</span>
            <span class="asset-type">${a.type}</span>
          </div>
        </div>
        <div class="asset-actions">
          <span class="asset-value">${Format.currencyShort(a.value)}</span>
          <button class="btn-icon" onclick="App.editAsset('${a.id}')" title="Editar">✏️</button>
          <button class="btn-icon" onclick="App.deleteAsset('${a.id}')" title="Excluir">🗑️</button>
        </div>
      </div>
    `).join('');
  };

  // === CARDS DE POUPANÇA ===

  const renderPoupancaCards = (poupanca) => {
    const container = document.getElementById('poupanca-container');
    if (!container) return;

    const entries = Object.values(poupanca);
    const total = entries.reduce((sum, p) => sum + (p.amount || 0), 0);

    document.getElementById('poupanca-total').textContent = Format.currencyShort(total);

    if (entries.length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhuma conta registrada</p>';
      return;
    }

    container.innerHTML = entries.map(p => `
      <div class="poupanca-card">
        <div class="poupanca-info">
          <span class="poupanca-bank">${Security.escapeHtml(p.bank)}</span>
          <span class="poupanca-name">${Security.escapeHtml(p.name)}</span>
        </div>
        <div class="poupanca-actions">
          <div class="poupanca-values">
            <span class="poupanca-amount">${Format.currencyShort(p.amount)}</span>
            <span class="poupanca-rate">${(p.interestRate * 100).toFixed(1)}% a.m.</span>
          </div>
          <button class="btn-icon" onclick="App.editPoupanca('${p.id}')" title="Editar">✏️</button>
          <button class="btn-icon" onclick="App.deletePoupanca('${p.id}')" title="Excluir">🗑️</button>
        </div>
      </div>
    `).join('');
  };

  // === FORMULÁRIOS ===

  const buildTransactionForm = (data = null) => {
    const isEdit = !!data;
    const type = data?.type || 'saida';
    const cats = type === 'entrada' ? Constants.CATEGORIES.ENTRADA : Constants.CATEGORIES.SAIDA;

    return `
      <form id="transaction-form" class="modal-form">
        <div class="form-row">
          <label>Tipo</label>
          <select name="type" required>
            <option value="entrada" ${type === 'entrada' ? 'selected' : ''}>Entrada</option>
            <option value="saida" ${type === 'saida' ? 'selected' : ''}>Saída</option>
          </select>
        </div>
        <div class="form-row">
          <label>Usuário</label>
          <select name="user" required>
            ${Object.values(Constants.USERS).map(u => `<option value="${u}" ${data?.user === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label>Descrição</label>
          <input type="text" name="desc" maxlength="200" value="${Security.escapeHtml(data?.desc || '')}" required>
        </div>
        <div class="form-row">
          <label>Valor (R$)</label>
          <input type="number" name="val" step="0.01" min="0.01" value="${data?.val || ''}" required>
        </div>
        <div class="form-row">
          <label>Categoria</label>
          <select name="cat" required>
            ${cats.map(c => `<option value="${c}" ${data?.cat === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label>Data</label>
          <input type="date" name="date" value="${Format.dateInput(data?.date || new Date().toISOString())}" required>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-secondary" onclick="UIModule.closeModal()">Cancelar</button>
          <button type="submit" class="btn-primary">${isEdit ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </form>
    `;
  };

  const buildMetaForm = (key, data = null) => {
    const isEdit = !!data;
    return `
      <form id="meta-form" class="modal-form">
        <div class="form-row">
          <label>Nome</label>
          <input type="text" name="name" maxlength="100" value="${Security.escapeHtml(data?.name || '')}" required>
        </div>
        <div class="form-row">
          <label>Meta (R$)</label>
          <input type="number" name="goal" step="0.01" min="0.01" value="${data?.goal || ''}" required>
        </div>
        <div class="form-row">
          <label>Valor Atual (R$)</label>
          <input type="number" name="current" step="0.01" min="0" value="${data?.current || '0'}" required>
        </div>
        <div class="form-row">
          <label>Prazo</label>
          <input type="date" name="deadline" value="${Format.dateInput(data?.deadline || '')}">
        </div>
        <div class="form-row">
          <label>Prioridade</label>
          <select name="priority">
            <option value="high" ${data?.priority === 'high' ? 'selected' : ''}>Alta</option>
            <option value="medium" ${data?.priority === 'medium' ? 'selected' : ''}>Média</option>
            <option value="low" ${data?.priority === 'low' ? 'selected' : ''}>Baixa</option>
          </select>
        </div>
        <input type="hidden" name="key" value="${key}">
        <div class="form-actions">
          <button type="button" class="btn-secondary" onclick="UIModule.closeModal()">Cancelar</button>
          <button type="submit" class="btn-primary">${isEdit ? 'Salvar' : 'Criar'}</button>
        </div>
      </form>
    `;
  };

  const buildAssetForm = (data = null) => {
    const isEdit = !!data;
    return `
      <form id="asset-form" class="modal-form">
        <div class="form-row">
          <label>Nome</label>
          <input type="text" name="name" maxlength="100" value="${Security.escapeHtml(data?.name || '')}" required>
        </div>
        <div class="form-row">
          <label>Tipo</label>
          <select name="type" required>
            ${Object.entries(Constants.ASSET_TYPES).map(([k, v]) => `<option value="${v}" ${data?.type === v ? 'selected' : ''}>${k}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label>Valor Atual (R$)</label>
          <input type="number" name="value" step="0.01" min="0" value="${data?.value || ''}" required>
        </div>
        <div class="form-row">
          <label>Valor de Compra (R$)</label>
          <input type="number" name="purchasePrice" step="0.01" min="0" value="${data?.purchasePrice || ''}">
        </div>
        <div class="form-row">
          <label>Data de Compra</label>
          <input type="date" name="purchaseDate" value="${Format.dateInput(data?.purchaseDate || '')}">
        </div>
        <div class="form-row">
          <label>Descrição</label>
          <input type="text" name="description" maxlength="200" value="${Security.escapeHtml(data?.description || '')}">
        </div>
        <div class="form-actions">
          <button type="button" class="btn-secondary" onclick="UIModule.closeModal()">Cancelar</button>
          <button type="submit" class="btn-primary">${isEdit ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </form>
    `;
  };

  const buildPoupancaForm = (data = null) => {
    const isEdit = !!data;
    return `
      <form id="poupanca-form" class="modal-form">
        <div class="form-row">
          <label>Nome</label>
          <input type="text" name="name" maxlength="100" value="${Security.escapeHtml(data?.name || '')}" required>
        </div>
        <div class="form-row">
          <label>Banco</label>
          <select name="bank" required>
            ${Constants.BANKS.map(b => `<option value="${b}" ${data?.bank === b ? 'selected' : ''}>${b}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label>Valor (R$)</label>
          <input type="number" name="amount" step="0.01" min="0" value="${data?.amount || ''}" required>
        </div>
        <div class="form-row">
          <label>Taxa de Juros (% a.m.)</label>
          <input type="number" name="interestRate" step="0.001" min="0" max="100" value="${data ? (data.interestRate * 100).toFixed(1) : ''}">
        </div>
        <div class="form-row">
          <label>Descrição</label>
          <input type="text" name="description" maxlength="200" value="${Security.escapeHtml(data?.description || '')}">
        </div>
        <div class="form-actions">
          <button type="button" class="btn-secondary" onclick="UIModule.closeModal()">Cancelar</button>
          <button type="submit" class="btn-primary">${isEdit ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </form>
    `;
  };

  // === FORMATAÇÃO DE DATA PARA INPUT ===

  const formatDateForInput = (iso) => Format.dateInput(iso);

  return {
    initNavigation,
    switchTab,
    onTab,
    showModal,
    closeModal,
    updateStatus,
    showToast,
    renderSummaryCards,
    renderTransactionsTable,
    renderMetasCards,
    renderAssetsCards,
    renderPoupancaCards,
    buildTransactionForm,
    buildMetaForm,
    buildAssetForm,
    buildPoupancaForm,
    formatDateForInput,
    getCurrentTab: () => currentTab
  };
})();
