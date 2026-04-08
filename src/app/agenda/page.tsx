export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { AgendaClient } from "./agenda-client";

async function getPlans() {
  return prisma.studyPlan.findMany({ orderBy: { studyDate: "asc" } });
}

export default async function AgendaPage() {
  const plans = await getPlans();
  return <AgendaClient initialPlans={plans} />;
}
