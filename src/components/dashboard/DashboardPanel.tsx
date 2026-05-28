import { TopCustomers } from "./TopCustomers";
import { TopProducts } from "./TopProducts";
import { RecentInvoices } from "./RecentInvoices";
import { RecentCreditNotes } from "./RecentCreditNotes";
import { RecentSupportDocuments } from "./RecentSupportDocuments";
import { RecentAdjustmentNotes } from "./RecentAdjustmentNotes";

export function DashboardPanel() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <header className="border-b border-zinc-200 dark:border-zinc-700 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Panel
        </h2>
      </header>

      <div className="flex-1 space-y-4 p-4">
        <TopCustomers />
        <TopProducts />
        <RecentInvoices />
        <RecentCreditNotes />
        <RecentSupportDocuments />
        <RecentAdjustmentNotes />
      </div>
    </div>
  );
}
