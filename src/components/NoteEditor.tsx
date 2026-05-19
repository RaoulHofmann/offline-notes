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
  Loader2,
  Check,
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

export function NoteEditor() {
  const {
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
    handleContentChange,
    handleTitleChange,
    handleTagsChange,
    handleImportNotes,
  } = useNotes();

  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [timestampDialogOpen, setTimestampDialogOpen] = useState(false);
  const [timestampValue, setTimestampValue] = useState('00:00:00');
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
    a.download = `note-export-${new Date().toISOString().slice(0, 10)}.json`;
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
          alert("Invalid file format. Expected a Note export file.");
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
    setTimestampValue('00:00:00');
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
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row">
        <div className="w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="flex-1 p-4 md:p-8">
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
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-40 w-80 md:relative md:z-auto md:shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
            <NoteList
              notes={notes}
              activeNoteId={activeNoteId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectNote={(id) => {
                setActiveNoteId(id);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              onCreateNote={() => {
                handleCreateNote();
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              onDeleteNote={handleDeleteNote}
              onClose={() => setSidebarOpen(false)}
            />
          </aside>
        </>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 md:px-4 py-2 md:py-3">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 md:gap-3">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden h-8 w-8 p-0"
                  onClick={() => setSidebarOpen(true)}
                  title="Open sidebar"
                >
                  <PanelLeft className="w-4 h-4" />
                </Button>
              )}
              <Link
                to="/"
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm font-medium hover:bg-muted hover:text-foreground transition-all"
                title="Back to home"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Separator orientation="vertical" className="h-6 hidden md:block" />
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeft className="w-4 h-4" />
                )}
              </Button>
              <Separator orientation="vertical" className="h-6 hidden md:block" />
            </div>
            <div className="flex items-center gap-1 md:gap-2">
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
                className="h-8 md:h-9"
                onClick={() => fileInputRef.current?.click()}
                title="Import notes"
              >
                <Upload className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">Import</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 md:h-9"
                onClick={exportNotes}
                disabled={notes.length === 0}
                title="Export notes"
              >
                <Download className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">Export</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleDarkMode} title={darkMode ? "Light mode" : "Dark mode"}>
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
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-6 py-3 md:py-4">
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
                {saving ? (
                  <Badge variant="secondary" className="text-xs text-teal-600 dark:text-teal-400">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Saving...
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs text-zinc-400">
                    <Check className="w-3 h-3 mr-1" />
                    Saved
                  </Badge>
                )}
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
                      <DialogTitle>Insert Video Timestamp</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Timestamp
                        </label>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max="99"
                            value={timestampValue.split(":")[0]}
                            onChange={(e) => {
                              const parts = timestampValue.split(":");
                              const h = Math.min(99, Math.max(0, parseInt(e.target.value) || 0)).toString().padStart(2, "0");
                              setTimestampValue(`${h}:${parts[1]}:${parts[2]}`);
                            }}
                            className="w-16 text-center"
                            placeholder="HH"
                          />
                          <span className="text-zinc-400">:</span>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={timestampValue.split(":")[1]}
                            onChange={(e) => {
                              const parts = timestampValue.split(":");
                              const m = Math.min(59, Math.max(0, parseInt(e.target.value) || 0)).toString().padStart(2, "0");
                              setTimestampValue(`${parts[0]}:${m}:${parts[2]}`);
                            }}
                            className="w-16 text-center"
                            placeholder="MM"
                          />
                          <span className="text-zinc-400">:</span>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={timestampValue.split(":")[2]}
                            onChange={(e) => {
                              const parts = timestampValue.split(":");
                              const s = Math.min(59, Math.max(0, parseInt(e.target.value) || 0)).toString().padStart(2, "0");
                              setTimestampValue(`${parts[0]}:${parts[1]}:${s}`);
                            }}
                            className="w-16 text-center"
                            placeholder="SS"
                          />
                        </div>
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
