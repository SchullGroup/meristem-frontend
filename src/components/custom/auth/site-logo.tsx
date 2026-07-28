"use client";

import Image from "next/image";

export function SiteLogo() {
  return (
    <div className="flex justify-center">
      <Image
        src="/regispro.png"
        alt="RegisPro Logo"
        width={160}
        height={36}
        className="h-20 w-auto object-contain"
        priority
        unoptimized
      />
    </div>
  );
}
