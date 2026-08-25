"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

type IconName = "grid" | "shield" | "bolt" | "database" | "brain" | "search" | "settings" | "bell" | "arrow" | "chevron" | "download" | "filter";
const icons: Record<IconName, string> = {
  grid: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z", shield: "M12 3 4 6v5c0 5.2 3.4 8.6 8 10 4.6-1.4 8-4.8 8-10V6l-8-3Zm-3.3 9.1 2.1 2.1 4.6-4.6", bolt: "m13 2-9 12h7l-1 8 9-12h-7l1-8Z", database: "M20 6c0 1.7-3.6 3-8 3S4 7.7 4 6s3.6-3 8-3 8 1.3 8 3Zm0 0v6c0 1.7-3.6 3-8 3s-8-1.3-8-3V6m16 6v6c0 1.7-3.6 3-8 3s-8-1.3-8-3v-6", brain: "M9.5 4.5A3.5 3.5 0 0 0 6 8v.3A3.5 3.5 0 0 0 4 14.6 3.5 3.5 0 0 0 8 20h1m1-15.5A3.5 3.5 0 0 1 13.5 8v.3A3.5 3.5 0 0 1 16 14.6 3.5 3.5 0 0 1 12 20h-1m1-16v16M6 10h3m6 0h3m-7 4h2", search: "m21 21-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z", settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v2m0 13v2m8.5-8.5h-2m-13 0h-2m14.5-6-1.4 1.4m-9.2 9.2L5.8 18m12.2 0-1.4-1.4M8.8 7.4 7.4 6", bell: "M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4", arrow: "M5 12h14m-6-6 6 6-6 6", chevron: "m9 18 6-6-6-6", download: "M12 3v12m0 0 4-4m-4 4-4-4M4 20h16", filter: "M4 6h16M7 12h10m-7 6h4",
};
function Icon({ name, size = 18 }: { name: IconName; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>; }

const nav = [
  ["Overview", "grid"], ["Attack Library", "shield"], ["Red Team Simulator", "bolt"], ["Generated Data", "database"], ["Detection Lab", "brain"],
] as const;
const attacks = ["Deepfake Executive Voice Authorization", "Synthetic Identity Factory", "Adaptive AI Phishing", "Deepfake KYC Liveness Bypass", "RL Transaction Evasion", "AI Money Mule Network"];
const trend = [{d:"Mon", v:26, f:5}, {d:"Tue", v:32,f:6}, {d:"Wed", v:25,f:4}, {d:"Thu", v:47,f:11}, {d:"Fri",v:42,f:9}, {d:"Sat",v:62,f:18}, {d:"Sun",v:57,f:13}];
const detection = [{d:"00", v:90},{d:"04",v:87},{d:"08",v:93},{d:"12",v:95},{d:"16",v:94},{d:"20",v:97}];
const alerts = [
  {title:"Possible deepfake authorization", meta:"$48,500 • RTGS • 2 min ago", score:"94", tone:"purple"},
  {title:"Mule network velocity anomaly", meta:"12 linked accounts • UPI • 8 min ago", score:"89", tone:"orange"},
  {title:"KYC liveness confidence mismatch", meta:"New card application • 14 min ago", score:"86", tone:"blue"},
  {title:"Adaptive phishing transfer", meta:"$3,200 • Wallet • 21 min ago", score:"82", tone:"pink"},
];
const transactions = [
  ["TXN-8F92A1", "K. Sharma", "₹48,500", "RTGS", "Deepfake Voice", "94"], ["TXN-7C14DE", "A. Mehta", "₹12,800", "UPI", "Mule Network", "89"], ["TXN-2B9F03", "P. Iyer", "₹3,200", "Wallet", "AI Phishing", "82"], ["TXN-4E81C7", "R. Singh", "₹92,000", "Cards", "Synthetic ID", "78"],
];

export default function Home() {
  const [active, setActive] = useState("Overview"); const router = useRouter();
  const [range, setRange] = useState("7 Days");
  const [showAll, setShowAll] = useState(false);
  const title = active === "Overview" ? "Security Overview" : active;
  const displayed = useMemo(() => showAll ? [...alerts, {title:"Unusual device fingerprint", meta:"₹16,000 • Cards • 36 min ago", score:"71", tone:"green"}] : alerts, [showAll]);
  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><span></span><span></span><span></span></div><span>agentshield</span></div>
      <div className="workspace"><span>WORKSPACE</span><button>Mastercard India <Icon name="chevron" size={14}/></button></div>
      <nav>{nav.map(([label, icon]) => <button key={label} onClick={() => { setActive(label); if (label === "Attack Library") router.push("/attack-library"); if (label === "Red Team Simulator") router.push("/simulator"); }} className={`nav-item ${active === label ? "active" : ""}`}><Icon name={icon}/><span>{label}</span>{label === "Red Team Simulator" && <i>NEW</i>}</button>)}</nav>
      <div className="nav-divider" />
      <button className={`nav-item ${active === "Investigation Center" ? "active" : ""}`} onClick={() => setActive("Investigation Center")}><Icon name="search"/><span>Investigation Center</span><b>12</b></button>
      <div className="sidebar-bottom"><button className="nav-item"><Icon name="settings"/><span>Settings</span></button><div className="analyst"><div className="avatar">AM</div><div><strong>Ananya Mehra</strong><span>Security Analyst</span></div><Icon name="chevron" size={14}/></div></div>
    </aside>
    <section className="content">
      <header className="topbar"><div className="crumb"><span>AgentShield</span><i>/</i><strong>{title}</strong></div><div className="top-actions"><div className="live"><em></em> All systems operational</div><button className="icon-btn"><Icon name="bell"/><small>3</small></button><div className="top-avatar">AM</div></div></header>
      <div className="page-head"><div><p className="eyebrow">SECURITY OPERATIONS CENTER</p><h1>{title}</h1><p className="subtitle">Real-time intelligence across your payment ecosystem</p></div><div className="head-actions"><button className="date-select" onClick={() => setRange(range === "7 Days" ? "30 Days" : "7 Days")}>{range}<Icon name="chevron" size={14}/></button><button className="primary"><Icon name="bolt" size={16}/> Launch Simulation</button></div></div>
      <div className="kpis"><Kpi label="Attack vectors identified" value="38" detail="6 added this month" icon="shield" tone="purple"/><Kpi label="Synthetic transactions" value="2.4M" detail="↑ 18.2% vs. last period" icon="database" tone="blue"/><Kpi label="Detection accuracy" value="96.8%" detail="↑ 2.4% vs. last period" icon="brain" tone="green"/><Kpi label="False positive rate" value="1.2%" detail="↓ 0.4% vs. last period" icon="filter" tone="orange"/></div>
      <div className="grid-main"><section className="panel chart-panel"><div className="panel-head"><div><h2>Fraud Activity</h2><p>Detected threats across payment rails</p></div><div className="legend"><span><i className="l1"></i>Transactions</span><span><i className="l2"></i>Fraud alerts</span></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{top:10,right:8,left:-22,bottom:0}}><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8174ff" stopOpacity=".34"/><stop offset="1" stopColor="#8174ff" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#253047" strokeDasharray="3 3"/><XAxis dataKey="d" axisLine={false} tickLine={false} tick={{fill:"#76839b",fontSize:11}} dy={8}/><YAxis axisLine={false} tickLine={false} tick={{fill:"#76839b",fontSize:11}}/><Tooltip contentStyle={{background:"#121a2b",border:"1px solid #2b3852",borderRadius:"10px"}}/><Area type="monotone" dataKey="v" stroke="#8b80ff" fill="url(#area)" strokeWidth={2}/><Line type="monotone" dataKey="f" stroke="#ed5fc6" strokeWidth={2} dot={{r:3,fill:"#ed5fc6"}}/></AreaChart></ResponsiveContainer></div></section>
        <section className="panel alerts"><div className="panel-head"><div><h2>Recent fraud alerts <span className="count">12</span></h2><p>Requiring analyst attention</p></div><button className="text-btn" onClick={() => setShowAll(!showAll)}>{showAll ? "Show less" : "View all"}<Icon name="arrow" size={14}/></button></div><div className="alert-list">{displayed.map((a,i)=><div className="alert" key={a.title}><div className={`alert-icon ${a.tone}`}><Icon name="shield" size={17}/></div><div><strong>{a.title}</strong><span>{a.meta}</span></div><div className="risk"><b>{a.score}</b><span>RISK</span></div></div>)}</div></section>
      </div>
      <div className="bottom-grid"><section className="panel rail"><div className="panel-head"><div><h2>Threats by payment rail</h2><p>Last 7 days</p></div><button className="dots">•••</button></div><div className="rail-body"><div className="donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{name:"UPI",value:39},{name:"Cards",value:28},{name:"Wallet",value:19},{name:"RTGS",value:14}]} dataKey="value" innerRadius={48} outerRadius={66} paddingAngle={4} strokeWidth={0}>{["#8980ff", "#35c6f4", "#f5ab4d", "#eb65c9"].map((c,i)=><Cell key={c} fill={c}/>)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="donut-label"><strong>184</strong><span>Threats</span></div></div><div className="rail-legend"><p><i style={{background:"#8980ff"}}/>UPI <b>72</b><span>39%</span></p><p><i style={{background:"#35c6f4"}}/>Cards <b>51</b><span>28%</span></p><p><i style={{background:"#f5ab4d"}}/>Wallet <b>35</b><span>19%</span></p><p><i style={{background:"#eb65c9"}}/>RTGS <b>26</b><span>14%</span></p></div></div></section>
        <section className="panel model"><div className="panel-head"><div><h2>Model performance</h2><p>Blue Team detection model v3.4</p></div><span className="model-live"><i></i> LIVE</span></div><div className="model-body"><div className="score-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="49"/><circle className="progress" cx="60" cy="60" r="49"/></svg><div><strong>96.8%</strong><span>F1 score</span></div></div><div className="metrics"><p><span>Precision</span><b>97.1%</b></p><p><span>Recall</span><b>96.5%</b></p><p><span>AUC-ROC</span><b>99.2%</b></p></div><div className="mini-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={detection}><Line type="monotone" dataKey="v" stroke="#4ee3a0" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div></div></section>
        <section className="panel transactions"><div className="panel-head"><div><h2>Flagged transactions</h2><p>Highest-risk transactions in the last 24 hours</p></div><button className="text-btn"><Icon name="download" size={14}/> Export</button></div><div className="table-wrap"><table><thead><tr><th>TRANSACTION</th><th>ACCOUNT</th><th>AMOUNT</th><th>RAIL</th><th>ATTACK VECTOR</th><th>RISK</th></tr></thead><tbody>{transactions.map(t=><tr key={t[0]}><td className="mono">{t[0]}</td><td>{t[1]}</td><td>{t[2]}</td><td><span className="rail-badge">{t[3]}</span></td><td>{t[4]}</td><td><span className="risk-badge">{t[5]} <i></i></span></td></tr>)}</tbody></table></div></section>
      </div>
      <footer><span>Last updated just now</span><span>Data refreshes every 60 seconds</span><span>AgentShield v1.0.0</span></footer>
    </section>
  </main>;
}

function Kpi({label,value,detail,icon,tone}:{label:string;value:string;detail:string;icon:IconName;tone:string}) {return <section className="kpi panel"><div className={`kpi-icon ${tone}`}><Icon name={icon}/></div><div><p>{label}</p><h2>{value}</h2><span className={detail.includes("↓")?"down":"up"}>{detail}</span></div><button className="dots">•••</button></section>}
