"use client";

import Image from "next/image";

export function SiteLogo() {
  return (
    <div className="flex justify-center">
      <Image
        src="/logo.svg"
        alt="Meristem Logo"
        width={160}
        height={36}
        className="h-8 w-auto object-contain"
        priority
      />
    </div>
  );
}
