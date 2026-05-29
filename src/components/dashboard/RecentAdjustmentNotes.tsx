"use client";

import { useEffect, useState } from "react";
import type { DashboardAdjustmentNote } from "@/lib/types";
import { DownloadPdfButton } from "@/components/ui/DownloadPdfButton";

export function RecentAdjustmentNotes() {
  const [notes, setNotes] = useState<DashboardAdjustmentNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/records?type=adjustment_notes")
      .then((res) => (res.ok ? res.json() : Promise.reject("Error al cargar")))
      .then((json) => setNotes(json.data))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
        Notas de Ajuste Recientes
      </h3>
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        {loading && (
          <p className="p-3 text-xs text-zinc-400 italic">Cargando...</p>
        )}
        {error && (
          <p className="p-3 text-xs text-red-400 italic">{error}</p>
        )}
        {!loading && !error && notes.length === 0 && (
          <p className="p-3 text-xs text-zinc-400 italic">Sin registros</p>
        )}
        {!loading && !error && notes.length > 0 && (
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-zinc-500">Ref.</th>
                <th className="text-left px-3 py-2 font-medium text-zinc-500">Número</th>
                <th className="text-left px-3 py-2 font-medium text-zinc-500">Estado</th>
                <th className="text-right px-3 py-2 font-medium text-zinc-500">Total</th>
                <th className="text-left px-3 py-2 font-medium text-zinc-500">Fecha</th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {notes.map((n) => (
                <tr key={n.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-3 py-2 text-zinc-500 font-mono">{n.reference_code}</td>
                  <td className="px-3 py-2 text-zinc-500 font-mono">{n.number ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      n.status === "ACCEPTED"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}>
                      {n.status ?? "PENDIENTE"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-600 dark:text-zinc-400">
                    {n.total != null ? `$${Number(n.total).toLocaleString("es-CO")}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-zinc-400">{new Date(n.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <DownloadPdfButton
                      type="adjustment_note"
                      number={n.number ?? ""}
                      disabled={!n.number || n.status !== "ACCEPTED"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
