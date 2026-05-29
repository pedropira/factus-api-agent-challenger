"use client";

import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-zinc-500">Cargando...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
