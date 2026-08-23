// Camada local de persistência (substitui o backend do base44).
// Usa IndexedDB no navegador — os dados ficam salvos no dispositivo do usuário.

const DB_NAME = 'workday_db';
const DB_VERSION = 1;

export const SESSION_KEY = 'workday_session_user_id';

export function getCurrentUserId() {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

const STORES = [
  'clients',
  'appointments',
  'attendances',
  'tasks',
  'processes',
  'documents',
  'history_events',
  'users',
  'password_resets',
  'audit_log',
];

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function withStore(storeName, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = fn(store);
    tx.oncomplete = () => resolve(result?.result ?? result);
    tx.onerror = () => reject(tx.error);
  });
}

function getAllFromStore(storeName) {
  return new Promise(async (resolve, reject) => {
    const db = await openDb();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function applySort(items, sortStr) {
  if (!sortStr) return items;
  const desc = sortStr.startsWith('-');
  const field = desc ? sortStr.slice(1) : sortStr;
  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

function applyFilter(items, query) {
  if (!query) return items;
  const keys = Object.keys(query);
  if (!keys.length) return items;
  return items.filter((item) => keys.every((k) => item[k] === query[k]));
}

// Campo usado para identificar o registro de forma legível no log de auditoria.
const LABEL_FIELDS = ['titulo', 'nome', 'numero', 'cliente_nome', 'descricao'];
function labelFor(record) {
  for (const f of LABEL_FIELDS) {
    if (record?.[f]) return String(record[f]);
  }
  return record?.id || '';
}

async function logAudit({ entity, entityId, action, before, after }) {
  const actorId = getCurrentUserId();
  const record = {
    id: uuid(),
    actor_id: actorId,
    entity,
    entity_id: entityId,
    action, // 'create' | 'update' | 'delete'
    label: labelFor(after || before),
    changes: action === 'update' ? diffFields(before, after) : undefined,
    created_date: new Date().toISOString(),
  };
  try {
    await withStore('audit_log', 'readwrite', (store) => store.put(record));
  } catch {
    // Nunca deixa a auditoria quebrar a operação principal.
  }
}

function diffFields(before, after) {
  if (!before || !after) return [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes = [];
  for (const k of keys) {
    if (['id', 'created_date', 'updated_date'].includes(k)) continue;
    if (before[k] !== after[k]) {
      changes.push({ field: k, from: before[k], to: after[k] });
    }
  }
  return changes;
}

// Cria uma "coleção" com a mesma interface que o base44.entities.X expunha,
// para minimizar mudanças nas páginas que já usavam `base44.entities.X.*`.
export function createCollection(storeName) {
  return {
    async list(sortStr, limit) {
      const all = await getAllFromStore(storeName);
      const sorted = applySort(all, sortStr);
      return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
    },
    async filter(query, sortStr, limit) {
      const all = await getAllFromStore(storeName);
      const filtered = applyFilter(all, query);
      const sorted = applySort(filtered, sortStr);
      return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
    },
    async get(id) {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    },
    async create(data) {
      const now = new Date().toISOString();
      const record = { id: uuid(), created_date: now, updated_date: now, ...data };
      await withStore(storeName, 'readwrite', (store) => store.put(record));
      logAudit({ entity: storeName, entityId: record.id, action: 'create', after: record });
      return record;
    },
    async update(id, data) {
      const db = await openDb();
      const existing = await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      if (!existing) throw new Error('Registro não encontrado');
      const updated = { ...existing, ...data, id, updated_date: new Date().toISOString() };
      await withStore(storeName, 'readwrite', (store) => store.put(updated));
      logAudit({ entity: storeName, entityId: id, action: 'update', before: existing, after: updated });
      return updated;
    },
    async delete(id) {
      const db = await openDb();
      const existing = await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      await withStore(storeName, 'readwrite', (store) => store.delete(id));
      logAudit({ entity: storeName, entityId: id, action: 'delete', before: existing });
      return { id };
    },
  };
}

export { uuid, openDb, getAllFromStore, withStore };
