import { useState, useEffect, useCallback, useRef } from "react";
import type { Note } from "@/lib/notes";
import {
  initDatabase,
  getAllNotes,
  createNote,
  importNote,
  updateNote,
  deleteNote,
  searchNotes,
  getAllTags,
} from "@/lib/notes";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dbReadyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initRef = useRef(false);

  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null;

  const refreshNotes = useCallback(async () => {
    if (!dbReadyRef.current) return;
    try {
      const allNotes = searchQuery
        ? await searchNotes(searchQuery)
        : await getAllNotes();
      setNotes(allNotes);
    } catch (err) {
      console.error("Failed to load notes:", err);
    }
  }, [searchQuery]);

  const refreshTags = useCallback(async () => {
    if (!dbReadyRef.current) return;
    try {
      const allTags = await getAllTags();
      setTags(allTags);
    } catch (err) {
      console.error("Failed to load tags:", err);
    }
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      try {
        await initDatabase();
        dbReadyRef.current = true;
        const allNotes = await getAllNotes();
        console.log(allNotes);
        setNotes(allNotes);
        const allTags = await getAllTags();
        setTags(allTags);
      } catch (err) {
        console.error("Failed to initialize database:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (dbReadyRef.current) {
      refreshNotes();
    }
  }, [searchQuery, refreshNotes]);

  const handleCreateNote = useCallback(async () => {
    try {
      const note = await createNote();
      await refreshNotes();
      setActiveNoteId(note.id);
      return note;
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  }, [refreshNotes]);

  const handleDeleteNote = useCallback(
    async (id: number) => {
      try {
        await deleteNote(id);
        if (activeNoteId === id) {
          const remaining = notes.filter((n) => n.id !== id);
          setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
        }
        await refreshNotes();
        await refreshTags();
      } catch (err) {
        console.error("Failed to delete note:", err);
      }
    },
    [activeNoteId, notes, refreshNotes, refreshTags]
  );

  const handleUpdateNote = useCallback(
    async (id: number, updates: Partial<Pick<Note, "title" | "content" | "tags">>) => {
      try {
        const updated = await updateNote(id, updates);
        if (updated) {
          setNotes((prev) =>
            prev.map((n) => (n.id === id ? updated : n))
          );
          console.log(`Updated note ${id} with ${JSON.stringify(updates)}`);
          if (updates.tags) {
            await refreshTags();
          }
        }
      } catch (err) {
        console.error("Failed to update note:", err);
      }
    },
    [refreshTags]
  );

  const debouncedSave = useCallback(
    (id: number, updates: Partial<Pick<Note, "title" | "content">>) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      setSaving(true);
      saveTimerRef.current = setTimeout(async () => {
        await handleUpdateNote(id, updates);
        setSaving(false);
      }, 1000);
    },
    [handleUpdateNote]
  );

  const handleContentChange = useCallback(
    (content: string) => {
      if (!activeNoteId) return;
      setNotes((prev) =>
        prev.map((n) =>
          n.id === activeNoteId ? { ...n, content, modified: Date.now() } : n
        )
      );
      debouncedSave(activeNoteId, { content });
    },
    [activeNoteId, debouncedSave]
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      if (!activeNoteId) return;
      setNotes((prev) =>
        prev.map((n) =>
          n.id === activeNoteId ? { ...n, title, modified: Date.now() } : n
        )
      );
      debouncedSave(activeNoteId, { title });
    },
    [activeNoteId, debouncedSave]
  );

  const handleTagsChange = useCallback(
    async (tags: string[]) => {
      if (!activeNoteId) return;
      await handleUpdateNote(activeNoteId, { tags });
    },
    [activeNoteId, handleUpdateNote]
  );

  const handleImportNotes = useCallback(
    async (importedNotes: { title: string; content: string; tags: string[]; created: number; modified: number }[]) => {
      try {
        for (const note of importedNotes) {
          await importNote(note);
        }
        await refreshNotes();
        await refreshTags();
      } catch (err) {
        console.error("Failed to import notes:", err);
      }
    },
    [refreshNotes, refreshTags]
  );

  return {
    notes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    tags,
    loading,
    saving,
    searchQuery,
    setSearchQuery,
    handleCreateNote,
    handleDeleteNote,
    handleUpdateNote,
    handleContentChange,
    handleTitleChange,
    handleTagsChange,
    handleImportNotes,
  };
}
