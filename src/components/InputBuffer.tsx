import { useState } from "react";
import Cursor from "./Cursor";
import type DausBox from "../dausbox/dausbox";

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
  const [caretIdx, setCaretIdx] = useState(0); //refers to how the number of commands previously before the current
  const [cmdIdx, setCmdIdx] = useState(0);
  const [buffer, setBuffer] = useState("");
  const [draft, setDraft] = useState<string | null>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();

      dausbox.execute(buffer);
      onExec();
      setBuffer("");
      setCaretIdx(0);
      // Defer scroll until after React flushes the new history into the DOM
      setTimeout(scrollToBottom, 0);
    } else if (event.key === "Backspace") {
      event.preventDefault();

      if (caretIdx === 0) return;
      setBuffer(buffer.slice(0, caretIdx - 1) + buffer.slice(caretIdx));
      setCaretIdx(caretIdx - 1);
    } else if (event.key === "Delete") {
      event.preventDefault();

      setBuffer(buffer.slice(0, caretIdx) + buffer.slice(caretIdx + 1));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();

      setCaretIdx(Math.max(caretIdx - 1, 0));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();

      setCaretIdx(Math.min(caretIdx + 1, buffer.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();

      if (cmdIdx === dausbox.history.length()) return;

      if (cmdIdx === 0) {
        setDraft(buffer);
      }
      setBuffer(dausbox.getNthPrevCommand(cmdIdx + 1));

      setCmdIdx(cmdIdx + 1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();

      if (cmdIdx === 0) return;

      if (cmdIdx === 1) {
        setBuffer(draft || ""); //at this point draft must not be null is it provably so?
        setDraft(null);
      } else {
        setBuffer(dausbox.getNthPrevCommand(cmdIdx - 1));
      }

      setCmdIdx(cmdIdx - 1);
    } else if (event.key === "Home") {
      event.preventDefault();

      setCaretIdx(0);
    } else if (event.key === "End") {
      event.preventDefault();

      setCaretIdx(buffer.length);
    } else if (event.key.length === 1 && noModifier(event)) {
      event.preventDefault();

      const next =
        buffer.slice(0, caretIdx) + event.key + buffer.slice(caretIdx);
      setBuffer(next);
      setCaretIdx(caretIdx + 1);
    }
  };

  // Split buffer around cursor position for rendering
  const before = buffer.slice(0, caretIdx);
  const after = buffer.slice(caretIdx + 1);

  return (
    <>
      <p className="buffer">
        <span className="prompt">dausbox&gt;&nbsp;</span>
        {before}
        <Cursor char={buffer[caretIdx] || ""} />
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
