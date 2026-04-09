import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const GROQ_MODEL = "llama-3.3-70b-versatile";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExerciseType = "theory" | "multiple_choice" | "programming";
export type Difficulty = "easy" | "medium" | "hard";

export interface GeneratedExercise {
  title: string;
  difficulty: Difficulty;
  type: ExerciseType;
  question: string;
  options: string[];
  correctAnswer: string;
  expectedAnswer: string;
  points: number;
  // campos de programação
  inputExample?: string;
  outputExample?: string;
  testCases?: string[];
  explanation?: string;
}

export interface ReviewResult {
  score: number;
  summary: string;
  understanding: string;
  logic: string;
  syntax: string;
  improvements: string;
  finalVerdict: string;
}

export interface GenerateParams {
  subject: string;
  topic: string;
  difficulty: Difficulty;
  type: ExerciseType;
  language?: string;
  quantity: number;
}

export interface ReviewParams {
  type: ExerciseType;
  question: string;
  expectedAnswer?: string | null;
  userAnswer: string;
  language?: string | null;
  inputExample?: string | null;
  outputExample?: string | null;
  testCases?: string | null;  // JSON string
  explanation?: string | null;
}

// ─── JSON extraction ──────────────────────────────────────────────────────────
// Encontra o primeiro objeto/array JSON balanceado, ignorando texto ao redor.

function extractJSON(raw: string): unknown {
  // Remove markdown code fences: ```json ... ``` ou ``` ... ```
  let s = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Encontra o primeiro { ou [
  const fi = s.indexOf("{");
  const ai = s.indexOf("[");
  if (fi === -1 && ai === -1) {
    console.error("[groq] Nenhuma estrutura JSON encontrada na resposta");
    return null;
  }

  const start =
    fi === -1 ? ai : ai === -1 ? fi : Math.min(fi, ai);
  const opener = s[start] as "{" | "[";
  const closer = opener === "{" ? "}" : "]";

  // Percorre caractere a caractere rastreando profundidade
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === opener) depth++;
    else if (ch === closer) {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(s.slice(start, i + 1));
        } catch (e) {
          console.error("[groq] JSON malformado mesmo balanceado:", String(e));
          break;
        }
      }
    }
  }

  // Fallback: tenta aparar do último } ou ]
  const sub = s.slice(start);
  const last = Math.max(sub.lastIndexOf("}"), sub.lastIndexOf("]"));
  if (last > 0) {
    try {
      return JSON.parse(sub.slice(0, last + 1));
    } catch {
      console.error("[groq] Fallback de parse também falhou");
    }
  }

  return null;
}

// ─── Normalização de dificuldade ──────────────────────────────────────────────

const DIFF_MAP: Record<string, Difficulty> = {
  easy: "easy",   fácil: "easy",   facil: "easy",   baixa: "easy",
  medium: "medium", médio: "medium", medio: "medium", media: "medium",
  hard: "hard",   difícil: "hard", dificil: "hard", alta: "hard",
};

function normDiff(v: unknown, fallback: Difficulty): Difficulty {
  if (typeof v !== "string") return fallback;
  return DIFF_MAP[v.toLowerCase().trim()] ?? fallback;
}

// ─── Normalização de exercício ────────────────────────────────────────────────

const PTS: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 40 };

function strOrEmpty(v: unknown): string {
  if (!v || v === "null" || v === "undefined") return "";
  return String(v).trim();
}

function toStrArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const arr = (v as unknown[]).filter((x) => typeof x === "string") as string[];
  return arr.length ? arr : undefined;
}

