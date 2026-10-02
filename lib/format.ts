const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
export const formatNumber = (value: number) => numberFormatter.format(Math.round(value));
export const formatPrice = (value: number) => `₹${formatNumber(value)}`;

export function downloadFile(filename: string, content: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
