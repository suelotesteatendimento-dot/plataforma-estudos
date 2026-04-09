import { prisma } from "@/lib/prisma";

/** Atualiza o streak do usuário. Idempotente: múltiplas chamadas no mesmo dia não alteram nada. */
export async function updateStreak(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

  const last = new Date(stats.lastActiveDate);
  last.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - last.getTime()) / 86_400_000);

  if (diffDays === 0) return;

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
