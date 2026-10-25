"use client";

import React from "react";
import { RunGate } from "@/features/runs/RunGate";
import { ChatTestbed } from "./ChatTestbed";

/** Trang kiểm thử độc lập (/ và /lab): chạy trên run hiện hành do backend chỉ định. */
export function ChatScreen() {
  return <RunGate>{(runId) => <ChatTestbed runId={runId} />}</RunGate>;
}