function normalizeExercise(
  raw: Record<string, unknown>,
  params: GenerateParams
): GeneratedExercise {
  return {
    title:
      strOrEmpty(raw.title ?? raw.titulo) || params.topic,
    difficulty:
      normDiff(raw.difficulty ?? raw.dificuldade, params.difficulty),
    type:
      (raw.type as ExerciseType) ??
      (raw.tipo as ExerciseType) ??
      params.type,
    question:
      strOrEmpty(
        raw.question ?? raw.questao ?? raw.enunciado ?? raw.pergunta
      ),
    options: Array.isArray(raw.options)
      ? (raw.options as string[])
      : Array.isArray(raw.opcoes)
      ? (raw.opcoes as string[])
      : [],
    correctAnswer: strOrEmpty(
      raw.correctAnswer ?? raw.respostaCorreta ??
      raw.gabarito ?? raw.correct_answer
    ),
    expectedAnswer: strOrEmpty(
      raw.expectedAnswer ?? raw.respostaEsperada ??
      raw.solucao ?? raw.expected_answer ?? raw.answer
    ),
    points:
      typeof raw.points === "number" ? raw.points : PTS[params.difficulty],
    inputExample: strOrEmpty(raw.inputExample ?? raw.entradaExemplo ?? raw.input_example) || undefined,
    outputExample: strOrEmpty(raw.outputExample ?? raw.saidaExemplo ?? raw.output_example) || undefined,
    testCases: toStrArray(raw.testCases ?? raw.casosDeTeste ?? raw.test_cases),
    explanation: strOrEmpty(raw.explanation ?? raw.explicacao ?? raw.explanation_text) || undefined,
  };
}

// ─── Parse da resposta de geração ────────────────────────────────────────────

