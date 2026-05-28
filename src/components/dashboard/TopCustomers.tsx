"use client";

import { useEffect, useState } from "react";
import type { DashboardCustomer } from "@/lib/types";

export function TopCustomers() {
  const [customers, setCustomers] = useState<DashboardCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/records?type=customers")
      .then((res) => (res.ok ? res.json() : Promise.reject("Error al cargar")))
      .then((json) => setCustomers(json.data))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
        Clientes Recientes
      </h3>
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        {loading && (
          <p className="p-3 text-xs text-zinc-400 italic">Cargando...</p>
        )}
        {error && (
          <p className="p-3 text-xs text-red-400 italic">{error}</p>
        )}
        {!loading && !error && customers.length === 0 && (
          <p className="p-3 text-xs text-zinc-400 italic">Sin registros</p>
        )}
        {!loading && !error && customers.length > 0 && (
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-zinc-500">ID</th>
                <th className="text-left px-3 py-2 font-medium text-zinc-500">Nombre</th>
                <th className="text-left px-3 py-2 font-medium text-zinc-500">Email</th>
                <th className="text-left px-3 py-2 font-medium text-zinc-500">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{c.identification}</td>
                  <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{c.names ?? c.company ?? "—"}</td>
                  <td className="px-3 py-2 text-zinc-500">{c.email ?? "—"}</td>
                  <td className="px-3 py-2 text-zinc-400">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
