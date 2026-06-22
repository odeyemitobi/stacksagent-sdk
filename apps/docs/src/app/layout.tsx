import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BookText, Code } from 'lucide-react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StackAgent SDK | Bitcoin AI Infrastructure",
  description: "Production-grade, open-source infrastructure for AI-powered Bitcoin Finance applications on Stacks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 selection:bg-orange-500/30 selection:text-orange-200">
        <header className="sticky top-0 z-50 w-full border-b border-white/10 glass-panel">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-700 flex items-center justify-center text-white">S</span>
              StackAgent SDK
            </div>
            <nav className="hidden md:flex gap-6 text-sm font-medium text-zinc-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#" className="flex items-center gap-2 hover:text-white transition-colors"><BookText size={16}/> Docs</a>
              <a href="#" className="flex items-center gap-2 hover:text-white transition-colors"><Code size={16}/> API</a>
            </nav>
            <div className="flex items-center gap-4">
              <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
              </a>
              <a href="#" className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors">
                Get Started
              </a>
            </div>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col relative z-10">
          {children}
        </main>

        <footer className="border-t border-white/10 py-12 mt-20 relative z-10 bg-black">
          <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-zinc-500 text-sm">
              &copy; {new Date().getFullYear()} StackAgent SDK. Built on Stacks.
            </div>
            <div className="flex gap-6 text-sm font-medium text-zinc-500">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
