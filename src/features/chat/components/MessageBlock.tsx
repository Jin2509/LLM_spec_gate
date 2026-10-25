import React from "react";
import { i18n } from "@/i18n/vi";
import type { ChatTurn } from "../chat-session";

export function MessageBlock({ turn }: { turn: ChatTurn }) {
  return (
    <article className={`message-block ${turn.role}`}>
      <div className="message-role">{turn.role === "user" ? i18n.chat.you : i18n.chat.system}</div>
      <div className="message-content">{turn.text}</div>
      {turn.verdict && <div className="message-verdict">{turn.verdict}</div>}
    </article>
  );
}
