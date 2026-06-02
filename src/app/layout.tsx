import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { WorkspaceProvider } from "@/context/workspace-context";
import { ThemeProvider } from "@/context/theme-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Factus Agent — Facturación Electrónica",
  description:
    "Agente de IA para facturación electrónica colombiana vía Factus DIAN API",
  icons: {
    icon: "/robot.svg",
    apple: "/robot.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full flex flex-col overflow-hidden">
        {/* ⚡ Anti-FOUC: apply theme before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(){try{var e=localStorage.getItem("factus-agent-theme")||(window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");"dark"===e?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark")}catch(e){}}();`,
          }}
        />
        <ThemeProvider>
          <AuthProvider>
            <WorkspaceProvider>{children}</WorkspaceProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
