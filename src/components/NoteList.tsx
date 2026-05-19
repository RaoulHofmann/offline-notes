import type {Note} from "@/lib/notes";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {ScrollArea} from "@/components/ui/scroll-area";
import {
  Plus,
  Search,
  FileText,
  Trash2,
  X,
} from "lucide-react";
import {cn} from "@/lib/utils";

interface NoteListProps {
  notes: Note[];
  activeNoteId: number | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectNote: (id: number) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: number) => void;
  onClose?: () => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

export function NoteList({
                            notes,
                            activeNoteId,
                            searchQuery,
                            onSearchChange,
                            onSelectNote,
                            onCreateNote,
                            onDeleteNote,
                            onClose,
                          }: NoteListProps) {

  return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              O-Notes
            </h2>
            <div className="flex items-center gap-1">
              {onClose && (
                <Button size="sm" variant="ghost" className="md:hidden h-7 w-7 p-0 -mr-1" onClick={onClose}>
                  <X className="w-4 h-4"/>
                </Button>
              )}
              <Button size="sm" onClick={onCreateNote}>
                <Plus className="w-4 h-4 mr-1"/>
                New
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"/>
            <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 pr-8"
            />
            {searchQuery && (
                <button
                    onClick={() => onSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-4 h-4"/>
                </button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-3"/>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {searchQuery ? "No notes found" : "No notes yet"}
                  </p>
                </div>
            ) : (
                notes.map((note) => (
                    <div
                        key={note.id}
                        onClick={() => onSelectNote(note.id)}
                        className={cn(
                            "w-full text-left rounded-xl p-3 transition-all relative group cursor-pointer",
                            activeNoteId === note.id
                                ? "bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent"
                        )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {note.title || "Untitled"}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                            {stripHtml(note.content).slice(0, 100) || "Empty note"}
                          </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 text-zinc-400 hover:text-rose-500 md:opacity-0 md:group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNote(note.id);
                            }}
                        >
                          <Trash2 className="w-3 h-3"/>
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          {formatDate(note.modified)}
                        </span>
                        {note.tags.length > 0 && (
                            <div className="flex gap-1">
                              {note.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                      key={tag}
                                      variant="secondary"
                                      className="text-xs px-1.5 py-0"
                                  >
                                    {tag}
                                  </Badge>
                              ))}
                              {note.tags.length > 2 && (
                                  <span className="text-xs text-zinc-400">
                                    +{note.tags.length - 2}
                                  </span>
                              )}
                            </div>
                        )}
                      </div>
                    </div>
                ))
            )}
          </div>
        </ScrollArea>
      </div>
  );
}
