export function TopCustomers() {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
        Clientes Recientes
      </h3>
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 text-sm text-zinc-500 dark:text-zinc-400">
        {/* TODO: fetch from /api/records (Supabase direct) */}
        <p className="text-xs italic">API de datos pendiente</p>
      </div>
    </section>
  );
}
