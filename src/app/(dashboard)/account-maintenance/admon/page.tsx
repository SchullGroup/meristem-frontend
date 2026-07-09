"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdmonRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account-maintenance/admor");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-muted-foreground">
        Redirecting to Administration (ADMOR)...
      </p>
    </div>
  );
}
