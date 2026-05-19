/* eslint-disable @typescript-eslint/no-explicit-any */
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

type SQLite3 = Awaited<ReturnType<typeof sqlite3InitModule>>;

let sqlite3: SQLite3 | null = null;
let db: any = null;
let poolUtil: any = null;

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
  return {};
}

async function handleOpen() {
  if (!sqlite3) throw new Error("SQLite not initialized");

  if (db) {
    return { alreadyOpen: true };
  }

  const dbFileName = "/note.sqlite";

  try {
    poolUtil = await sqlite3.installOpfsSAHPoolVfs({
      name: "opfs-sahpool",
      directory: ".note",
    });

    db = new poolUtil.OpfsSAHPoolDb(dbFileName);
    return { persistent: true, needsInit: true };
  } catch (err) {
    console.warn("OPFS unavailable, falling back to in-memory database:", err);

    db = new sqlite3.oo1.DB();
    return { persistent: false, needsInit: true };
  }
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

  if (poolUtil) {
    try {
      await poolUtil.wipeFiles();
    } catch (e) {
      throw new Error(`Failed to clear OPFS: ${String(e)}`, { cause: e });
    }
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
