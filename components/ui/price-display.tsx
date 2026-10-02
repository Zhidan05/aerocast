"use client";

import { useCurrency } from '@/components/currency-provider';
import { formatPrice } from '@/lib/format';

export function PriceDisplay({ 
  amount, 
  className = "",
  inline = false,
  showInfo = false
}: { 
  amount: number | null | undefined; 
  className?: string;
  inline?: boolean;
  showInfo?: boolean;
}) {
  const { rate, formatIDR, lastUpdated } = useCurrency();

  if (amount === null || amount === undefined || isNaN(amount)) {
    return <span className={className}>-</span>;
  }

  const inrStr = formatPrice(amount);
  
  if (!rate) {
    return <span className={className}>{inrStr}</span>;
  }

  const idrStr = `≈ ${formatIDR(amount)}`;

  if (inline) {
    return (
      <span className={className}>
        {inrStr} <span className="text-[0.8em] text-slate-500 font-normal ml-1">({idrStr})</span>
      </span>
    );
  }

  const content = (
    <div className={`flex flex-col ${className}`}>
      <span>{inrStr}</span>
      <span className="text-[0.8em] text-slate-500 font-normal mt-0.5 leading-none">{idrStr}</span>
    </div>
  );

  if (showInfo && lastUpdated) {
    return (
      <div 
        className="cursor-help" 
        title={`Konversi perkiraan berdasarkan kurs terakhir diperbarui: ${new Date(lastUpdated).toLocaleString('id-ID')}`}
      >
        {content}
      </div>
    );
  }

  return content;
}
