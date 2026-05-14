/* eslint-disable @typescript-eslint/no-explicit-any */
let _worker: Worker | null = null;
let _messageId = 0;
const _pending = new Map<
  number,
  { resolve: (v: any) => void; reject: (e: Error) => void }
>();
let _initPromise: Promise<void> | null = null;

function getWorker(): Worker {
  if (_worker) return _worker;
  _worker = new Worker(
    new URL("../workers/sqlite.worker.ts", import.meta.url),
    { type: "module" }
  );
  _worker.onmessage = (event: MessageEvent) => {
    const { id, result, error } = event.data;
    const pending = _pending.get(id);
    if (pending) {
      _pending.delete(id);
      if (error) {
        pending.reject(new Error(error));
      } else {
        pending.resolve(result);
      }
    }
  };
  _worker.onerror = (event) => {
    console.error("SQLite worker error:", event);
  };
  return _worker;
}

function send<T = any>(type: string, payload?: any): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const worker = getWorker();
    const id = ++_messageId;
    _pending.set(id, { resolve, reject });
    worker.postMessage({ type, id, payload });
  });
}

async function ensureInitialized(): Promise<void> {
  if (_initPromise) return _initPromise;
  _initPromise = send("init");
  return _initPromise;
}

export async function openDatabase(): Promise<{
  persistent: boolean;
  needsInit: boolean;
}> {
  await ensureInitialized();
  return send("open");
}

export async function queryAll(
  sql: string,
  bind?: any[]
): Promise<Record<string, any>[]> {
  await ensureInitialized();
  return send<Record<string, any>[]>("exec", { sql, bind, rowMode: "object" });
}

export async function queryOne(
  sql: string,
  bind?: any[]
): Promise<Record<string, any> | undefined> {
  const rows = await queryAll(sql, bind);
  return rows[0];
}

export async function execute(sql: string, bind?: any[]): Promise<any[]> {
  await ensureInitialized();
  return send("exec", { sql, bind, rowMode: "object" });
}

export async function closeDatabase(): Promise<void> {
  await send("close");
}

export async function clearDatabase(): Promise<void> {
  await ensureInitialized();
  await send("clear");
  _initPromise = null;
}
