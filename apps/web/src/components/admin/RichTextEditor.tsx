'use client';

import React, { useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  RotateCcw,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (startTag: string, endTag: string = '') => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    const replacement = `${startTag}${selectedText || 'Text'}${endTag}`;
    const newValue = `${beforeText}${replacement}${afterText}`;
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + startTag.length,
        start + startTag.length + (selectedText.length || 4)
      );
    }, 0);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
        <button
          type="button"
          onClick={() => insertTag('<strong>', '</strong>')}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => insertTag('<em>', '</em>')}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => insertTag('<u>', '</u>')}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300"
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-600 mx-1" />

        <button
          type="button"
          onClick={() => insertTag('<h3>', '</h3>\n')}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-0.5"
          title="Heading 3"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => insertTag('<h4>', '</h4>\n')}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-0.5"
          title="Heading 4"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-600 mx-1" />

        <button
          type="button"
          onClick={() => insertTag('<ul>\n  <li>', '</li>\n  <li>Second item</li>\n</ul>\n')}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => insertTag('<ol>\n  <li>', '</li>\n  <li>Second step</li>\n</ol>\n')}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => insertTag('<blockquote>', '</blockquote>\n')}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300"
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => insertTag('<p>', '</p>\n')}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300 text-xs font-mono font-bold"
          title="Paragraph"
        >
          &lt;p&gt;
        </button>
      </div>

      {/* Editor Content Area */}
      <textarea
        ref={editorRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Enter rich job description HTML (e.g. <h3>About the Role</h3><p>...</p>)'}
        rows={12}
        className="w-full p-4 text-sm font-mono text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none resize-y placeholder-slate-400 dark:placeholder-slate-500"
      />

      {/* Live Preview Bar */}
      {value && (
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2">
            Live Preview:
          </span>
          <div
            className="prose prose-sm prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      )}
    </div>
  );
}
