"use client";

import Image from "next/image";

export function WhiteSiteLogo() {
  return (
    <div className="flex justify-center">
      <Image
        src="/regispro_white.png"
        alt="RegisPro Logo"
        width={160}
        height={96}
        className="h-8 w-auto object-contain"
        priority
        unoptimized
      />
    </div>
  );
}
