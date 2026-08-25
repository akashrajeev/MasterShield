import { notFound } from "next/navigation";
import { attacks } from "@/data/attacks";
import { AppShell } from "@/components/layout/AppShell";
import { AttackDetailClient } from "@/components/attack-library/AttackDetailClient";

export function generateStaticParams() { return attacks.map(attack => ({ attackId: attack.id })); }
export default async function AttackDetailPage({ params }: { params: Promise<{ attackId: string }> }) { const { attackId } = await params; const attack = attacks.find(item => item.id.toLowerCase() === attackId.toLowerCase()); if (!attack) notFound(); return <AppShell title="Attack Intelligence"><AttackDetailClient attack={attack}/></AppShell>; }