function parseExercisesResponse(
  raw: string,
  params: GenerateParams
): GeneratedExercise[] {
  console.log("[groq generate] resposta bruta:", raw.slice(0, 1000));

  const parsed = extractJSON(raw);
  if (!parsed || typeof parsed !== "object") {
    console.error("[groq generate] Não foi possível extrair JSON válido");
    return [];
  }

  // Encontra o array de exercícios — tenta várias chaves possíveis
  let items: unknown[] = [];

  if (Array.isArray(parsed)) {
    items = parsed;
  } else {
    const obj = parsed as Record<string, unknown>;
    for (const key of [
      "exercises", "exercise", "exercicios", "exercicio",
      "questions", "questoes", "items", "data",
    ]) {
      if (Array.isArray(obj[key])) {
        items = obj[key] as unknown[];
        break;
      }
    }
    // Se não encontrou array mas o objeto parece um exercício único
    if (!items.length && (obj.question || obj.questao || obj.title)) {
      items = [obj];
    }
  }

  if (!items.length) {
    console.error(
      "[groq generate] Nenhum exercício encontrado. JSON recebido:",
      JSON.stringify(parsed).slice(0, 400)
    );
    return [];
  }

  console.log(`[groq generate] ${items.length} item(ns) encontrado(s), normalizando...`);

  const result = items
    .filter((item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null
    )
    .filter((item) => {
      const q = item.question || item.questao || item.enunciado;
      if (!q) {
        console.warn(
          "[groq generate] Item sem campo 'question', ignorado:",
          JSON.stringify(item).slice(0, 120)
        );
      }
      return !!q;
    })
    .map((item) => normalizeExercise(item, params));

  console.log(`[groq generate] ${result.length} exercício(s) normalizados`);
  return result;
}

// ─── Generate exercises ───────────────────────────────────────────────────────

export async function generateExercises(
  params: GenerateParams
): Promise<GeneratedExercise[]> {
  const { subject, topic, difficulty, type, language, quantity } = params;

  const qty = Math.min(Math.max(1, quantity), 5);

  const typeLabel = {
    theory: "teórico (resposta dissertativa)",
    multiple_choice: "múltipla escolha com 4 opções (A, B, C, D), apenas 1 correta",
    programming: `programação em ${language ?? "JavaScript"}`,
  }[type];

  const diffLabel = { easy: "fácil", medium: "médio", hard: "difícil" }[difficulty];

  const optionsInstruction =
    type === "multiple_choice"
      ? `"options": ["A) texto", "B) texto", "C) texto", "D) texto"],\n      "correctAnswer": "A"`
      : `"options": [],\n      "correctAnswer": ""`;

  const programmingExtra =
    type === "programming"
      ? `,
      "inputExample": "exemplo de entrada para a função/programa",
      "outputExample": "saída esperada para o exemplo de entrada",
      "testCases": ["entrada: X -> saída: Y", "entrada: A -> saída: B"],
      "explanation": "descrição do que a solução deve fazer (comportamento esperado)"`
      : "";

  const prompt = `Gere exatamente ${qty} exercício(s) do tipo ${typeLabel} sobre o tema "${subject} - ${topic}", nível ${diffLabel}.

Retorne JSON com o seguinte formato (sem texto fora do JSON):
{
  "exercises": [
    {
      "title": "título curto e descritivo",
      "question": "enunciado completo e claro do exercício",
      ${optionsInstruction},
      "expectedAnswer": "resposta esperada ou solução de referência"${programmingExtra}
    }
  ]
}`;

  console.log("[groq generate] Enviando prompt para", GROQ_MODEL);

  const res = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content:
          "Você é um professor que cria exercícios educacionais. Responda SOMENTE com JSON válido, sem texto adicional, sem markdown.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  });

  const raw = res.choices[0]?.message?.content ?? "";
  return parseExercisesResponse(raw, params);
}

// ─── Review answer ────────────────────────────────────────────────────────────

export async function reviewExercise(
  params: ReviewParams
): Promise<ReviewResult> {
  const { type, question, expectedAnswer, userAnswer, language,
          inputExample, outputExample, testCases, explanation } = params;

  const answerBlock =
    type === "programming"
      ? `Código ${language ?? ""} do aluno:\n\`\`\`\n${userAnswer}\n\`\`\``
      : `Resposta do aluno:\n${userAnswer}`;

  const logicLabel =
    type === "programming" ? "lógica e algoritmo" : "raciocínio";
  const syntaxLabel =
    type === "programming" ? "sintaxe e boas práticas" : "clareza e estrutura";

  // Contexto extra para exercícios de programação
  const programmingContext =
    type === "programming"
      ? [
          inputExample  ? `Entrada de exemplo: ${inputExample}`   : "",
          outputExample ? `Saída esperada:     ${outputExample}`  : "",
          explanation   ? `Comportamento esperado: ${explanation}`: "",
          testCases     ? `Casos de teste: ${testCases}`          : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "";

  const prompt = `Avalie a resposta do aluno abaixo como professor. Seja objetivo e construtivo em português.

Questão: ${question}
${expectedAnswer ? `Gabarito/Solução de referência: ${expectedAnswer}` : ""}
${programmingContext}
${answerBlock}

Retorne JSON (sem texto fora do JSON):
{
  "score": <número de 0 a 100>,
  "summary": "<resumo da avaliação em 1 frase>",
  "understanding": "<avaliação da compreensão do conceito>",
  "logic": "<avaliação de ${logicLabel}>",
  "syntax": "<avaliação de ${syntaxLabel}>",
  "improvements": "<o que o aluno pode melhorar>",
  "finalVerdict": "<aprovado | parcial | reprovado>"
}`;

  console.log("[groq review] Enviando para avaliação...");

  const res = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content:
          "Você é um professor avaliador. Responda SOMENTE com JSON válido, sem texto adicional, sem markdown.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 700,
    response_format: { type: "json_object" },
  });

  const raw = res.choices[0]?.message?.content ?? "";
  console.log("[groq review] resposta bruta:", raw.slice(0, 600));

  const fallback: ReviewResult = {
    score: 0,
    summary: "Não foi possível avaliar a resposta.",
    understanding: "-",
    logic: "-",
    syntax: "-",
    improvements: "-",
    finalVerdict: "parcial",
  };

  const parsed = extractJSON(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    console.error("[groq review] Falha ao extrair JSON da avaliação");
    return fallback;
  }

  const obj = parsed as Record<string, unknown>;

  return {
    score:
      typeof obj.score === "number"
        ? Math.max(0, Math.min(100, obj.score))
        : 0,
    summary: strOrEmpty(obj.summary) || fallback.summary,
    understanding: strOrEmpty(obj.understanding) || "-",
    logic: strOrEmpty(obj.logic) || "-",
    syntax: strOrEmpty(obj.syntax) || "-",
    improvements: strOrEmpty(obj.improvements) || "-",
    finalVerdict:
      ["aprovado", "parcial", "reprovado"].includes(
        String(obj.finalVerdict ?? "").toLowerCase()
      )
        ? String(obj.finalVerdict).toLowerCase()
        : "parcial",
  };
}

