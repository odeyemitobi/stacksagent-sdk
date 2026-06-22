import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StackAgent SDK",
  description: "The standard infrastructure layer for AI-powered Bitcoin Finance applications on Stacks.",
};

import { AppShell } from "@/components/app-shell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      className={`${inter.variable} ${firaCode.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white" suppressHydrationWarning={true}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
