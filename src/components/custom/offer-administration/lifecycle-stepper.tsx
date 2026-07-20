"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LifecycleStepperProps {
  stages: string[];
  currentStage: number;
  onStageClick?: (index: number) => void;
}

export function LifecycleStepper({ stages, currentStage, onStageClick }: LifecycleStepperProps) {
  return (
    <div className="flex items-start w-full overflow-x-auto no-scrollbar pb-1">
      {stages.map((stage, i) => {
        const done = i < currentStage;
        const active = i === currentStage;
        return (
          <div key={stage} className="flex items-center flex-1 last:flex-none min-w-0">
            <button
              onClick={() => onStageClick?.(i)}
              disabled={!onStageClick}
              className={cn(
                "flex flex-col items-center gap-1.5 min-w-0",
                onStageClick ? "cursor-pointer" : "cursor-default"
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all text-xs font-bold shrink-0",
                  done && "bg-primary border-primary text-primary-foreground",
                  active && "bg-background border-primary text-primary ring-4 ring-primary/15",
                  !done && !active && "bg-background border-border text-muted-foreground"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium whitespace-nowrap",
                  active ? "text-primary" : done ? "text-foreground/70" : "text-muted-foreground"
                )}
              >
                {stage}
              </span>
            </button>
            {i < stages.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 mb-5 rounded-full shrink",
                  i < currentStage ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
