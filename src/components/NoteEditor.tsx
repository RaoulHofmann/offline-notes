import { useNotes } from "@/hooks/useNotes";
import { Link } from "react-router-dom";
import { NoteList } from "./NoteList";
import { Editor } from "./Editor";
import { TagInput } from "./TagInput";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  FileText,
  Clock,
  Download,
  Upload,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeft,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { useState, useCallback, useRef } from "react";

function getInitialDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem("darkMode");
  if (saved === "true") {
    document.documentElement.classList.add("dark");
    return true;
  }
  return false;
}

function formatTimestamp(): string {
  const now = new Date();
  return now.toLocaleString();
}

function wordCount(html: string): number {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const text = tmp.textContent || "";
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatTimeForInput(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

export function NoteEditor() {
  const {
    notes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    tags,
    loading,
    searchQuery,
    setSearchQuery,
    handleCreateNote,
    handleDeleteNote,
    handleContentChange,
    handleTitleChange,
    handleTagsChange,
    handleImportNotes,
  } = useNotes();

  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [timestampDialogOpen, setTimestampDialogOpen] = useState(false);
  const [timestampValue, setTimestampValue] = useState(formatTimeForInput(new Date()));
  const [insertIntoTitle, setInsertIntoTitle] = useState(true);
  const [insertIntoContent, setInsertIntoContent] = useState(true);
  const editorInsertRef = useRef<((text: string) => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.classList.toggle("dark");
  };

  const exportNotes = () => {
    const data = {
      exported: new Date().toISOString(),
      notes: notes.map((n) => ({
        title: n.title,
        content: n.content,
        tags: n.tags,
        created: new Date(n.created).toISOString(),
        modified: new Date(n.modified).toISOString(),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lecturenote-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.notes || !Array.isArray(data.notes)) {
          alert("Invalid file format. Expected a LectureNote export file.");
          return;
        }

        const importedNotes = data.notes.map(
          (n: { title: string; content: string; tags?: string[]; created?: string; modified?: string }) => ({
            title: n.title || "Untitled",
            content: n.content || "",
            tags: n.tags || [],
            created: n.created ? new Date(n.created).getTime() : Date.now(),
            modified: n.modified ? new Date(n.modified).getTime() : Date.now(),
          })
        );

        await handleImportNotes(importedNotes);
      } catch (err) {
        console.error("Import failed:", err);
        alert("Failed to import file. Make sure it's a valid JSON export.");
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleImportNotes]
  );

  const openTimestampDialog = () => {
    setTimestampValue(formatTimeForInput(new Date()));
    setInsertIntoTitle(true);
    setInsertIntoContent(true);
    setTimestampDialogOpen(true);
  };

  const confirmTimestamp = () => {
    const stamp = `[${timestampValue}] `;

    if (insertIntoTitle && activeNoteId) {
      const title = activeNote?.title || "";
      handleTitleChange(title + stamp);
    }

    if (insertIntoContent && editorInsertRef.current) {
      editorInsertRef.current(stamp);
    }

    setTimestampDialogOpen(false);
  };

  const handleEditorInsertTimestamp = useCallback(
    (insertFn: (text: string) => void) => {
      editorInsertRef.current = insertFn;
    },
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
        <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-6 w-5/6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-80 shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
          <NoteList
            notes={notes}
            activeNoteId={activeNoteId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectNote={setActiveNoteId}
            onCreateNote={handleCreateNote}
            onDeleteNote={handleDeleteNote}
          />
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm font-medium hover:bg-muted hover:text-foreground transition-all"
                title="Back to home"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeft className="w-4 h-4" />
                )}
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold tracking-widest uppercase text-primary">
                  LectureNote
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1" />
                Import
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportNotes}
                disabled={notes.length === 0}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {darkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </header>

        {activeNote ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Note Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
              <Input
                value={activeNote.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Note title..."
                className="text-xl font-bold border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
              />
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimestamp()}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  {wordCount(activeNote.content)} words
                </Badge>
                <Dialog
                  open={timestampDialogOpen}
                  onOpenChange={setTimestampDialogOpen}
                >
                  <DialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                      />
                    }
                    onClick={openTimestampDialog}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Insert Timestamp
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Insert Lecture Timestamp</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Time
                        </label>
                        <Input
                          type="time"
                          value={timestampValue}
                          onChange={(e) => setTimestampValue(e.target.value)}
                          className="w-32"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Insert into
                        </label>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={insertIntoTitle}
                              onChange={(e) => setInsertIntoTitle(e.target.checked)}
                              className="rounded border-zinc-300 dark:border-zinc-600"
                            />
                            Title
                          </label>
                          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={insertIntoContent}
                              onChange={(e) => setInsertIntoContent(e.target.checked)}
                              className="rounded border-zinc-300 dark:border-zinc-600"
                            />
                            Editor content
                          </label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose
                        render={<Button variant="outline" />}
                      >
                        Cancel
                      </DialogClose>
                      <Button onClick={confirmTimestamp}>Insert</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="mt-3">
                <TagInput
                  tags={activeNote.tags}
                  onChange={handleTagsChange}
                  suggestions={tags}
                />
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden bg-white dark:bg-zinc-900">
              <Editor
                content={activeNote.content}
                onChange={handleContentChange}
                onInsertTimestamp={handleEditorInsertTimestamp}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Select a note or create a new one
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-md">
              Your notes are saved locally in your browser using SQLite. They
              work offline and persist across sessions.
            </p>
            <Button onClick={handleCreateNote}>Create your first note</Button>
          </div>
        )}
      </main>
    </div>
  );
}
