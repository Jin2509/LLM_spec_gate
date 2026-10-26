"use client";

import React from "react";
import { AppShell } from "@/ui/shell";
import { PageHeader } from "@/ui/layout";

/** Khung chung cho nhóm trang Lịch sử / Thống kê: cùng shell và header với phần còn lại của app. */
export function ShellPage({
  eyebrow = "Dữ liệu",
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <div className="shell-page">
        <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />
        {children}
      </div>
    </AppShell>
  );
}
