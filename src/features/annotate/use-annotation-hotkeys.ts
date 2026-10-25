"use client";

import { useEffect } from "react";

export interface AnnotationHotkeyHandlers {
  onAccept: () => void;
  onReject: () => void;
  onUncertain: () => void;
  onDefer: () => void;
}

/** Phím tắt toàn cục 1 / 2 / C / S; bỏ qua khi đang gõ trong ô nhập liệu. */
export function useAnnotationHotkeys({ onAccept, onReject, onUncertain, onDefer }: AnnotationHotkeyHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const key = e.key.toLowerCase();
      const handler = key === "1" ? onAccept : key === "2" ? onReject : key === "c" ? onUncertain : key === "s" ? onDefer : null;
      if (!handler) return;
      e.preventDefault();
      handler();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onAccept, onReject, onUncertain, onDefer]);
}
