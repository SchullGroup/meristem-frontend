"use client";

import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function StoreHydrationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Check if already hydrated
    if (useStore.persist.hasHydrated()) {
      // eslint-disable-next-line
      setHydrated(true);
      return;
    }

    const unsub = useStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Fallback if onFinishHydration doesn't fire for some reason
    const timer = setTimeout(() => {
      if (useStore.persist.hasHydrated()) {
        setHydrated(true);
      }
    }, 100);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {!hydrated ? (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-999 flex flex-col items-center justify-center bg-background"
          >
            <div className="relative flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              >
                <Image
                  src="/logo.svg"
                  alt="Meristem Logo"
                  width={200}
                  height={45}
                  className="h-12 w-auto object-contain"
                  priority
                />
              </motion.div>

              <div className="mt-12 w-48 h-1 bg-muted rounded-full overflow-hidden relative">
                <motion.div
                  className="absolute inset-0 bg-primary/80"
                  initial={{ left: "-100%" }}
                  animate={{ left: "100%" }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-xs font-medium text-muted-foreground tracking-[0.2em] uppercase"
              >
                Initializing System
              </motion.p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {/* We keep children rendered but hidden until hydration to avoid layout shifts if possible, 
          OR we just conditionally render them if we want to stop hooks from firing. 
          The user specifically wants to stop the redirect hook from firing prematurely. */}
      {hydrated && children}
    </>
  );
}
