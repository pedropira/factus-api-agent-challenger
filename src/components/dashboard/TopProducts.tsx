"use client";

import { useEffect, useState } from "react";
import type { DashboardProduct } from "@/lib/types";

export function TopProducts() {
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/records?type=products")
      .then((res) => (res.ok ? res.json() : Promise.reject("Error al cargar")))
      .then((json) => setProducts(json.data))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
        Productos Recientes
      </h3>
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        {loading && (
          <p className="p-3 text-xs text-zinc-400 italic">Cargando...</p>
        )}
        {error && (
          <p className="p-3 text-xs text-red-400 italic">{error}</p>
        )}
        {!loading && !error && products.length === 0 && (
          <p className="p-3 text-xs text-zinc-400 italic">Sin registros</p>
        )}
        {!loading && !error && products.length > 0 && (
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-zinc-500">Código</th>
                <th className="text-left px-3 py-2 font-medium text-zinc-500">Nombre</th>
                <th className="text-right px-3 py-2 font-medium text-zinc-500">Precio</th>
                <th className="text-right px-3 py-2 font-medium text-zinc-500">IVA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-3 py-2 text-zinc-500 font-mono">{p.code_reference}</td>
                  <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{p.name}</td>
                  <td className="px-3 py-2 text-right text-zinc-600 dark:text-zinc-400">
                    ${Number(p.price).toLocaleString("es-CO")}
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-500">{p.tax_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
