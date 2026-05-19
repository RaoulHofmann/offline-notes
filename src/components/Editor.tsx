import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Quote,
  Minus,
  Clock,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onInsertTimestamp?: (insertFn: (text: string) => void) => void;
}

export function Editor({ content, onChange, onInsertTimestamp }: EditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc dark:prose-invert max-w-none min-h-[300px] md:min-h-[400px] focus:outline-none p-4 md:p-6",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor && onInsertTimestamp) {
      onInsertTimestamp((text: string) => {
        editor.chain().focus().insertContent(text).run();
      });
    }
  }, [editor, onInsertTimestamp]);

  if (!editor) return null;

  const insertTimestamp = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    editor
      .chain()
      .focus()
      .insertContent(`[${hours}:${minutes}:${seconds}] `)
      .run();
  };

  const tools = [
    {
      icon: Bold,
      label: "Bold",
      active: editor.isActive("bold"),
      action: () => editor.chain().focus().toggleBold().run(),
      shortcut: "Ctrl+B",
    },
    {
      icon: Italic,
      label: "Italic",
      active: editor.isActive("italic"),
      action: () => editor.chain().focus().toggleItalic().run(),
      shortcut: "Ctrl+I",
    },
    { divider: true },
    {
      icon: Heading1,
      label: "Heading 1",
      active: editor.isActive("heading", { level: 1 }),
      action: () =>
        editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      icon: Heading2,
      label: "Heading 2",
      active: editor.isActive("heading", { level: 2 }),
      action: () =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    { divider: true },
    {
      icon: List,
      label: "Bullet List",
      active: editor.isActive("bulletList"),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icon: ListOrdered,
      label: "Ordered List",
      active: editor.isActive("orderedList"),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    { divider: true },
    {
      icon: Code,
      label: "Code Block",
      active: editor.isActive("codeBlock"),
      action: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      icon: Quote,
      label: "Blockquote",
      active: editor.isActive("blockquote"),
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      icon: Minus,
      label: "Horizontal Rule",
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
    { divider: true },
    {
      icon: Clock,
      label: "Insert Timestamp",
      action: insertTimestamp,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 p-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto flex-nowrap">
        {tools.map((tool, i) =>
          "divider" in tool ? (
            <Separator
              key={`d-${i}`}
              orientation="vertical"
              className="h-6 mx-1 shrink-0"
            />
          ) : (
            <Toggle
              key={tool.label}
              size="sm"
              pressed={"active" in tool ? tool.active : false}
              onPressedChange={tool.action}
              title={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
              className={cn(
                "md:h-8 md:w-8 h-9 w-9 p-0 shrink-0",
                "active" in tool &&
                  tool.active &&
                  "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
              )}
            >
              <tool.icon className="h-4 w-4" />
            </Toggle>
          )
        )}
      </div>
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}