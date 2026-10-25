"use client";

import React, { useState } from "react";
import { DetailSection } from "./RunDetailSections";

export function ReviewForm({ initialNote, onSubmit }: { initialNote: string; onSubmit: (agree: boolean, note: string) => Promise<string> }) {
  const [note, setNote] = useState(initialNote);
  const [message, setMessage] = useState("");
  const submit = async (agree: boolean) => setMessage(await onSubmit(agree, note));

  return (
    <DetailSection title="Đánh giá của người kiểm định">
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú đánh giá" />
      <div className="eval-actions">
        <button className="eval-button" onClick={() => void submit(true)}>
          Đồng ý với verdict
        </button>
        <button className="eval-button" onClick={() => void submit(false)}>
          Không đồng ý
        </button>
      </div>
      <p role="status">{message}</p>
    </DetailSection>
  );
}
