"use client";

import { useEffect, useRef } from "react";

const ITEM_H = 36;
const VISIBLE = 5;

export interface DrumOption {
  value: number;
  label: string;
}

interface Props {
  options: DrumOption[];
  value: number;
  onChange: (value: number) => void;
  width?: number;
}

export function DrumPicker({ options, value, onChange, width = 64 }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const initialized = useRef(false);

  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const pad = ITEM_H * Math.floor(VISIBLE / 2);
  const containerH = ITEM_H * VISIBLE;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = idx * ITEM_H;
    if (!initialized.current) {
      el.scrollTop = target;
      initialized.current = true;
    } else if (Math.abs(el.scrollTop - target) > 2) {
      el.scrollTo({ top: target, behavior: "smooth" });
    }
  }, [idx]);

  function handleScroll() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const i = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(i, options.length - 1));
      onChange(options[clamped].value);
    }, 80);
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ height: containerH, width }}>
      {/* Fade top */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{ height: pad, background: "linear-gradient(to bottom, var(--surface) 20%, transparent)" }}
      />
      {/* Selection band */}
      <div
        className="absolute inset-x-0 z-10 pointer-events-none border-y border-[var(--primary)]/30 bg-[var(--primary)]/10 rounded"
        style={{ top: pad, height: ITEM_H }}
      />
      {/* Fade bottom */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{ height: pad, background: "linear-gradient(to top, var(--surface) 20%, transparent)" }}
      />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll [&::-webkit-scrollbar]:hidden"
        style={{
          scrollSnapType: "y mandatory",
          paddingTop: pad,
          paddingBottom: pad,
          scrollbarWidth: "none",
        }}
      >
        {options.map((opt, i) => (
          <div
            key={opt.value}
            style={{ height: ITEM_H, scrollSnapAlign: "center" }}
            className="flex items-center justify-center text-sm font-medium cursor-pointer select-none"
            onClick={() => {
              scrollRef.current?.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
              onChange(opt.value);
            }}
          >
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
}
