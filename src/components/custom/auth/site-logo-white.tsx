"use client";

import Image from "next/image";

export function WhiteSiteLogo() {
  return (
    <div className="flex justify-center">
      <Image
        src="/logow.png"
        alt="Meristem Logo"
        width={160}
        height={36}
        className="h-8 w-auto object-contain"
        priority
        unoptimized
      />
    </div>
  );
}
