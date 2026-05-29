"use client";

import { useState, useCallback } from "react";

type DocType = "invoice" | "credit_note" | "support_document" | "adjustment_note";

interface DownloadPdfButtonProps {
  type: DocType;
  number: string;
  disabled?: boolean;
}

export function DownloadPdfButton({
  type,
  number,
  disabled,
}: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    if (loading || disabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/download-pdf?type=${encodeURIComponent(type)}&number=${encodeURIComponent(number)}`,
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(err.error ?? `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${number}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [type, number, loading, disabled]);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading || disabled}
        title="Descargar PDF"
        className={`inline-flex items-center justify-center rounded p-1 transition-colors
          ${
            loading
              ? "text-zinc-300 cursor-wait"
              : error
                ? "text-red-400 hover:text-red-600"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }
          ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
      >
        {loading ? (
          /* Simple spinner */
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          /* Download icon */
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
      </button>
      {error && (
        <span className="text-[10px] text-red-400 max-w-[120px] truncate" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
