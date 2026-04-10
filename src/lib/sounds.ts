/**
 * Sistema central de sons da interface.
 * Usa Web Audio API — nenhum arquivo de áudio necessário.
 * Preferência salva em localStorage com chave "sounds_enabled".
 */

export type SoundType =
  | "success"   // exercício aprovado
  | "partial"   // exercício parcial
  | "error"     // erro / reprovado
  | "finish"    // prova finalizada
  | "streak"    // streak acendendo
  | "flip";     // virar flashcard

const STORAGE_KEY = "sounds_enabled";

// ── Preferência ──────────────────────────────────────────────────

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const val = localStorage.getItem(STORAGE_KEY);
  return val === null ? true : val === "true"; // padrão: ativado
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

// ── AudioContext singleton ────────────────────────────────────────

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!_ctx || _ctx.state === "closed") {
      _ctx = new (
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext!
      )();
    }
    if (_ctx.state === "suspended") _ctx.resume();
    return _ctx;
  } catch {
    return null;
  }
}

// ── Primitivos ────────────────────────────────────────────────────

function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  dur: number,
  vol = 0.16,
  type: OscillatorType = "sine"
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

// ── Sons ─────────────────────────────────────────────────────────

export function playSound(type: SoundType): void {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;

  switch (type) {
    case "success": {
      // Arpejo ascendente C5 → E5 → G5
      tone(ctx, 523, t,        0.18, 0.14);
      tone(ctx, 659, t + 0.10, 0.18, 0.15);
      tone(ctx, 784, t + 0.20, 0.30, 0.18);
      break;
    }
    case "partial": {
      // Dois tons neutros C5 → D5
      tone(ctx, 523, t,        0.14, 0.12);
      tone(ctx, 587, t + 0.14, 0.22, 0.12);
      break;
    }
    case "error": {
      // Descida suave com leve aspereza
      tone(ctx, 320, t,        0.10, 0.13, "sawtooth");
      tone(ctx, 240, t + 0.12, 0.18, 0.10, "sawtooth");
      break;
    }
    case "finish": {
      // Fanfarra ascendente C4 → E4 → G4 → C5
      tone(ctx, 262, t,        0.16, 0.13);
      tone(ctx, 330, t + 0.14, 0.16, 0.14);
      tone(ctx, 392, t + 0.28, 0.16, 0.15);
      tone(ctx, 523, t + 0.42, 0.50, 0.20);
      break;
    }
    case "streak": {
      // Brilho rápido G4 → B4 → D5
      tone(ctx, 392, t,        0.12, 0.14);
      tone(ctx, 494, t + 0.10, 0.12, 0.15);
      tone(ctx, 587, t + 0.20, 0.30, 0.17);
      break;
    }
    case "flip": {
      // Whoosh suave
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(700, t);
      osc.frequency.exponentialRampToValueAtTime(1300, t + 0.07);
      osc.frequency.exponentialRampToValueAtTime(550, t + 0.14);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.10, t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.22);
      break;
    }
  }
}
