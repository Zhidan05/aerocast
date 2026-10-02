"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BookOpen, Database, Dices, FlaskConical, LayoutDashboard, Target, ArrowUpRight, X } from "lucide-react";

const navigation = [
  { href: "/", label: "Dasbor", icon: LayoutDashboard },
  { href: "/dataset", label: "Dataset", icon: Database },
  { href: "/monte-carlo", label: "Monte Carlo", icon: Dices },
  { href: "/experiments", label: "Eksperimen", icon: FlaskConical },
  { href: "/accuracy", label: "Akurasi", icon: Target },
  { href: "/about", label: "Tentang Metode", icon: BookOpen },
];

export function AppSidebar({ onNavigate, mobile = false }: { onNavigate?: () => void; mobile?: boolean }) {
  const pathname = usePathname();
  return <aside className={`app-sidebar ${mobile ? "mobile-sidebar" : "desktop-sidebar"}`} aria-label="Navigasi utama">
    {mobile && <div className="flex items-center justify-between pb-7"><Link href="/" onClick={onNavigate} className="brand"><Image src="/images/aerocast/logo.svg" alt="" width={34} height={34} /><strong>AeroCast</strong></Link><button className="icon-button" onClick={onNavigate} aria-label="Tutup navigasi"><X size={20} /></button></div>}
    <p className="nav-caption">SET ANALITIK</p>
    <nav className="flex flex-col gap-1.5">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={onNavigate} title={label} aria-current={pathname === href ? "page" : undefined} className={`nav-link ${pathname === href ? "active" : ""}`}><Icon size={19} aria-hidden="true" /><span>{label}</span>{pathname === href && <span className="nav-dot" />}</Link>)}</nav>
    <div className="sidebar-bottom"><div className="sidebar-note"><div className="mb-3 flex items-center gap-2 text-blue-600"><Dices size={18} /><span className="text-xs font-semibold">Pahami metode</span></div><p>Dari observasi historis hingga distribusi kemungkinan.</p><Link href="/about" onClick={onNavigate}>Pelajari Monte Carlo <ArrowUpRight size={14} /></Link></div><div className="mt-5 flex items-center gap-2 text-[11px] text-slate-500"><span className="status-dot" />Ruang kerja demo lokal</div></div>
  </aside>;
}
