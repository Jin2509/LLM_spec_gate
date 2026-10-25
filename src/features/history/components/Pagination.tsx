"use client";

import React from "react";

export function Pagination({ page, pageSize, total, onPageChange }: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }) {
  return (
    <div className="eval-pagination">
      <button className="eval-button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Trang trước
      </button>
      <span>
        Trang {page} / {Math.max(1, Math.ceil(total / pageSize))}
      </span>
      <button className="eval-button" disabled={page * pageSize >= total} onClick={() => onPageChange(page + 1)}>
        Trang sau
      </button>
    </div>
  );
}
