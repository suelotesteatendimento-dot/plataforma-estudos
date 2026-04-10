export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AgendaClient } from "./agenda-client";

export default async function AgendaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const plans = await prisma.studyPlan.findMany({
    where: { userId: user.id },
    orderBy: { studyDate: "asc" },
  });

  return <AgendaClient initialPlans={plans} />;
}
