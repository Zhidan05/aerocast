import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "AeroCast | Flight Fare Analytics", template: "%s | AeroCast" },
  description: "Explore historical airline fares and understand Monte Carlo price distributions with AeroCast.",
  icons: { icon: "/images/aerocast/logo.svg" },
};

import { CurrencyProvider } from "@/components/currency-provider";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="antialiased">
      <body>
        <CurrencyProvider>
          <DashboardShell>{children}</DashboardShell>
        </CurrencyProvider>
      </body>
    </html>
  );
}
