"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Sidebar } from "@/components/shell/sidebar";
import { Header } from "@/components/shell/header";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentUser, principals, seedStore } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!currentUser) router.replace("/login");
  }, [currentUser, router]);

  if (!mounted || !currentUser) return null;

  const activeUser = currentUser;

  return (
    <div className="min-h-screen bg-muted/20 flex">
      <Sidebar />
      <div className="ml-72 flex-1 flex flex-col min-h-screen relative">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}