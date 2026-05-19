"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Sidebar } from "@/components/shell/sidebar";
import { Header } from "@/components/shell/header";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentUser, isSessionExpired, setIsSessionExpired } = useStore();
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);

  const handleRedirect = () => {
    setIsSessionExpired(false);
    setShowSessionDialog(false);
    router.replace("/login");
  };

  useEffect(() => {
    //eslint-disable-next-line
    setMounted(true);

    if (useStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useStore.persist.onFinishHydration(() => {
        setHydrated(true);
      });
      return () => unsub();
    }
  }, []);

  useEffect(() => {
    if (hydrated && !currentUser && isSessionExpired) {
      //eslint-disable-next-line
      setShowSessionDialog(true);
    }
  }, [hydrated, currentUser, isSessionExpired]);

  if (!mounted || !hydrated) return null;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Dialog open={showSessionDialog} onOpenChange={handleRedirect}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 text-destructive mb-2">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <DialogTitle className="text-xl">Session Expired</DialogTitle>
              </div>
              <DialogDescription className="text-base text-muted-foreground">
                Your session has timed out or you are not authorized to view
                this page. Please log in again to continue.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 sm:justify-end">
              <Button
                type="button"
                className="w-full sm:w-auto px-8 cursor-pointer"
                onClick={handleRedirect}
              >
                Sign In
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex">
      <Sidebar />
      <div className="ml-72 flex-1 flex flex-col min-h-screen relative">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
