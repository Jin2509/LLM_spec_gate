/**
 * src/ui/shell/use-sidebar-collapsed.ts — Trạng thái thu/phóng thanh bên (màn hình ≥ 900px).
 *
 * Lưu lựa chọn trong localStorage để giữ nguyên khi chuyển trang hoặc tải lại.
 */
"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "specgate-sidebar-collapsed";
const CHANGE_EVENT = "specgate-sidebar-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const toggle = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, getSnapshot() ? "0" : "1");
    } catch {
      // localStorage không dùng được: bỏ qua, thanh bên giữ trạng thái mặc định.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { collapsed, toggle };
}
