import { queryAll, queryOne, execute, openDatabase } from "./db";

export interface Note {
  id: number;
  title: string;
  content: string;
  created: number;
  modified: number;
  tags: string[];
}

export async function initDatabase(): Promise<void> {
  const { needsInit } = await openDatabase();

  if (needsInit) {
    await execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        created INTEGER NOT NULL,
        modified INTEGER NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]'
      )
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_notes_modified ON notes(modified DESC)
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title)
    `);
  }
}

function parseNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as number,
    title: row.title as string,
    content: row.content as string,
    created: row.created as number,
    modified: row.modified as number,
    tags: JSON.parse((row.tags as string) || "[]"),
  };
}

export async function getAllNotes(): Promise<Note[]> {
  const rows = await queryAll(
    "SELECT * FROM notes ORDER BY modified DESC"
  );
  return rows.map(parseNote);
}

export async function getNote(id: number): Promise<Note | undefined> {
  const row = await queryOne("SELECT * FROM notes WHERE id = ?", [id]);
  return row ? parseNote(row) : undefined;
}

export async function createNote(
  title?: string,
  content?: string
): Promise<Note> {
  const now = Date.now();
  await execute(
    "INSERT INTO notes (title, content, created, modified, tags) VALUES (?, ?, ?, ?, ?)",
    [title || "Untitled", content || "", now, now, "[]"]
  );
  const idResult = await queryOne("SELECT last_insert_rowid() as id");
  const id = idResult?.id as number;
  const note = await getNote(id);
  return note!;
}

export async function updateNote(
  id: number,
  updates: Partial<Pick<Note, "title" | "content" | "tags">>
): Promise<Note | undefined> {
  const existing = await getNote(id);
  if (!existing) return undefined;

  const title = updates.title ?? existing.title;
  const content = updates.content ?? existing.content;
  const tags = updates.tags ?? existing.tags;
  const now = Date.now();

  await execute(
    "UPDATE notes SET title = ?, content = ?, tags = ?, modified = ? WHERE id = ?",
    [title, content, JSON.stringify(tags), now, id]
  );

  return getNote(id);
}

export async function deleteNote(id: number): Promise<boolean> {
  await execute("DELETE FROM notes WHERE id = ?", [id]);
  return true;
}

export async function searchNotes(query: string): Promise<Note[]> {
  const pattern = `%${query}%`;
  const rows = await queryAll(
    "SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY modified DESC",
    [pattern, pattern]
  );
  return rows.map(parseNote);
}

export async function getNotesByTag(tag: string): Promise<Note[]> {
  const rows = await queryAll(
    "SELECT * FROM notes WHERE tags LIKE ? ORDER BY modified DESC",
    [`%${tag}%`]
  );
  return rows.map(parseNote).filter((n) => n.tags.includes(tag));
}

export async function importNote(note: {
  title: string;
  content: string;
  tags: string[];
  created: number;
  modified: number;
}): Promise<Note> {
  const result = await execute(
    "INSERT INTO notes (title, content, created, modified, tags) VALUES (?, ?, ?, ?, ?)",
    [note.title, note.content, note.created, note.modified, JSON.stringify(note.tags)]
  );
  const id = result[0]?.insertId ?? result[0]?.last_insert_rowid;
  const created = await getNote(id);
  return created!;
}

export async function getAllTags(): Promise<string[]> {
  const notes = await getAllNotes();
  const tagSet = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}