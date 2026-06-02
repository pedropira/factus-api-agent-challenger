// Auth layout — centered card layout for login/register pages.
// No sidebar, no dashboard — clean and focused.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full items-center justify-center bg-surface-app px-4 py-12">
      {/* Subtle gradient orbs for depth */}
      <div
        className="pointer-events-none fixed inset-0 select-none"
        aria-hidden="true"
      >
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-factus-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-factus-accent/5 blur-3xl dark:bg-factus-accent/[0.03]" />
      </div>
      <div className="relative w-full max-w-sm">{children}</div>
    </div>
  );
}
