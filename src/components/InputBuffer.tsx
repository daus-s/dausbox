import { useState } from "react";
import Cursor from "./Cursor";
import type DausBox from "../dausbox";

type BufferProps = {
  dausbox: DausBox;
  onExec: () => void;
  scrollToBottom: () => void;
};

export default function InputBuffer({
  dausbox,
  onExec,
  scrollToBottom,
}: BufferProps) {
  const [idx, setIdx] = useState(0);
  const [buffer, setBuffer] = useState("");

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      dausbox.execute(buffer);
      onExec();
      setBuffer("");
      setIdx(0);
      // Defer scroll until after React flushes the new history into the DOM
      setTimeout(scrollToBottom, 0);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      if (idx === 0) return;
      setBuffer(buffer.slice(0, idx - 1) + buffer.slice(idx));
      setIdx(idx - 1);
    } else if (event.key === "Delete") {
      event.preventDefault();
      setBuffer(buffer.slice(0, idx) + buffer.slice(idx + 1));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setIdx(Math.max(idx - 1, 0));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setIdx(Math.min(idx + 1, buffer.length));
    } else if (event.key === "Home") {
      event.preventDefault();
      setIdx(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setIdx(buffer.length);
    } else if (event.key.length === 1 && noModifier(event)) {
      event.preventDefault();
      const next = buffer.slice(0, idx) + event.key + buffer.slice(idx);
      setBuffer(next);
      setIdx(idx + 1);
    }
  };

  // Split buffer around cursor position for rendering
  const before = buffer.slice(0, idx);
  const after = buffer.slice(idx + 1);

  return (
    <>
      <p className="buffer">
        <span className="prompt">dausbox&gt;&nbsp;</span>
        {before}
        <Cursor char={buffer[idx] || ""} />
        {after}
      </p>
      <input
        type="text"
        autoFocus
        onBlur={(e) => e.currentTarget.focus()}
        onKeyDown={handleKeyDown}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
        aria-label="terminal input"
      />
    </>
  );
}

function noModifier(event: React.KeyboardEvent<HTMLInputElement>): boolean {
  return !event.ctrlKey && !event.altKey && !event.metaKey;
}
