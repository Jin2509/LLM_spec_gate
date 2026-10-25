/**
 * src/lib/api/use-api-query.ts — Hook đọc dữ liệu từ API cho Client Components.
 *
 * - `key` đại diện cho tham số request; đổi key ⇒ tự fetch lại và huỷ request cũ.
 * - `key = null` ⇒ tạm không fetch.
 * - Giữ dữ liệu cũ trong lúc tải lại để tránh nhấp nháy giao diện.
 */
"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { errorMessage, errorStatus } from "./client";

export interface ApiQuery<T> {
  data: T | undefined;
  error: string | undefined;
  /** HTTP status của lỗi (501 = chức năng chưa khả dụng ở backend). */
  errorStatus: number | undefined;
  isLoading: boolean;
  reload: () => void;
  /** Cập nhật dữ liệu cục bộ sau một mutation thành công. */
  setData: (updater: (previous: T | undefined) => T | undefined) => void;
}

interface Settled<T> {
  requestKey: string;
  data?: T;
  error?: string;
  errorStatus?: number;
}

export function useApiQuery<T>(key: string | null, fetcher: (signal: AbortSignal) => Promise<T>): ApiQuery<T> {
  const [nonce, setNonce] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>({ requestKey: "" });
  const requestKey = key === null ? "" : `${key}#${nonce}`;
  const load = useEffectEvent(fetcher);

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    const currentKey = `${key}#${nonce}`;
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setSettled({ requestKey: currentKey, data });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setSettled((previous) => ({
          requestKey: currentKey,
          data: previous.data,
          error: errorMessage(error),
          errorStatus: errorStatus(error),
        }));
      },
    );
    return () => controller.abort();
  }, [key, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback(
    (updater: (previous: T | undefined) => T | undefined) =>
      setSettled((previous) => ({ ...previous, data: updater(previous.data) })),
    [],
  );

  const isCurrent = settled.requestKey === requestKey;
  return {
    data: settled.data,
    error: isCurrent ? settled.error : undefined,
    errorStatus: isCurrent ? settled.errorStatus : undefined,
    isLoading: key !== null && !isCurrent,
    reload,
    setData,
  };
}
