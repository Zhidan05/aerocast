"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { formatNumber } from '@/lib/format';

interface CurrencyContextType {
  rate: number | null;
  lastUpdated: string | null;
  source: string | null;
  isLoading: boolean;
  formatIDR: (inr: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  rate: null,
  lastUpdated: null,
  source: null,
  isLoading: true,
  formatIDR: () => '',
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [rate, setRate] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCurrency() {
      try {
        const res = await fetch('/api/currency');
        if (res.ok) {
          const data = await res.json();
          if (data.rate) {
            setRate(data.rate);
            setLastUpdated(data.lastUpdated);
            setSource(data.source);
          }
        }
      } catch (e) {
        console.error("Failed to fetch currency:", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCurrency();
  }, []);

  const formatIDR = (inr: number) => {
    if (!rate) return '';
    const idr = inr * rate;
    // Format to Indonesian Rupiah style (e.g., Rp930.000)
    // We can use Intl.NumberFormat
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(idr);
  };

  return (
    <CurrencyContext.Provider value={{ rate, lastUpdated, source, isLoading, formatIDR }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
