"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const drawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (media.matches) drawer.current?.close(); };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);
  return <>
    <a className="skip-link" href="#main-content">Lewati ke konten</a>
    <AppHeader onOpenMenu={() => drawer.current?.showModal()} />
    <AppSidebar />
    <dialog ref={drawer} className="navigation-drawer" aria-label="Navigasi" onClick={event => { if (event.target === event.currentTarget) drawer.current?.close(); }}>
      <AppSidebar mobile onNavigate={() => drawer.current?.close()} />
    </dialog>
    <main className="app-main" id="main-content"><div className="content-container">{children}</div><footer className="app-footer"><span>AeroCast <span aria-hidden="true">·</span> Prediksi Harga Monte Carlo</span><span>Data ilustrasi · Harga dalam INR (₹)</span></footer></main>
  </>;
}
