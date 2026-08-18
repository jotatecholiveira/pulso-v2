// js/transactions.js — Módulo CRUD de transações

const TransactionsModule = (() => {

  const COLLECTION = 'transactions';
  let transactionsCache = {};

  // Carregar todas as transações
  const load = async (uid) => {
    try {
      transactionsCache = await StorageModule.get(uid, COLLECTION);
      return transactionsCache;
    } catch (error) {
      console.error('[TransactionsModule] Erro ao carregar:', error);
      return {};
    }
  };

  // Criar transação
  const create = async (uid, data) => {
    try {
      const clean = Security.sanitizeObject(data, {
        type: { type: 'enum', values: ['entrada', 'saida'], required: true },
        user: { type: 'enum', values: ['João', 'Vick', 'Compartilhado'], required: true },
        desc: { type: 'string', maxLen: 200, required: true },
        val: { type: 'number', min: 0.01, required: true },
        cat: { type: 'string', maxLen: 100, required: true },
        date: { type: 'date', required: true }
      });

      clean.id = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      clean.createdAt = Format.timestamp();

      await StorageModule.set(uid, COLLECTION, clean.id, clean);
      transactionsCache[clean.id] = clean;
      return clean;
    } catch (error) {
      console.error('[TransactionsModule] Erro ao criar:', error);
      throw error;
    }
  };

  // Atualizar transação
  const update = async (uid, id, data) => {
    try {
      const updates = {};
      if (data.desc !== undefined) updates.desc = Security.sanitizeInput(data.desc, 200);
      if (data.val !== undefined) {
        const val = Security.validateNumber(data.val, 0.01);
        if (val === null) throw new Error('Valor inválido');
        updates.val = val;
      }
      if (data.cat !== undefined) updates.cat = Security.sanitizeInput(data.cat, 100);

      await StorageModule.update(uid, COLLECTION, id, updates);
      if (transactionsCache[id]) Object.assign(transactionsCache[id], updates);
      return true;
    } catch (error) {
      console.error('[TransactionsModule] Erro ao atualizar:', error);
      throw error;
    }
  };

  // Deletar transação
  const remove = async (uid, id) => {
    try {
      await StorageModule.remove(uid, COLLECTION, id);
      delete transactionsCache[id];
      return true;
    } catch (error) {
      console.error('[TransactionsModule] Erro ao deletar:', error);
      throw error;
    }
  };

  // Obter estatísticas
  const getStats = (uid) => {
    const entries = Object.values(transactionsCache);
    let totalIncome = 0;
    let totalExpense = 0;
    const byCategory = {};

    entries.forEach(t => {
      if (t.type === 'entrada') {
        totalIncome += t.val || 0;
      } else {
        totalExpense += t.val || 0;
      }
      const cat = t.cat || 'Outros';
      byCategory[cat] = (byCategory[cat] || 0) + (t.val || 0);
    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      byCategory,
      count: entries.length
    };
  };

  // Filtrar transações
  const filter = (criteria) => {
    let entries = Object.values(transactionsCache);

    if (criteria.type) {
      entries = entries.filter(t => t.type === criteria.type);
    }
    if (criteria.user) {
      entries = entries.filter(t => t.user === criteria.user);
    }
    if (criteria.startDate) {
      entries = entries.filter(t => new Date(t.date) >= new Date(criteria.startDate));
    }
    if (criteria.endDate) {
      entries = entries.filter(t => new Date(t.date) <= new Date(criteria.endDate));
    }

    return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Obter todas
  const getAll = () => Object.values(transactionsCache);

  // Obter por ID
  const getById = (id) => transactionsCache[id] || null;

  // Listener em tempo real
  const onChanges = (uid, callback) => {
    StorageModule.on(uid, COLLECTION, (data) => {
      transactionsCache = data;
      callback(data);
    });
  };

  return {
    load,
    create,
    update,
    remove,
    getStats,
    filter,
    getAll,
    getById,
    onChanges
  };
})();
