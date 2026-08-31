"use client";
import Link from "next/link";
import { useState } from "react";
import type { Attack } from "@/types/attack";
import { categoryLabel } from "@/data/category-labels";
import { Badge } from "./AttackCard";

export function AttackTable({ attacks }: { attacks: Attack[] }) { const [sort, setSort] = useState<"name"|"severity"|"simulationStatus"|"evidenceStatus">("severity"); const ordered = [...attacks].sort((a,b) => String(a[sort]).localeCompare(String(b[sort]))); const head=(label:string,key:typeof sort)=><button onClick={()=>setSort(key)}>{label}{sort===key?" ↓":""}</button>;
 return <div className="attack-table-wrap"><table className="attack-table"><thead><tr><th>{head("ID","name")}</th><th>{head("Attack","name")}</th><th>Category</th><th>Payment rail</th><th>{head("Impact","severity")}</th><th>AI capability</th><th>{head("Evidence","evidenceStatus")}</th><th>{head("Simulation","simulationStatus")}</th><th>Defense</th></tr></thead><tbody>{ordered.map(attack=><tr key={attack.id}><td className="attack-id">{attack.id}</td><td><Link href={`/attack-library/${attack.id}`}>{attack.name}</Link></td><td>{categoryLabel[attack.category]}</td><td>{attack.paymentRails.join(" · ")}</td><td><Badge value={attack.severity} kind="severity"/></td><td>{attack.aiCapabilities.slice(0,2).join(" + ")}</td><td><Badge value={attack.evidenceStatus} kind="evidence"/></td><td><Badge value={attack.simulationStatus} kind="simulation"/></td><td>{attack.defenseStrategy[0]}</td></tr>)}</tbody></table></div>;
}