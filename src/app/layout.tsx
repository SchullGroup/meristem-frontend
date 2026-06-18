import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";
import StoreHydrationProvider from "@/components/providers/store-hydration-provider";
import { BulkJobMonitorProvider } from "@/components/providers/bulk-job-monitor-provider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MRPSL - Core Processing Application",
  description: "Registrar Excellence. Powered by Precision.",
  icons: {
    icon: "/favicon/favicon.png",
    apple: "/favicon/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="antialiased">
        <QueryProvider>
          <StoreHydrationProvider>
            <BulkJobMonitorProvider>
              {children}
            </BulkJobMonitorProvider>
          </StoreHydrationProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
