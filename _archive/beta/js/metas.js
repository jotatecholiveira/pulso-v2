// js/metas.js — Módulo CRUD de metas financeiras

const MetasModule = (() => {

  const COLLECTION = 'metas';
  let metasCache = {};

  // Carregar metas do Firebase
  const load = async (uid) => {
    try {
      metasCache = await StorageModule.get(uid, COLLECTION);
      return metasCache;
    } catch (error) {
      console.error('[MetasModule] Erro ao carregar:', error);
      return {};
    }
  };

  // Salvar meta (curto/medio/longo)
  const save = async (uid, key, data) => {
    try {
      if (!['curto', 'medio', 'longo'].includes(key)) {
        throw new Error('Chave de meta inválida');
      }

      const clean = Security.sanitizeObject(data, {
        name: { type: 'string', maxLen: 100, required: true },
        goal: { type: 'number', min: 0.01, required: true },
        current: { type: 'number', min: 0, required: true },
        icon: { type: 'string', maxLen: 10 },
        deadline: { type: 'date' },
        priority: { type: 'enum', values: ['high', 'medium', 'low'] },
        description: { type: 'string', maxLen: 200 },
        type: { type: 'string', maxLen: 50 },
        category: { type: 'string', maxLen: 50 }
      });

      // Validar current <= goal
      if (clean.current > clean.goal) {
        throw new Error('Valor atual não pode ser maior que a meta');
      }

      clean.id = key;
      clean.updatedAt = Format.timestamp();
      if (!clean.createdAt) clean.createdAt = Format.timestamp();

      await StorageModule.set(uid, COLLECTION, key, clean);
      metasCache[key] = clean;
      return clean;
    } catch (error) {
      console.error('[MetasModule] Erro ao salvar:', error);
      throw error;
    }
  };

  // Atualizar meta (merge parcial)
  const update = async (uid, key, data) => {
    try {
      if (data.goal !== undefined) {
        const goal = Security.validateNumber(data.goal, 0.01);
        if (goal === null) throw new Error('Meta inválida');
        data.goal = goal;
      }
      if (data.current !== undefined) {
        const current = Security.validateNumber(data.current, 0);
        if (current === null) throw new Error('Valor atual inválido');
        data.current = current;
      }

      // Validar current <= goal
      const goal = data.goal || metasCache[key]?.goal;
      const current = data.current || metasCache[key]?.current;
      if (goal && current && current > goal) {
        throw new Error('Valor atual não pode ser maior que a meta');
      }

      await StorageModule.update(uid, COLLECTION, key, data);
      if (metasCache[key]) Object.assign(metasCache[key], data);
      return true;
    } catch (error) {
      console.error('[MetasModule] Erro ao atualizar:', error);
      throw error;
    }
  };

  // Calcular progresso de uma meta
  const getProgress = (key) => {
    const meta = metasCache[key];
    if (!meta) return null;

    const progress = Format.percentage(meta.current, meta.goal);
    const remaining = Math.max(meta.goal - meta.current, 0);
    const progressWidth = Format.progressWidth(meta.current, meta.goal);

    let daysLeft = null;
    let monthlyNeeded = null;

    if (meta.deadline) {
      const deadline = new Date(meta.deadline);
      const now = new Date();
      daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      if (daysLeft > 0) {
        const monthsLeft = daysLeft / 30;
        monthlyNeeded = remaining / monthsLeft;
      }
    }

    return {
      ...meta,
      progress,
      remaining,
      progressWidth,
      daysLeft,
      monthlyNeeded
    };
  };

  // Sugerir meta de emergência (6 meses de gasto médio)
  const suggestEmergency = (monthlyExpenses) => {
    return {
      name: 'Reserva de Emergência',
      goal: monthlyExpenses * 6,
      current: 0,
      icon: '🛡️',
      priority: 'high',
      description: '6 meses de despesas fixas',
      type: 'emergency',
      category: 'financial_security'
    };
  };

  // Obter todas as metas com progresso
  const getAllWithProgress = () => {
    const result = {};
    for (const key of ['curto', 'medio', 'longo']) {
      result[key] = getProgress(key);
    }
    return result;
  };

  // Listener em tempo real
  const onChanges = (uid, callback) => {
    StorageModule.on(uid, COLLECTION, (data) => {
      metasCache = data;
      callback(data);
    });
  };

  return {
    load,
    save,
    update,
    getProgress,
    suggestEmergency,
    getAllWithProgress,
    onChanges
  };
})();
