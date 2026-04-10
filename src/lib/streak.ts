import { prisma } from "@/lib/prisma";

/** Normaliza uma data para meia-noite UTC, evitando drift de fuso horário. */
function toUTCMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Atualiza o streak do usuário.
 * Idempotente: múltiplas chamadas no mesmo dia (UTC) não alteram nada.
 * Dias consecutivos incrementam; gap > 1 dia reinicia para 1.
 */
export async function updateStreak(userId: string) {
  const today = toUTCMidnight(new Date());

  let stats = await prisma.userStats.findUnique({ where: { userId } });

  if (!stats) {
    await prisma.userStats.create({
      data: { userId, currentStreak: 1, bestStreak: 1, lastActiveDate: today },
    });
    return;
  }

  if (!stats.lastActiveDate) {
    await prisma.userStats.update({
      where: { id: stats.id },
      data: { currentStreak: 1, bestStreak: Math.max(stats.bestStreak, 1), lastActiveDate: today },
    });
    return;
  }

  const last = toUTCMidnight(new Date(stats.lastActiveDate));
  const diffDays = Math.round((today.getTime() - last.getTime()) / 86_400_000);

  // Mesmo dia — idempotente, não altera nada
  if (diffDays === 0) return;

  // Dia seguinte → continua sequência; qualquer gap maior → reinicia
  const newStreak = diffDays === 1 ? stats.currentStreak + 1 : 1;
  await prisma.userStats.update({
    where: { id: stats.id },
    data: {
      currentStreak: newStreak,
      bestStreak: Math.max(stats.bestStreak, newStreak),
      lastActiveDate: today,
    },
  });
}
