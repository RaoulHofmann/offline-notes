import { Link } from "react-router-dom";
import {
  BookOpen,
  FileText,
  Clock,
  Database,
  ArrowRight,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";

function getInitialDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem("darkMode");
  if (saved === "true") {
    document.documentElement.classList.add("dark");
    return true;
  }
  return false;
}

export function HomePage() {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-screen-2xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-primary" />
              <span className="text-sm font-semibold tracking-widest uppercase text-primary">
                O-Notes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {darkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
              <Link to="/notes" className={cn(buttonVariants({ variant: "default" }))}>
                  Open Notes
                  <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            Your Offline Notes
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Offline-first note-taking for lectures. Write, organize, and access
            your notes anywhere with no internet required.
          </p>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* CTA Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-8 -mt-6 relative z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Start taking notes
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Notes are saved locally in your browser using SQLite. They work
                offline and persist across sessions.
              </p>
            </div>
            <Link to="/notes" className={cn(buttonVariants({ variant: "default", size: "lg" }))}>
                <FileText className="w-4 h-4 mr-2" />
                Open Editor
            </Link>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Card className="rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Rich Editor
                </h3>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                WYSIWYG editor with{" "}
                <strong className="text-zinc-700 dark:text-zinc-300">
                  formatting support
                </strong>
                . Bold, italic, headings, lists, code blocks, and more.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                  <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  SQLite WASM Storage
                </h3>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Full SQLite database runs in your browser with{" "}
                <strong className="text-zinc-700 dark:text-zinc-300">
                  OPFS persistence
                </strong>
                . No server needed, data stays on your device.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  100% Offline
                </h3>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No account, no cloud dependency. Everything works{" "}
                <strong className="text-zinc-700 dark:text-zinc-300">
                  entirely offline
                </strong>
                . Perfect for lectures with poor connectivity.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Auto-Save
                </h3>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Notes save automatically as you type with{" "}
                <strong className="text-zinc-700 dark:text-zinc-300">
                  real-time debouncing
                </strong>
                . Never lose your work again.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Tag System
                </h3>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Organize notes with{" "}
                <strong className="text-zinc-700 dark:text-zinc-300">
                  tags and labels
                </strong>
                . Filter and search across all your notes instantly.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Export
                </h3>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Export all your notes as{" "}
                <strong className="text-zinc-700 dark:text-zinc-300">
                  JSON files
                </strong>
                . Back up your data or transfer it to another device.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12">
        <div className="max-w-screen-2xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            {/*<p className="text-sm text-zinc-500 dark:text-zinc-400">*/}
            {/*  O-Notes*/}
            {/*</p>*/}
          </div>
        </div>
      </footer>
    </div>
  );
}
