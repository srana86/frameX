"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlock from "@tiptap/extension-code-block";
import Blockquote from "@tiptap/extension-blockquote";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Highlighter,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Image as ImageIcon,
  CheckSquare,
  Quote,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Props = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
};

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        blockquote: false, // We'll add it separately
        codeBlock: false, // We'll add it separately
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Write product details...",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Subscript,
      Superscript,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-md",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlock.configure({
        languageClassPrefix: "language-",
      }),
      Blockquote,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!mounted || !editor) {
    return (
      <div className='rounded-md border bg-background min-h-[200px] flex items-center justify-center'>
        <div className='text-sm text-muted-foreground'>Loading editor...</div>
      </div>
    );
  }

  const addImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);
    if (url === null) {
      return;
    }
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className='rounded-md border bg-background'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center gap-1 border-b p-2 bg-muted/30'>
        {/* Undo/Redo */}
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className='h-8 w-8 p-0'
          title='Undo'
        >
          <Undo className='h-4 w-4' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className='h-8 w-8 p-0'
          title='Redo'
        >
          <Redo className='h-4 w-4' />
        </Button>

        <div className='h-6 w-px bg-border mx-1' />

        {/* Heading Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={cn(
                "h-8 px-2",
                (editor.isActive("heading", { level: 1 }) ||
                  editor.isActive("heading", { level: 2 }) ||
                  editor.isActive("heading", { level: 3 }) ||
                  editor.isActive("heading", { level: 4 }) ||
                  editor.isActive("heading", { level: 5 }) ||
                  editor.isActive("heading", { level: 6 })) &&
                  "bg-accent"
              )}
            >
              <Heading1 className='h-4 w-4 mr-1' />
              <span className='text-xs'>
                {editor.isActive("heading", { level: 1 })
                  ? "H1"
                  : editor.isActive("heading", { level: 2 })
                  ? "H2"
                  : editor.isActive("heading", { level: 3 })
                  ? "H3"
                  : editor.isActive("heading", { level: 4 })
                  ? "H4"
                  : editor.isActive("heading", { level: 5 })
                  ? "H5"
                  : editor.isActive("heading", { level: 6 })
                  ? "H6"
                  : "Normal"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start'>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={editor.isActive("paragraph") ? "bg-accent" : ""}
            >
              Normal
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""}
            >
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}
            >
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive("heading", { level: 3 }) ? "bg-accent" : ""}
            >
              Heading 3
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
              className={editor.isActive("heading", { level: 4 }) ? "bg-accent" : ""}
            >
              Heading 4
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
              className={editor.isActive("heading", { level: 5 }) ? "bg-accent" : ""}
            >
              Heading 5
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
              className={editor.isActive("heading", { level: 6 }) ? "bg-accent" : ""}
            >
              Heading 6
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className='h-6 w-px bg-border mx-1' />

        {/* Lists */}
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("bulletList") && "bg-accent")}
          title='Bullet List'
        >
          <List className='h-4 w-4' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("orderedList") && "bg-accent")}
          title='Numbered List'
        >
          <ListOrdered className='h-4 w-4' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("taskList") && "bg-accent")}
          title='Task List'
        >
          <CheckSquare className='h-4 w-4' />
        </Button>

        <div className='h-6 w-px bg-border mx-1' />

        {/* Text Formatting */}
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-accent")}
          title='Bold'
        >
          <Bold className='h-4 w-4' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("italic") && "bg-accent")}
          title='Italic'
        >
          <Italic className='h-4 w-4' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("strike") && "bg-accent")}
          title='Strikethrough'
        >
          <Strikethrough className='h-4 w-4' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("underline") && "bg-accent")}
          title='Underline'
        >
          <UnderlineIcon className='h-4 w-4' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("highlight") && "bg-accent")}
          title='Highlight'
        >
          <Highlighter className='h-4 w-4' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("code") && "bg-accent")}
          title='Inline Code'
        >
          <Code className='h-4 w-4' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("codeBlock") && "bg-accent")}
          title='Code Block'
        >
          <Code2 className='h-4 w-4' />
        </Button>

        <div className='h-6 w-px bg-border mx-1' />

        {/* Alignment */}
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: "left" }) && "bg-accent")}
          title='Align Left'
        >
          <AlignLeft className='h-4 w-4' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: "center" }) && "bg-accent")}
          title='Align Center'
        >
          <AlignCenter className='h-4 w-4' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: "right" }) && "bg-accent")}
          title='Align Right'
        >
          <AlignRight className='h-4 w-4' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: "justify" }) && "bg-accent")}
          title='Justify'
        >
          <AlignJustify className='h-4 w-4' />
        </Button>

        <div className='h-6 w-px bg-border mx-1' />

        {/* Superscript/Subscript */}
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("superscript") && "bg-accent")}
          title='Superscript'
        >
          <SuperscriptIcon className='h-4 w-4' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("subscript") && "bg-accent")}
          title='Subscript'
        >
          <SubscriptIcon className='h-4 w-4' />
        </Button>

        <div className='h-6 w-px bg-border mx-1' />

        {/* Blockquote */}
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn("h-8 w-8 p-0", editor.isActive("blockquote") && "bg-accent")}
          title='Blockquote'
        >
          <Quote className='h-4 w-4' />
        </Button>

        {/* Link */}
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={setLink}
          className={cn("h-8 w-8 p-0", editor.isActive("link") && "bg-accent")}
          title='Link'
        >
          <LinkIcon className='h-4 w-4' />
        </Button>

        {/* Image */}
        <Button type='button' variant='ghost' size='sm' onClick={addImage} className='h-8 w-8 p-0' title='Add Image'>
          <ImageIcon className='h-4 w-4' />
        </Button>

        <div className='flex-1' />

        {/* Clear Formatting */}
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className='h-8 px-2 text-xs'
          title='Clear Formatting'
        >
          Clear
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
