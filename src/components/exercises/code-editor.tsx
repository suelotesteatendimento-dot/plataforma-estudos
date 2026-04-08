"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  language: string;
  readOnly?: boolean;
}

export function CodeEditor({ value, onChange, language, readOnly = false }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (readOnly) return;

    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  }

  return (
    <div className="relative rounded-lg border overflow-hidden bg-zinc-950">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs text-zinc-400 font-mono">{language}</span>
      </div>

      {/* Line numbers + code */}
      <div className="flex overflow-auto" style={{ maxHeight: "400px" }}>
        {/* Line numbers */}
        <div
          className="select-none py-4 pl-4 pr-3 text-right text-zinc-600 text-sm font-mono leading-6 bg-zinc-950 border-r border-zinc-800 shrink-0"
          aria-hidden
        >
          {value.split("\n").map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          className={cn(
            "code-editor flex-1 resize-none bg-transparent text-zinc-100 py-4 pl-4 pr-4 text-sm leading-6 outline-none w-full",
            readOnly && "cursor-default opacity-70"
          )}
          style={{ minHeight: "200px" }}
        />
      </div>
    </div>
  );
}
