import { useEffect, useRef, useState } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // let native shortcuts (copy, select-all, refresh, devtools...) through untouched
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      // don't steal typing from some other focusable/editable element, if one ever exists
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== inputRef.current && active !== document.body) return;

      if (event.key === "Enter") {
        event.preventDefault();
        dausbox.execute(buffer);
        onExec();
        setBuffer("");
        setCaretIdx(0);
        setCmdIdx(0);
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
        if (cmdIdx === 0) setDraft(buffer);
        const newCmd = dausbox.getNthPrevCommand(cmdIdx + 1);
        setCaretIdx(caretIdx === buffer.length ? newCmd.length : Math.min(caretIdx, newCmd.length));
        setBuffer(newCmd);
        setCmdIdx(cmdIdx + 1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (cmdIdx === 0) return;
        const newCmd = cmdIdx === 1 ? draft || "" : dausbox.getNthPrevCommand(cmdIdx - 1);
        if (cmdIdx === 1) setDraft(null);
        setBuffer(newCmd);
        setCaretIdx(caretIdx === buffer.length ? newCmd.length : Math.min(caretIdx, newCmd.length));
        setCmdIdx(cmdIdx - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        setCaretIdx(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setCaretIdx(buffer.length);
      } else if (event.key.length === 1) {
        event.preventDefault();
        setBuffer(buffer.slice(0, caretIdx) + event.key + buffer.slice(caretIdx));
        setCaretIdx(caretIdx + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [buffer, caretIdx, cmdIdx, draft, dausbox, onExec, scrollToBottom]);


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
        ref={inputRef}
        type="text"
        autoFocus
        readOnly
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
        aria-label="terminal input"
      />
    </>
  );
}
