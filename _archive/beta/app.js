// app.js — Lógica principal do Financo

const App = (() => {

  // Estado da aplicação
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let transactions = [];
  let bills = [];

  // Inicializar
  const init = async () => {
    try {
      // Garantir que Firebase está inicializado
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      // Listener de autenticação
      firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
          document.getElementById('login-container').style.display = 'none';
          document.getElementById('app-container').style.display = 'block';
          
          // Atualizar informações do usuário
          updateUserUI(user);
          
          // Carregar dados
          await loadData(user.uid);
          
          // Renderizar dashboard
          renderDashboard();
        } else {
          document.getElementById('login-container').style.display = 'flex';
          document.getElementById('app-container').style.display = 'none';
        }
      });

      // Configurar navegação
      setupNavigation();
      
      // Configurar formulário
      setupForm();
      
      // Configurar navegação de mês
      setupMonthNav();
      
      // Configurar campos de parcela
      setupParcelaFields();

    } catch (error) {
      console.error('Erro ao inicializar:', error);
    }
  };

  // Atualizar UI do usuário
  const updateUserUI = (user) => {
    const name = user.email ? user.email.split('@')[0] : 'Usuário';
    const initials = name.substring(0, 2).toUpperCase();
    
    document.getElementById('user-name').textContent = name;
    document.getElementById('user-email').textContent = user.email || '';
    document.getElementById('user-avatar').textContent = initials;
  };

  // Carregar dados do Firebase
  const loadData = async (uid) => {
    try {
      // Carregar transações
      const transSnap = await firebase.database().ref(`users/${uid}/transactions`).once('value');
      transactions = [];
      const transData = transSnap.val();
      if (transData) {
        Object.keys(transData).forEach(key => {
          transactions.push({ id: key, ...transData[key] });
        });
      }

      // Carregar contas
      const billsSnap = await firebase.database().ref(`users/${uid}/bills`).once('value');
      bills = [];
      const billsData = billsSnap.val();
      if (billsData) {
        Object.keys(billsData).forEach(key => {
          bills.push({ id: key, ...billsData[key] });
        });
      }

      // Listener em tempo real
      firebase.database().ref(`users/${uid}/transactions`).on('value', (snap) => {
        const data = snap.val();
        transactions = [];
        if (data) {
          Object.keys(data).forEach(key => {
            transactions.push({ id: key, ...data[key] });
          });
        }
        renderDashboard();
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  // Configurar navegação
  const setupNavigation = () => {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const tab = link.dataset.tab;
        if (tab) switchTab(tab);
      });
    });
  };

  // Trocar aba
  const switchTab = (tabId) => {
    // Atualizar links ativos
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.tab === tabId);
    });

    // Mostrar/esconder abas
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.toggle('active', tab.id === `tab-${tabId}`);
    });

    // Atualizar título
    const titles = {
      dashboard: ['Dashboard', 'Visão geral do mês'],
      lancamentos: ['Lançamentos', 'Gerencie suas transações'],
      contas: ['Contas a Pagar', 'Controle suas contas fixas'],
      parcelas: ['Parcelas', 'Acompanhe suas parcelas'],
      relatorios: ['Relatórios', 'Análise detalhada'],
      anual: ['Visão Anual', 'Acompanhe o ano inteiro'],
      importar: ['Importar', 'Importe sua planilha Excel'],
      backup: ['Backup', 'Proteja seus dados']
    };

    const [title, subtitle] = titles[tabId] || ['Financo', ''];
    document.getElementById('page-title').textContent = title;
    document.getElementById('page-subtitle').textContent = subtitle;

    // Renderizar conteúdo da aba
    renderTabContent(tabId);
  };

  // Renderizar conteúdo da aba
  const renderTabContent = (tabId) => {
    switch (tabId) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'lancamentos':
        renderTransactions();
        break;
      case 'contas':
        renderBills();
        break;
      case 'parcelas':
        renderInstallments();
        break;
      case 'relatorios':
        renderReports();
        break;
      case 'anual':
        renderAnnual();
        break;
    }
  };

  // Configurar navegação de mês
  const setupMonthNav = () => {
    document.getElementById('prev-month').addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      updateMonthLabel();
      renderDashboard();
    });

    document.getElementById('next-month').addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      updateMonthLabel();
      renderDashboard();
    });

    updateMonthLabel();
  };

  // Atualizar label do mês
  const updateMonthLabel = () => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    document.getElementById('current-month-label').textContent = `${months[currentMonth]} ${currentYear}`;
  };

  // Configurar campos de parcela
  const setupParcelaFields = () => {
    document.getElementById('t-parceled').addEventListener('change', (e) => {
      const parcelaFields = document.getElementById('parcela-fields');
      if (e.target.value === 'yes') {
        parcelaFields.classList.remove('hidden');
      } else {
        parcelaFields.classList.add('hidden');
      }
    });
  };

  // Configurar formulário
  const setupForm = () => {
    document.getElementById('transactionForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const user = firebase.auth().currentUser;
      if (!user) return;

      const type = document.getElementById('t-type').value;
      const desc = document.getElementById('t-desc').value;
      const val = parseFloat(document.getElementById('t-val').value);
      const cat = document.getElementById('t-cat').value;
      const user_who = document.getElementById('t-user').value;
      const date = document.getElementById('t-date').value;
      const isParceled = document.getElementById('t-parceled').value === 'yes';
      
      const transaction = {
        type,
        desc,
        val,
        cat,
        user: user_who,
        date: date + 'T12:00:00',
        createdAt: Date.now()
      };

      if (isParceled) {
        transaction.parceled = true;
        transaction.totalInstallments = parseInt(document.getElementById('t-installments').value);
        transaction.currentInstallment = parseInt(document.getElementById('t-current-installment').value);
      }

      try {
        await firebase.database().ref(`users/${user.uid}/transactions`).push(transaction);
        
        // Limpar formulário
        document.getElementById('transactionForm').reset();
        document.getElementById('parcela-fields').classList.add('hidden');
        
        showToast('Lançamento salvo com sucesso!');
      } catch (error) {
        console.error('Erro ao salvar:', error);
        showToast('Erro ao salvar lançamento', 'error');
      }
    });
  };

  // Filtrar transações por mês
  const getMonthTransactions = () => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  };

  // Filtrar transações por ano
  const getYearTransactions = () => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear;
    });
  };

  // Calcular estatísticas do mês
  const getMonthStats = () => {
    const monthTrans = getMonthTransactions();
    let income = 0;
    let expenses = 0;
    const categories = {};
    const users = {};

    monthTrans.forEach(t => {
      if (t.type === 'entrada') {
        income += t.val;
      } else {
        expenses += t.val;
        categories[t.cat] = (categories[t.cat] || 0) + t.val;
      }
      
      users[t.user] = (users[t.user] || 0) + t.val;
    });

    return {
      income,
      expenses,
      balance: income - expenses,
      categories,
      users,
      count: monthTrans.length
    };
  };

  // Renderizar Dashboard
  const renderDashboard = () => {
    const stats = getMonthStats();
    const formatCurrency = (val) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // Atualizar hero card
    document.getElementById('hero-income').textContent = formatCurrency(stats.income);
    document.getElementById('hero-expenses').textContent = formatCurrency(stats.expenses);
    
    const balanceEl = document.getElementById('hero-balance');
    balanceEl.textContent = formatCurrency(stats.balance);
    balanceEl.className = `hero-balance-value ${stats.balance >= 0 ? 'positive' : 'negative'}`;

    // Atualizar stats cards
    document.getElementById('stat-income').textContent = formatCurrency(stats.income);
    document.getElementById('stat-expenses').textContent = formatCurrency(stats.expenses);
    
    const balanceStat = document.getElementById('stat-balance');
    balanceStat.textContent = formatCurrency(stats.balance);
    balanceStat.parentElement.className = `stat-card ${stats.balance >= 0 ? '' : 'negative'}`;

    // Calcular total de contas pendentes
    const pendingBills = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
    document.getElementById('stat-pending').textContent = formatCurrency(pendingBills);

    // Alerta de orçamento
    updateBudgetAlert(stats.income, stats.expenses);

    // Renderizar gráfico mensal
    renderMonthlyChart();

    // Renderizar gráfico de categorias
    renderCategoryChart(stats.categories);

    // Renderizar últimas movimentações
    renderRecentTransactions();
  };

  // Atualizar alerta de orçamento
  const updateBudgetAlert = (income, expenses) => {
    const alertEl = document.getElementById('budget-alert');
    const titleEl = document.getElementById('budget-alert-title');
    const textEl = document.getElementById('budget-alert-text');
    const iconEl = alertEl.querySelector('.budget-alert-icon');

    if (income === 0) {
      alertEl.className = 'budget-alert warning';
      iconEl.textContent = '⚠';
      titleEl.textContent = 'Sem receitas registradas';
      textEl.textContent = 'Adicione suas receitas para控制ar o orçamento';
    } else {
      const ratio = expenses / income;
      
      if (ratio <= 0.7) {
        alertEl.className = 'budget-alert success';
        iconEl.textContent = '✓';
        titleEl.textContent = 'Orçamento saudável';
        textEl.textContent = `Você utilizou ${(ratio * 100).toFixed(0)}% da sua receita`;
      } else if (ratio <= 0.9) {
        alertEl.className = 'budget-alert warning';
        iconEl.textContent = '⚠';
        titleEl.textContent = 'Atenção ao orçamento';
        textEl.textContent = `Você utilizou ${(ratio * 100).toFixed(0)}% da sua receita`;
      } else {
        alertEl.className = 'budget-alert danger';
        iconEl.textContent = '⚠';
        titleEl.textContent = 'Orçamento no limite!';
        textEl.textContent = `Você utilizou ${(ratio * 100).toFixed(0)}% da sua receita`;
      }
    }

    alertEl.classList.remove('hidden');
  };

  // Renderizar gráfico mensal
  const renderMonthlyChart = () => {
    const container = document.getElementById('monthly-chart');
    container.innerHTML = '';

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthData = [];

    // Coletar dados dos últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      let month = currentMonth - i;
      let year = currentYear;
      
      if (month < 0) {
        month += 12;
        year--;
      }

      const monthTrans = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
      });

      let income = 0;
      let expenses = 0;
      monthTrans.forEach(t => {
        if (t.type === 'entrada') income += t.val;
        else expenses += t.val;
      });

      monthData.push({
        label: months[month],
        income,
        expenses
      });
    }

    // Encontrar valor máximo
    const maxValue = Math.max(...monthData.map(m => Math.max(m.income, m.expenses)), 1);

    // Renderizar barras
    monthData.forEach(data => {
      const incomeHeight = (data.income / maxValue) * 100;
      const expenseHeight = (data.expenses / maxValue) * 100;

      const barHTML = `
        <div class="chart-bar">
          <div class="chart-bar-value">${formatShort(data.income)}</div>
          <div style="display: flex; gap: 4px; align-items: flex-end; height: 120px;">
            <div class="chart-bar-fill" style="height: ${incomeHeight}%; background: var(--positive); width: 20px;"></div>
            <div class="chart-bar-fill" style="height: ${expenseHeight}%; background: var(--negative); width: 20px;"></div>
          </div>
          <div class="chart-bar-label">${data.label}</div>
        </div>
      `;
      container.innerHTML += barHTML;
    });
  };

  // Renderizar gráfico de categorias
  const renderCategoryChart = (categories) => {
    const container = document.getElementById('category-donut');
    const legendContainer = document.getElementById('category-legend');
    const totalEl = document.getElementById('donut-total');
    
    const total = Object.values(categories).reduce((sum, val) => sum + val, 0);
    totalEl.textContent = formatShort(total);

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    let legendHTML = '';
    let offset = 25;

    Object.entries(categories).forEach(([cat, value], index) => {
      const percent = total > 0 ? (value / total) * 100 : 0;
      const color = colors[index % colors.length];

      legendHTML += `
        <div class="legend-item">
          <div class="legend-color" style="background: ${color};"></div>
          <span class="legend-label">${cat}</span>
          <span class="legend-value">${formatShort(value)}</span>
        </div>
      `;

      offset += percent;
    });

    legendContainer.innerHTML = legendHTML;
  };

  // Renderizar últimas movimentações
  const renderRecentTransactions = () => {
    const container = document.getElementById('recent-transactions');
    const recent = [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhuma transação registrada</p>';
      return;
    }

    container.innerHTML = recent.map(t => `
      <div class="transaction-item ${t.type === 'entrada' ? 'income' : 'expense'}">
        <div class="transaction-icon">
          <i class="fa-solid ${t.type === 'entrada' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
        </div>
        <div class="transaction-info">
          <div class="transaction-desc">${escapeHtml(t.desc)}</div>
          <div class="transaction-meta">${escapeHtml(t.user)} · ${escapeHtml(t.cat)} · ${formatDate(t.date)}</div>
        </div>
        <div class="transaction-amount">
          ${t.type === 'entrada' ? '+' : '-'} ${formatCurrency(t.val)}
        </div>
      </div>
    `).join('');
  };

  // Renderizar lançamentos
  const renderTransactions = () => {
    const container = document.getElementById('month-transactions');
    const countEl = document.getElementById('month-transactions-count');
    const monthTrans = getMonthTransactions();

    countEl.textContent = `${monthTrans.length} transações`;

    if (monthTrans.length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhum lançamento este mês</p>';
      return;
    }

    container.innerHTML = monthTrans.map(t => `
      <div class="transaction-item ${t.type === 'entrada' ? 'income' : 'expense'}">
        <div class="transaction-icon">
          <i class="fa-solid ${t.type === 'entrada' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
        </div>
        <div class="transaction-info">
          <div class="transaction-desc">${escapeHtml(t.desc)}</div>
          <div class="transaction-meta">
            ${escapeHtml(t.user)} · ${escapeHtml(t.cat)} · ${formatDate(t.date)}
            ${t.parceled ? ` · Parcela ${t.currentInstallment}/${t.totalInstallments}` : ''}
          </div>
        </div>
        <div class="transaction-amount">
          ${t.type === 'entrada' ? '+' : '-'} ${formatCurrency(t.val)}
        </div>
        <div class="transaction-actions">
          <button onclick="App.deleteTransaction('${t.id}')" title="Excluir">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  };

  // Renderizar contas a pagar
  const renderBills = () => {
    const container = document.getElementById('bills-list');
    const fixedEl = document.getElementById('bills-fixed');
    const variableEl = document.getElementById('bills-variable');
    const totalEl = document.getElementById('bills-total');

    let fixed = 0;
    let variable = 0;

    bills.forEach(b => {
      if (b.fixed) fixed += b.amount;
      else variable += b.amount;
    });

    fixedEl.textContent = formatCurrency(fixed);
    variableEl.textContent = formatCurrency(variable);
    totalEl.textContent = formatCurrency(fixed + variable);

    if (bills.length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhuma conta cadastrada</p>';
      return;
    }

    container.innerHTML = bills.map(b => `
      <div class="installment-item">
        <div class="installment-icon">
          <i class="fa-solid ${b.fixed ? 'fa-receipt' : 'fa-shopping-cart'}"></i>
        </div>
        <div class="installment-info">
          <div class="installment-name">${escapeHtml(b.name)}</div>
          <div class="installment-count">${b.fixed ? 'Fixo' : 'Variável'} · Vence dia ${b.dueDay || '—'}</div>
        </div>
        <div class="installment-value">${formatCurrency(b.amount)}</div>
      </div>
    `).join('');
  };

  // Renderizar parcelas
  const renderInstallments = () => {
    const container = document.getElementById('installments-list');
    const totalEl = document.getElementById('installments-total');
    const pendingEl = document.getElementById('installments-pending');
    const nextEl = document.getElementById('installments-next');

    const installmentTrans = transactions.filter(t => t.parceled && t.totalInstallments > t.currentInstallment);
    
    let totalValue = 0;
    let pendingCount = 0;

    installmentTrans.forEach(t => {
      const remaining = t.totalInstallments - t.currentInstallment;
      totalValue += t.val * remaining;
      pendingCount += remaining;
    });

    totalEl.textContent = formatCurrency(totalValue);
    pendingEl.textContent = pendingCount;

    // Encontrar próxima quitação
    if (installmentTrans.length > 0) {
      const nextQuit = installmentTrans.reduce((earliest, t) => {
        const monthsLeft = t.totalInstallments - t.currentInstallment;
        const quitDate = new Date(t.date);
        quitDate.setMonth(quitDate.getMonth() + monthsLeft);
        return quitDate < earliest ? quitDate : earliest;
      }, new Date('2099-12-31'));
      
      nextEl.textContent = nextQuit.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    } else {
      nextEl.textContent = '—';
    }

    if (installmentTrans.length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhuma parcela ativa</p>';
      return;
    }

    container.innerHTML = installmentTrans.map(t => {
      const remaining = t.totalInstallments - t.currentInstallment;
      const progress = (t.currentInstallment / t.totalInstallments) * 100;
      
      return `
        <div class="installment-item">
          <div class="installment-icon">
            <i class="fa-solid fa-credit-card"></i>
          </div>
          <div class="installment-info">
            <div class="installment-name">${escapeHtml(t.desc)}</div>
            <div class="installment-progress">
              <div class="installment-bar">
                <div class="installment-bar-fill" style="width: ${progress}%;"></div>
              </div>
              <span class="installment-count">${t.currentInstallment}/${t.totalInstallments} (${remaining} restantes)</span>
            </div>
          </div>
          <div class="installment-value">${formatCurrency(t.val)}/mês</div>
        </div>
      `;
    }).join('');
  };

  // Renderizar relatórios
  const renderReports = () => {
    const stats = getMonthStats();
    
    // Relatório por categoria
    const categoryContainer = document.getElementById('category-report');
    const maxCatValue = Math.max(...Object.values(stats.categories), 1);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    categoryContainer.innerHTML = Object.entries(stats.categories)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, value], index) => {
        const percent = (value / maxCatValue) * 100;
        const color = colors[index % colors.length];
        return `
          <div class="category-item">
            <div class="category-icon" style="background: ${color}20; color: ${color};">
              <i class="fa-solid fa-tag"></i>
            </div>
            <div class="category-info">
              <div class="category-name">${cat}</div>
              <div class="category-bar">
                <div class="category-bar-fill" style="width: ${percent}%; background: ${color};"></div>
              </div>
            </div>
            <div>
              <div class="category-value">${formatCurrency(value)}</div>
              <div class="category-percent">${((value / stats.expenses) * 100).toFixed(1)}%</div>
            </div>
          </div>
        `;
      }).join('');

    // Relatório por pessoa
    const userContainer = document.getElementById('user-report');
    const maxUserValue = Math.max(...Object.values(stats.users), 1);

    userContainer.innerHTML = Object.entries(stats.users)
      .sort((a, b) => b[1] - a[1])
      .map(([user, value], index) => {
        const percent = (value / maxUserValue) * 100;
        const color = colors[index % colors.length];
        return `
          <div class="category-item">
            <div class="category-icon" style="background: ${color}20; color: ${color};">
              <i class="fa-solid fa-user"></i>
            </div>
            <div class="category-info">
              <div class="category-name">${user}</div>
              <div class="category-bar">
                <div class="category-bar-fill" style="width: ${percent}%; background: ${color};"></div>
              </div>
            </div>
            <div>
              <div class="category-value">${formatCurrency(value)}</div>
            </div>
          </div>
        `;
      }).join('');
  };

  // Renderizar visão anual
  const renderAnnual = () => {
    const yearTrans = getYearTransactions();
    
    let income = 0;
    let expenses = 0;
    
    yearTrans.forEach(t => {
      if (t.type === 'entrada') income += t.val;
      else expenses += t.val;
    });

    document.getElementById('annual-year').textContent = currentYear;
    document.getElementById('annual-income').textContent = formatCurrency(income);
    document.getElementById('annual-expenses').textContent = formatCurrency(expenses);
    
    const balanceEl = document.getElementById('annual-balance');
    balanceEl.textContent = formatCurrency(income - expenses);
    balanceEl.parentElement.className = `stat-card ${income - expenses >= 0 ? '' : 'negative'}`;

    // Gráfico anual
    renderAnnualChart();

    // Parcelas que terminam no ano
    renderAnnualInstallments();
  };

  // Renderizar gráfico anual
  const renderAnnualChart = () => {
    const container = document.getElementById('annual-chart');
    container.innerHTML = '';

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    let maxValue = 1;

    // Coletar dados
    const monthData = months.map((label, index) => {
      const monthTrans = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      });

      let income = 0;
      let expenses = 0;
      monthTrans.forEach(t => {
        if (t.type === 'entrada') income += t.val;
        else expenses += t.val;
      });

      maxValue = Math.max(maxValue, income, expenses);

      return { label, income, expenses };
    });

    // Renderizar barras
    monthData.forEach(data => {
      const incomeHeight = (data.income / maxValue) * 100;
      const expenseHeight = (data.expenses / maxValue) * 100;

      container.innerHTML += `
        <div class="chart-bar">
          <div class="chart-bar-value">${formatShort(data.income)}</div>
          <div style="display: flex; gap: 4px; align-items: flex-end; height: 180px;">
            <div class="chart-bar-fill" style="height: ${incomeHeight}%; background: var(--positive); width: 20px;"></div>
            <div class="chart-bar-fill" style="height: ${expenseHeight}%; background: var(--negative); width: 20px;"></div>
          </div>
          <div class="chart-bar-label">${data.label}</div>
        </div>
      `;
    });
  };

  // Renderizar parcelas anuais
  const renderAnnualInstallments = () => {
    const container = document.getElementById('annual-installments');
    
    const installmentTrans = transactions.filter(t => t.parceled);
    
    if (installmentTrans.length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhuma parcela encontrada</p>';
      return;
    }

    container.innerHTML = installmentTrans.map(t => {
      const remaining = t.totalInstallments - t.currentInstallment;
      const quitDate = new Date(t.date);
      quitDate.setMonth(quitDate.getMonth() + t.totalInstallments);
      
      const endsThisYear = quitDate.getFullYear() === currentYear;
      
      return `
        <div class="installment-item" style="${endsThisYear ? 'border-left: 3px solid var(--positive);' : ''}">
          <div class="installment-icon">
            <i class="fa-solid fa-credit-card"></i>
          </div>
          <div class="installment-info">
            <div class="installment-name">${escapeHtml(t.desc)}</div>
            <div class="installment-count">
              ${t.currentInstallment}/${t.totalInstallments} · 
              ${remaining > 0 ? `${remaining} restantes` : 'Quitado'} · 
              Termina: ${quitDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
            </div>
          </div>
          <div class="installment-value">${formatCurrency(t.val)}/mês</div>
        </div>
      `;
    }).join('');
  };

  // Deletar transação
  const deleteTransaction = async (id) => {
    if (!confirm('Deseja realmente excluir este lançamento?')) return;
    
    const user = firebase.auth().currentUser;
    if (!user) return;

    try {
      await firebase.database().ref(`users/${user.uid}/transactions/${id}`).remove();
      showToast('Lançamento excluído!');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      showToast('Erro ao excluir', 'error');
    }
  };

  // Criar lançamento
  const createTransaction = () => {
    switchTab('lancamentos');
  };

  // Criar conta
  const createBill = async () => {
    const name = prompt('Nome da conta:');
    if (!name) return;

    const amount = parseFloat(prompt('Valor (R$):'));
    if (isNaN(amount)) return;

    const fixed = confirm('Conta fixa? (OK = Sim, Cancelar = Não)');

    const user = firebase.auth().currentUser;
    if (!user) return;

    try {
      await firebase.database().ref(`users/${user.uid}/bills`).push({
        name,
        amount,
        fixed,
        createdAt: Date.now()
      });
      showToast('Conta cadastrada!');
      renderBills();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      showToast('Erro ao salvar', 'error');
    }
  };

  // Importar Excel
  const importExcel = () => {
    const input = document.getElementById('excel-file-input');
    const log = document.getElementById('import-log');

    if (!input.files || !input.files[0]) {
      log.textContent = 'Selecione um arquivo .xlsx primeiro.';
      return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const user = firebase.auth().currentUser;
        if (!user) {
          log.textContent = 'Faça login para importar.';
          return;
        }

        const novos = [];
        const mesesIgnorados = [];

        const MESES_PT = {
          'janeiro': 0, 'fevereiro': 1, 'março': 2, 'marco': 2, 'abril': 3,
          'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7, 'setembro': 8,
          'outubro': 9, 'novembro': 10, 'dezembro': 11
        };

        workbook.SheetNames.forEach(sheetName => {
          const nome = sheetName.trim().toLowerCase();
          let ano = new Date().getFullYear();
          let mes = -1;

          const anoMatch = nome.match(/20\d{2}/);
          if (anoMatch) ano = parseInt(anoMatch[0]);

          for (const [mesNome, mesIdx] of Object.entries(MESES_PT)) {
            if (nome.includes(mesNome)) {
              mes = mesIdx;
              break;
            }
          }

          if (mes === -1) {
            mesesIgnorados.push(sheetName);
            return;
          }

          const linhas = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
          
          linhas.forEach(linha => {
            if (!linha || linha.length < 2) return;
            
            const desc = String(linha[0] || '').trim();
            const valRaw = linha[1];
            
            if (!desc || valRaw === undefined || valRaw === null) return;
            
            const val = parseFloat(String(valRaw).replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
            if (isNaN(val) || val <= 0) return;

            novos.push({
              type: 'saida',
              desc,
              val,
              cat: 'Gastos Essenciais',
              user: 'Compartilhado',
              date: new Date(ano, mes, 1).toISOString(),
              createdAt: Date.now()
            });
          });
        });

        if (novos.length === 0) {
          log.textContent = 'Nenhuma transação encontrada na planilha.';
          return;
        }

        // Salvar no Firebase
        const updates = {};
        novos.forEach(t => {
          const key = firebase.database().ref().push().key;
          updates[`users/${user.uid}/transactions/${key}`] = t;
        });

        await firebase.database().ref().update(updates);

        let resumo = `✅ ${novos.length} lançamentos importados!`;
        if (mesesIgnorados.length) {
          resumo += `\n⚠️ Abas ignoradas: ${mesesIgnorados.join(', ')}`;
        }
        log.textContent = resumo;

      } catch (err) {
        log.textContent = 'Erro ao ler planilha: ' + err.message;
      }
    };

    reader.readAsArrayBuffer(input.files[0]);
  };

  // Exportar dados
  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "backup_financo.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup exportado!');
  };

  // Limpar dados
  const clearData = async () => {
    if (!confirm('Tem certeza que deseja apagar TODOS os dados? Esta ação não pode ser desfeita.')) return;
    
    const user = firebase.auth().currentUser;
    if (!user) return;

    try {
      await firebase.database().ref(`users/${user.uid}/transactions`).remove();
      showToast('Todos os dados foram limpos.');
    } catch (error) {
      console.error('Erro ao limpar:', error);
      showToast('Erro ao limpar dados', 'error');
    }
  };

  // Fazer logout
  const logout = async () => {
    try {
      await firebase.auth().signOut();
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  // Funções auxiliares
  const formatCurrency = (val) => `R$ ${(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  
  const formatShort = (val) => {
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(1)}k`;
    return `R$ ${val.toFixed(0)}`;
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('pt-BR');
    } catch {
      return '—';
    }
  };

  const escapeHtml = (text) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(text || '').replace(/[&<>"']/g, c => map[c]);
  };

  const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      color: white;
      font-size: 0.9rem;
      font-weight: 500;
      background: ${type === 'success' ? 'var(--positive)' : 'var(--negative)'};
      animation: slideUp 0.3s ease;
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // Inicializar quando o DOM carregar
  document.addEventListener('DOMContentLoaded', init);

  // Retornar métodos públicos
  return {
    logout,
    createTransaction,
    createBill,
    deleteTransaction,
    importExcel,
    exportData,
    clearData
  };

})();
