import { Bebas_Neue, Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider.jsx";
import { SessionRefresh } from "@/components/session-refresh.jsx";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Iron Fitness — Gym Management",
  description: "Members, subscriptions, trainers, workouts, and attendance in one place",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${manrope.variable} ${bebasNeue.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-slate-100 text-slate-900 antialiased dark:bg-[#02070f] dark:text-slate-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SessionRefresh />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