// ─── Flashcards ───────────────────────────────────────────────────────────────

export interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardParams {
  subject: string;
  topic: string;
  difficulty: Difficulty;
  quantity: number;
  context?: string;
}

export async function generateFlashcards(params: FlashcardParams): Promise<Flashcard[]> {
  const { subject, topic, difficulty, quantity, context } = params;
  const diffLabel = { easy: "fácil", medium: "médio", hard: "difícil" }[difficulty];
  const qty = Math.min(Math.max(1, quantity), 20);

  const prompt = `Crie exatamente ${qty} flashcard(s) sobre "${subject} - ${topic}", nível ${diffLabel}.
${context ? `Contexto adicional: ${context}` : ""}

Cada flashcard deve ter uma pergunta objetiva na frente e uma resposta clara e didática no verso.
Retorne SOMENTE JSON válido:
{
  "flashcards": [
    { "front": "pergunta ou conceito", "back": "resposta ou explicação" }
  ]
}`;

  const res = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: "Você é um professor criando material de revisão. Responda SOMENTE com JSON válido." },
      { role: "user", content: prompt },
    ],
    temperature: 0.6,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  });

  const raw = res.choices[0]?.message?.content ?? "";
  const parsed = extractJSON(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];

  const obj = parsed as Record<string, unknown>;
  const items = Array.isArray(obj.flashcards) ? (obj.flashcards as unknown[]) : [];

  return items
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      front: strOrEmpty(item.front) || "—",
      back: strOrEmpty(item.back) || "—",
    }))
    .filter((fc) => fc.front !== "—" || fc.back !== "—");
}

// ─── Study Summary ────────────────────────────────────────────────────────────

export interface SummaryResult {
  title: string;
  introduction: string;
  mainContent: string[];
  importantTopics: string[];
  examples: string[];
  commonMistakes: string[];
  examTips: string[];
  finalReview: string[];
}

export interface SummaryParams {
  subject: string;
  topic: string;
  level: string;
  objective: string;
  context?: string;
}

export async function generateSummary(params: SummaryParams): Promise<SummaryResult | null> {
  const { subject, topic, level, objective, context } = params;

  const prompt = `Crie um resumo completo e didático sobre "${subject} - ${topic}" para um aluno de nível "${level}".
Objetivo do estudo: ${objective}.
${context ? `Contexto adicional: ${context}` : ""}

Retorne SOMENTE JSON válido:
{
  "title": "título do resumo",
  "introduction": "introdução em 2-3 frases",
  "mainContent": ["parágrafo 1", "parágrafo 2", "parágrafo 3"],
  "importantTopics": ["tópico importante 1", "tópico importante 2"],
  "examples": ["exemplo prático 1", "exemplo prático 2"],
  "commonMistakes": ["erro comum 1", "erro comum 2"],
  "examTips": ["dica para prova 1", "dica para prova 2"],
  "finalReview": ["ponto de revisão 1", "ponto de revisão 2"]
}`;

  const res = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: "Você é um professor especialista criando material de estudo. Responda SOMENTE com JSON válido." },
      { role: "user", content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 3000,
    response_format: { type: "json_object" },
  });

  const raw = res.choices[0]?.message?.content ?? "";
  const parsed = extractJSON(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

  const obj = parsed as Record<string, unknown>;
  const toArr = (v: unknown): string[] =>
    Array.isArray(v) ? (v as unknown[]).map((x) => strOrEmpty(x)).filter(Boolean) : [];

  return {
    title: strOrEmpty(obj.title) || `${subject} — ${topic}`,
    introduction: strOrEmpty(obj.introduction) || "",
    mainContent: toArr(obj.mainContent),
    importantTopics: toArr(obj.importantTopics),
    examples: toArr(obj.examples),
    commonMistakes: toArr(obj.commonMistakes),
    examTips: toArr(obj.examTips),
    finalReview: toArr(obj.finalReview),
  };
}

export default groq;
