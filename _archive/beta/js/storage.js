// js/storage.js — Gerenciador Firebase + localStorage fallback

const StorageModule = (() => {

  let db = null;
  let isOnline = true;
  let statusListener = null;
  const listeners = {};
  const cache = {};

  // Inicializar conexão Firebase
  const init = () => {
    try {
      db = firebase.database();

      // Detectar status de conexão
      const connectedRef = firebase.database().ref('.info/connected');
      connectedRef.on('value', (snap) => {
        isOnline = snap.val() === true;
        if (statusListener) statusListener(isOnline ? 'online' : 'offline');
      });

      return true;
    } catch (error) {
      console.error('[StorageModule] Erro ao inicializar:', error);
      isOnline = false;
      if (statusListener) statusListener('local');
      return false;
    }
  };

  // Obter caminho completo no Firebase
  const getPath = (uid, collection, id) => {
    let path = `users/${uid}/${collection}`;
    if (id) path += `/${id}`;
    return path;
  };

  // Ler dados (com fallback localStorage)
  const get = async (uid, collection) => {
    const path = getPath(uid, collection);
    try {
      const snap = await db.ref(path).once('value');
      const data = snap.val() || {};
      cache[path] = data;
      // Salvar no localStorage como backup
      try {
        localStorage.setItem(`financo_${path}`, JSON.stringify(data));
      } catch (e) { /* quota exceeded */ }
      return data;
    } catch (error) {
      console.error(`[StorageModule] Erro ao ler ${collection}:`, error);
      // Fallback localStorage
      try {
        const local = localStorage.getItem(`financo_${path}`);
        if (local) {
          if (statusListener) statusListener('local');
          return JSON.parse(local);
        }
      } catch (e) { /* parse error */ }
      return cache[path] || {};
    }
  };

  // Salvar dados (com fallback localStorage)
  const set = async (uid, collection, id, data) => {
    const path = getPath(uid, collection, id);
    try {
      await db.ref(path).set({
        ...data,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      });
      // Atualizar cache local
      if (!cache[getPath(uid, collection)]) cache[getPath(uid, collection)] = {};
      cache[getPath(uid, collection)][id] = data;
      try {
        localStorage.setItem(`financo_${getPath(uid, collection)}`, JSON.stringify(cache[getPath(uid, collection)]));
      } catch (e) { /* quota exceeded */ }
      return true;
    } catch (error) {
      console.error(`[StorageModule] Erro ao salvar ${collection}:`, error);
      // Fallback localStorage
      try {
        if (!cache[getPath(uid, collection)]) cache[getPath(uid, collection)] = {};
        cache[getPath(uid, collection)][id] = { ...data, updatedAt: Date.now() };
        localStorage.setItem(`financo_${getPath(uid, collection)}`, JSON.stringify(cache[getPath(uid, collection)]));
        if (statusListener) statusListener('local');
        return true;
      } catch (e) {
        throw new Error('Falha ao salvar dados');
      }
    }
  };

  // Atualizar dados (merge)
  const update = async (uid, collection, id, data) => {
    const path = getPath(uid, collection, id);
    try {
      await db.ref(path).update({
        ...data,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      });
      return true;
    } catch (error) {
      console.error(`[StorageModule] Erro ao atualizar ${collection}:`, error);
      // Fallback localStorage
      try {
        const fullPath = getPath(uid, collection);
        if (!cache[fullPath]) cache[fullPath] = {};
        cache[fullPath][id] = { ...cache[fullPath][id], ...data, updatedAt: Date.now() };
        localStorage.setItem(`financo_${fullPath}`, JSON.stringify(cache[fullPath]));
        if (statusListener) statusListener('local');
        return true;
      } catch (e) {
        throw new Error('Falha ao atualizar dados');
      }
    }
  };

  // Deletar dados
  const remove = async (uid, collection, id) => {
    const path = getPath(uid, collection, id);
    try {
      await db.ref(path).remove();
      return true;
    } catch (error) {
      console.error(`[StorageModule] Erro ao deletar ${collection}:`, error);
      // Fallback localStorage
      try {
        const fullPath = getPath(uid, collection);
        if (cache[fullPath]) delete cache[fullPath][id];
        localStorage.setItem(`financo_${fullPath}`, JSON.stringify(cache[fullPath] || {}));
        if (statusListener) statusListener('local');
        return true;
      } catch (e) {
        throw new Error('Falha ao deletar dados');
      }
    }
  };

  // Listener em tempo real
  const on = (uid, collection, callback) => {
    const path = getPath(uid, collection);
    try {
      const ref = db.ref(path);
      ref.on('value', (snap) => {
        const data = snap.val() || {};
        cache[path] = data;
        callback(data);
      });
      listeners[path] = ref;
      return true;
    } catch (error) {
      console.error(`[StorageModule] Erro ao registrar listener ${collection}:`, error);
      return false;
    }
  };

  // Remover listener
  const off = (uid, collection) => {
    const path = getPath(uid, collection);
    if (listeners[path]) {
      listeners[path].off();
      delete listeners[path];
    }
  };

  // Remover todos os listeners
  const offAll = () => {
    Object.values(listeners).forEach(ref => ref.off());
    Object.keys(listeners).forEach(key => delete listeners[key]);
  };

  // Listener de status
  const onStatusChange = (callback) => {
    statusListener = callback;
  };

  const getStatus = () => isOnline ? 'online' : 'offline';

  return {
    init,
    get,
    set,
    update,
    remove,
    on,
    off,
    offAll,
    onStatusChange,
    getStatus
  };
})();
