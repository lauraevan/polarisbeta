// Tiny IndexedDB wrapper for ROMs + the PS1 BIOS. Storing raw ArrayBuffers
// keeps everything in the browser — nothing is uploaded anywhere.

const DB_NAME = "polaris-emulator-v1";
const STORE = "blobs";

type Entry = {
  id: string;
  name: string;
  core?: string;
  size: number;
  data: ArrayBuffer;
  addedAt: number;
};

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putBlob(id: string, name: string, core: string | undefined, data: ArrayBuffer) {
  const db = await open();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ id, name, core, data, size: data.byteLength, addedAt: Date.now() } as Entry);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}

export async function getBlob(id: string): Promise<Entry | null> {
  const db = await open();
  const out = await new Promise<Entry | null>((res, rej) => {
    const tx = db.transaction(STORE, "readonly");
    const r = tx.objectStore(STORE).get(id);
    r.onsuccess = () => res((r.result as Entry) ?? null);
    r.onerror = () => rej(r.error);
  });
  db.close();
  return out;
}

export async function deleteBlob(id: string) {
  const db = await open();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}

export async function listBlobs(prefix?: string): Promise<Omit<Entry, "data">[]> {
  const db = await open();
  const out = await new Promise<Omit<Entry, "data">[]>((res, rej) => {
    const tx = db.transaction(STORE, "readonly");
    const r = tx.objectStore(STORE).getAll();
    r.onsuccess = () => {
      const all = (r.result as Entry[]).map(({ data: _d, ...rest }) => rest);
      res(prefix ? all.filter((e) => e.id.startsWith(prefix)) : all);
    };
    r.onerror = () => rej(r.error);
  });
  db.close();
  return out;
}

export function blobUrl(data: ArrayBuffer, mime = "application/octet-stream"): string {
  return URL.createObjectURL(new Blob([data], { type: mime }));
}