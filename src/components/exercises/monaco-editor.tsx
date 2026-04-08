"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center bg-zinc-950 rounded-b-lg"
      style={{ height: 350 }}
    >
      <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
    </div>
  ),
});

const LANG_MAP: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  cpp: "cpp",
  rust: "rust",
  go: "go",
  sql: "sql",
  html: "html",
  css: "css",
};

const STARTERS: Record<string, string> = {
  javascript: "// Escreva sua solução aqui\nfunction solution() {\n  \n}\n",
  typescript: "// Escreva sua solução aqui\nfunction solution(): void {\n  \n}\n",
  python: "# Escreva sua solução aqui\ndef solution():\n    pass\n",
  java: "public class Solution {\n    public static void main(String[] args) {\n        // Escreva sua solução aqui\n    }\n}\n",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Escreva sua solução aqui\n    return 0;\n}\n",
  rust: "fn main() {\n    // Escreva sua solução aqui\n}\n",
  go: "package main\n\nfunc main() {\n    // Escreva sua solução aqui\n}\n",
};

export function getStarterCode(language: string): string {
  return STARTERS[language] ?? `// Escreva sua solução aqui\n`;
}

interface Props {
  value: string;
  onChange?: (v: string) => void;
  language: string;
  readOnly?: boolean;
  height?: number;
}

export function MonacoEditor({
  value,
  onChange,
  language,
  readOnly = false,
  height = 350,
}: Props) {
  return (
    <div className="rounded-lg overflow-hidden border border-zinc-800">
      {/* Fake title bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <span className="text-xs text-zinc-400 font-mono">{language}</span>
      </div>

      <Editor
        height={height}
        language={LANG_MAP[language] ?? "plaintext"}
        value={value}
        onChange={(v) => onChange?.(v ?? "")}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: "line",
          cursorBlinking: "smooth",
        }}
      />
    </div>
  );
}
