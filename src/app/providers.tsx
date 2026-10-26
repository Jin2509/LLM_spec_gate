/**
 * src/app/providers.tsx — Provider phía client dùng chung cho mọi trang (nằm trong root layout).
 */
"use client";

import React from "react";
import { LlmConfigProvider } from "@/features/chat";

export function Providers({ children }: { children: React.ReactNode }) {
  return <LlmConfigProvider>{children}</LlmConfigProvider>;
}
