// js/assets.js — Módulo CRUD de patrimônio

const AssetsModule = (() => {

  const COLLECTION = 'assets';
  let assetsCache = {};

  // Carregar assets
  const load = async (uid) => {
    try {
      assetsCache = await StorageModule.get(uid, COLLECTION);
      return assetsCache;
    } catch (error) {
      console.error('[AssetsModule] Erro ao carregar:', error);
      return {};
    }
  };

  // Criar asset
  const create = async (uid, data) => {
    try {
      const clean = Security.sanitizeObject(data, {
        name: { type: 'string', maxLen: 100, required: true },
        type: { type: 'enum', values: ['vehicle', 'savings', 'real_estate', 'crypto', 'other'], required: true },
        value: { type: 'number', min: 0, required: true },
        purchasePrice: { type: 'number', min: 0 },
        purchaseDate: { type: 'date' },
        description: { type: 'string', maxLen: 200 }
      });

      clean.id = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      clean.icon = Constants.ASSET_ICONS[clean.type] || '📦';
      clean.createdAt = Format.timestamp();

      await StorageModule.set(uid, COLLECTION, clean.id, clean);
      assetsCache[clean.id] = clean;
      return clean;
    } catch (error) {
      console.error('[AssetsModule] Erro ao criar:', error);
      throw error;
    }
  };

  // Atualizar asset
  const update = async (uid, id, data) => {
    try {
      const updates = {};
      if (data.name !== undefined) updates.name = Security.sanitizeInput(data.name, 100);
      if (data.value !== undefined) {
        const val = Security.validateNumber(data.value, 0);
        if (val === null) throw new Error('Valor inválido');
        updates.value = val;
      }
      if (data.description !== undefined) updates.description = Security.sanitizeInput(data.description, 200);

      await StorageModule.update(uid, COLLECTION, id, updates);
      if (assetsCache[id]) Object.assign(assetsCache[id], updates);
      return true;
    } catch (error) {
      console.error('[AssetsModule] Erro ao atualizar:', error);
      throw error;
    }
  };

  // Deletar asset
  const remove = async (uid, id) => {
    try {
      await StorageModule.remove(uid, COLLECTION, id);
      delete assetsCache[id];
      return true;
    } catch (error) {
      console.error('[AssetsModule] Erro ao deletar:', error);
      throw error;
    }
  };

  // Obter valor total do patrimônio
  const getTotal = () => {
    const entries = Object.values(assetsCache);
    const total = entries.reduce((sum, a) => sum + (a.value || 0), 0);
    const byType = {};

    entries.forEach(a => {
      const type = a.type || 'other';
      byType[type] = (byType[type] || 0) + (a.value || 0);
    });

    return { totalValue: total, byType, count: entries.length };
  };

  // Obter todos
  const getAll = () => Object.values(assetsCache);

  // Obter por ID
  const getById = (id) => assetsCache[id] || null;

  // Listener em tempo real
  const onChanges = (uid, callback) => {
    StorageModule.on(uid, COLLECTION, (data) => {
      assetsCache = data;
      callback(data);
    });
  };

  return {
    load,
    create,
    update,
    remove,
    getTotal,
    getAll,
    getById,
    onChanges
  };
})();
