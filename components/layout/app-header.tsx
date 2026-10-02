import Image from "next/image";
import Link from "next/link";
import { CircleHelp, Menu, FlaskConical } from "lucide-react";

export function AppHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  return <header className="app-header">
    <div className="flex min-w-0 items-center gap-4">
      <button className="icon-button menu-toggle" onClick={onOpenMenu} aria-label="Open navigation" aria-haspopup="dialog"><Menu size={21} /></button>
      <Link href="/" className="brand"><Image src="/images/aerocast/logo.svg" alt="" width={35} height={35} priority /><span><strong>AeroCast</strong><small>Monte Carlo Fare Forecasting</small></span></Link>
      <span className="header-divider" />
      <span className="dataset-pill"><span className="status-dot" /><span>Dataset: <b>300,153</b> records</span></span>
    </div>
    <div className="flex items-center gap-3"><span className="demo-pill"><FlaskConical size={14} /><span>Demo workspace</span></span><Link className="icon-button" href="/about" aria-label="About the Monte Carlo method"><CircleHelp size={20} /></Link><div className="workspace-avatar" aria-label="AeroCast analytics workspace">AC</div></div>
  </header>;
}
