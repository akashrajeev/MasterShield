import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AttackDetailClient } from "@/components/attack-library/AttackDetailClient";
import { getBackendAttack, adaptBackendAttack } from "@/lib/api/attacks";

export const dynamic = "force-dynamic";

export default async function AttackDetailPage({ params }: { params: Promise<{ attackId: string }> }) {
  const { attackId } = await params;
  try {
    const attack = adaptBackendAttack(await getBackendAttack(attackId));
    return <AppShell title="Attack Intelligence"><AttackDetailClient attack={attack} /></AppShell>;
  } catch { notFound(); }
}
