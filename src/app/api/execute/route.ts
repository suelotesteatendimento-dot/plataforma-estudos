import { NextRequest, NextResponse } from "next/server";
import vm from "vm";
import { exec } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// ─── JavaScript (vm sandbox) ──────────────────────────────────────────────────

function executeJS(code: string): { output: string; error: string; executionTime: number } {
  const logs: string[] = [];
  const sandbox = {
    console: {
      log: (...args: unknown[]) =>
        logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")),
      error: (...args: unknown[]) => logs.push("[stderr] " + args.map(String).join(" ")),
      warn: (...args: unknown[]) => logs.push("[warn] " + args.map(String).join(" ")),
      info: (...args: unknown[]) => logs.push("[info] " + args.map(String).join(" ")),
    },
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    // block dangerous globals
    process: undefined,
    require: undefined,
    global: undefined,
    Buffer: undefined,
    setTimeout: undefined,
    setInterval: undefined,
  };

  const start = Date.now();
  try {
    vm.runInNewContext(code, sandbox, { timeout: 5000 });
    return { output: logs.join("\n"), error: "", executionTime: Date.now() - start };
  } catch (e) {
    return { output: logs.join("\n"), error: String(e), executionTime: Date.now() - start };
  }
}

// ─── Python (child_process) ───────────────────────────────────────────────────

function executePython(code: string): Promise<{ output: string; error: string; executionTime: number }> {
  const tmpName = `exec_${Date.now()}_${Math.random().toString(36).slice(2)}.py`;
  const tmpFile = join(tmpdir(), tmpName);

  try {
    writeFileSync(tmpFile, code, "utf-8");
  } catch {
    return Promise.resolve({ output: "", error: "Erro ao criar arquivo temporário.", executionTime: 0 });
  }

  const pyCmd = process.platform === "win32" ? "python" : "python3";
  const start = Date.now();

  return new Promise((resolve) => {
    exec(`${pyCmd} "${tmpFile}"`, { timeout: 8000 }, (err, stdout, stderr) => {
      try { unlinkSync(tmpFile); } catch { /* ignore */ }

      if (err && (String(err).includes("ENOENT") || String(err).includes("não encontrado"))) {
        resolve({
          output: "",
          error: "Python não encontrado. Instale Python para executar código Python.",
          executionTime: Date.now() - start,
        });
        return;
      }

      // Remove o caminho do arquivo temporário das mensagens de erro do Python
      const cleanError = (stderr || (err && !stderr ? String(err.message) : "") || "")
        .split("\n")
        .filter((line) => !line.includes(tmpFile) && !line.includes(tmpName))
        .join("\n")
        .trim();

      resolve({
        output: stdout || "",
        error: cleanError,
        executionTime: Date.now() - start,
      });
    });
  });
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, language } = body as { code: string; language: string };

  if (!code?.trim()) {
    return NextResponse.json({ output: "", error: "Código vazio.", executionTime: 0 });
  }

  if (language === "javascript" || language === "js" || language === "typescript") {
    return NextResponse.json(executeJS(code));
  }

  if (language === "python") {
    return NextResponse.json(await executePython(code));
  }

  if (language === "java") {
    return NextResponse.json({
      output: "",
      error: "",
      info: "Execução de Java não está disponível neste ambiente. Você ainda pode enviar o código para correção com IA.",
      executionTime: 0,
    });
  }

  return NextResponse.json({
    output: "",
    error: `Linguagem "${language}" não suportada para execução direta.`,
    executionTime: 0,
  });
}
