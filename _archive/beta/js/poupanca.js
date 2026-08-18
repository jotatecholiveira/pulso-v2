// js/poupanca.js — Módulo CRUD de contas poupança

const PoupancaModule = (() => {

  const COLLECTION = 'poupanca';
  let poupancaCache = {};

  // Carregar contas
  const load = async (uid) => {
    try {
      poupancaCache = await StorageModule.get(uid, COLLECTION);
      return poupancaCache;
    } catch (error) {
      console.error('[PoupancaModule] Erro ao carregar:', error);
      return {};
    }
  };

  // Criar conta
  const create = async (uid, data) => {
    try {
      const clean = Security.sanitizeObject(data, {
        name: { type: 'string', maxLen: 100, required: true },
        bank: { type: 'string', maxLen: 50, required: true },
        amount: { type: 'number', min: 0, required: true },
        interestRate: { type: 'number', min: 0, max: 1 },
        description: { type: 'string', maxLen: 200 }
      });

      clean.id = `poup_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      clean.lastUpdate = new Date().toISOString();
      clean.createdAt = Format.timestamp();

      await StorageModule.set(uid, COLLECTION, clean.id, clean);
      poupancaCache[clean.id] = clean;
      return clean;
    } catch (error) {
      console.error('[PoupancaModule] Erro ao criar:', error);
      throw error;
    }
  };

  // Atualizar conta
  const update = async (uid, id, data) => {
    try {
      const updates = {};
      if (data.amount !== undefined) {
        const val = Security.validateNumber(data.amount, 0);
        if (val === null) throw new Error('Valor inválido');
        updates.amount = val;
      }
      if (data.interestRate !== undefined) {
        const rate = Security.validateNumber(data.interestRate, 0, 1);
        if (rate === null) throw new Error('Taxa inválida');
        updates.interestRate = rate;
      }
      updates.lastUpdate = new Date().toISOString();

      await StorageModule.update(uid, COLLECTION, id, updates);
      if (poupancaCache[id]) Object.assign(poupancaCache[id], updates);
      return true;
    } catch (error) {
      console.error('[PoupancaModule] Erro ao atualizar:', error);
      throw error;
    }
  };

  // Deletar conta
  const remove = async (uid, id) => {
    try {
      await StorageModule.remove(uid, COLLECTION, id);
      delete poupancaCache[id];
      return true;
    } catch (error) {
      console.error('[PoupancaModule] Erro ao deletar:', error);
      throw error;
    }
  };

  // Obter total em poupança
  const getTotal = () => {
    const entries = Object.values(poupancaCache);
    const total = entries.reduce((sum, p) => sum + (p.amount || 0), 0);
    return { totalAmount: total, count: entries.length };
  };

  // Projeção de rendimento
  const getProjection = (months = 12) => {
    const entries = Object.values(poupancaCache);
    const projections = [];

    for (let m = 0; m <= months; m++) {
      let monthTotal = 0;
      entries.forEach(p => {
        const rate = p.interestRate || 0;
        const monthlyRate = rate / 12;
        monthTotal += (p.amount || 0) * Math.pow(1 + monthlyRate, m);
      });
      projections.push({ month: m, amount: monthTotal });
    }

    return projections;
  };

  // Obter todos
  const getAll = () => Object.values(poupancaCache);

  // Obter por ID
  const getById = (id) => poupancaCache[id] || null;

  // Listener em tempo real
  const onChanges = (uid, callback) => {
    StorageModule.on(uid, COLLECTION, (data) => {
      poupancaCache = data;
      callback(data);
    });
  };

  return {
    load,
    create,
    update,
    remove,
    getTotal,
    getProjection,
    getAll,
    getById,
    onChanges
  };
})();
