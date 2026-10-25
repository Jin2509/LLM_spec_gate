"use client";

import { useParams } from "next/navigation";

/** Đọc một tham số động của route (runId, caseId, rq...); undefined nếu route không có. */
export function useRouteParam(name: string): string | undefined {
  const params = useParams();
  const value = params?.[name];
  return (Array.isArray(value) ? value[0] : value) || undefined;
}
