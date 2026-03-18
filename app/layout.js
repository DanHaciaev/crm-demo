import { AuthProvider } from "@/components/context/AuthProvider";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <TooltipProvider><AuthProvider>{children}</AuthProvider></TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
