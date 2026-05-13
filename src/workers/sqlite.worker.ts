/* eslint-disable @typescript-eslint/no-explicit-any */
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

type SQLite3 = Awaited<ReturnType<typeof sqlite3InitModule>>;

let sqlite3: SQLite3 | null = null;
let db: any = null;

interface WorkerMessage {
  type: string;
  id: number;
  payload?: any;
}

interface WorkerResponse {
  id: number;
  result?: any;
  error?: string;
}

function respond(msg: WorkerResponse) {
  self.postMessage(msg);
}

async function handleInit() {
  sqlite3 = await sqlite3InitModule();
  const opfsAvailable = sqlite3 !== null && "opfs" in sqlite3;
  return { opfsAvailable };
}

async function handleOpen() {
  if (!sqlite3) throw new Error("SQLite not initialized");

  if (db) {
    return { alreadyOpen: true };
  }

  const opfsAvailable = "opfs" in sqlite3;
  const opfsName = "lecturenote.sqlite";

  if (opfsAvailable) {
    let exists = false;
    try {
      const testDb = new (sqlite3.oo1 as any).OpfsDb(opfsName, "r");
      testDb.close();
      exists = true;
    } catch {
      // Database doesn't exist yet
    }

    if (exists) {
      db = new (sqlite3.oo1 as any).OpfsDb(opfsName, "w");
      return { persistent: true, needsInit: false };
    }

    try {
      db = new (sqlite3.oo1 as any).OpfsDb(opfsName, "w");
      return { persistent: true, needsInit: true };
    } catch {
      db = new sqlite3.oo1.DB(":memory:");
      return { persistent: false, needsInit: true };
    }
  }

  db = new sqlite3.oo1.DB(":memory:");
  return { persistent: false, needsInit: true };
}

function handleExec(payload: {
  sql: string;
  bind?: any[];
  rowMode?: "array" | "object";
}) {
  if (!db) throw new Error("Database not open");

  const { sql, bind, rowMode } = payload;
  const results: Record<string, any>[] = [];

  db.exec({
    sql,
    bind,
    rowMode: rowMode ?? "object",
    callback: (row: Record<string, any>) => {
      results.push(row);
    },
  });

  return results;
}

function handleClose() {
  db?.close();
  db = null;
  return { success: true };
}

async function handleClear() {
  db?.close();
  db = null;

  try {
    const root = await navigator.storage.getDirectory();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore entries() is async iterable in OPFS
    for await (const [name] of root.entries()) {
      await root.removeEntry(name, { recursive: true });
    }
  } catch (e) {
    throw new Error(`Failed to clear OPFS: ${String(e)}`, { cause: e });
  }

  return { success: true };
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, id, payload } = event.data;

  try {
    let result: any;

    switch (type) {
      case "init":
        result = await handleInit();
        break;
      case "open":
        result = await handleOpen();
        break;
      case "exec":
        result = handleExec(payload);
        break;
      case "close":
        result = handleClose();
        break;
      case "clear":
        result = await handleClear();
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    respond({ id, result });
  } catch (e) {
    respond({
      id,
      error: e instanceof Error ? e.message : String(e),
    });
  }
};
