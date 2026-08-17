import { useEffect, useRef, useState } from "react";
import Cursor from "./Cursor";
import type DausBox from "../dausbox/dausbox";
import {
  INDENT,
  PROMPT,
  contPrompt,
  depthOf,
  expandForEdit,
  recallCaret,
} from "./promptFormat";

type BufferProps = {
  dausbox: DausBox;
  scrollToBottom: () => void;
};

export default function InputBuffer({ dausbox, scrollToBottom }: BufferProps) {
  const [caretIdx, setCaretIdx] = useState(0);
  const [cmdIdx, setCmdIdx] = useState(0);
  const [lockedLines, setLockedLines] = useState<string[]>([]);
  const [buffer, setBuffer] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [depth, setDepth] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        active !== inputRef.current &&
        active !== document.body
      )
        return;

      const trimmed = buffer.trim();

      if (event.key === "Enter") {
        event.preventDefault();

        if (depth > 0 && trimmed === "") {
          const newDepth = Math.max(depth - 1, 0);
          if (newDepth === 0) {
            dausbox.execute(lockedLines.join("\n"));
            setLockedLines([]);
          }
          setDepth(newDepth);
          setBuffer("");
          setCaretIdx(0);
          setCmdIdx(0);
          setTimeout(scrollToBottom, 0);
          return;
        }

        if (trimmed.endsWith(":")) {
          setLockedLines((prev) => [...prev, INDENT.repeat(depth) + buffer]);
          setDepth((prev) => prev + 1);
          setBuffer("");
          setCaretIdx(0);
          setTimeout(scrollToBottom, 0);
          return;
        }

        if (depth === 0) {
          dausbox.execute(buffer);
        } else {
          setLockedLines((prev) => [...prev, INDENT.repeat(depth) + buffer]);
        }
        setBuffer("");
        setCaretIdx(0);
        setCmdIdx(0);
        setTimeout(scrollToBottom, 0);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        if (depth > 0 && buffer === "" && caretIdx === 0) {
          const newDepth = Math.max(depth - 1, 0);
          if (newDepth === 0) {
            dausbox.execute(lockedLines.join("\n"));
            setLockedLines([]);
            setTimeout(scrollToBottom, 0);
          }
          setDepth(newDepth);
          return;
        }
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
        // InputBuffer.tsx — only the two arrow handlers and the locked-lines render change
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (depth > 0 && cmdIdx === 0) return;
        if (cmdIdx === dausbox.commandCount()) return;
        if (cmdIdx === 0) setDraft(buffer);
        const raw = dausbox.getNthPrevCommand(cmdIdx + 1);
        const next = expandForEdit(raw);
        setLockedLines(next.lockedLines);
        setDepth(next.depth);
        setCaretIdx(recallCaret(caretIdx, buffer, next.buffer));
        setBuffer(next.buffer);
        setCmdIdx(cmdIdx + 1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (depth > 0 && cmdIdx === 0) return;
        if (cmdIdx === 0) return;
        if (cmdIdx === 1) {
          const restored = draft || "";
          setDraft(null);
          setLockedLines([]);
          setDepth(0);
          setCaretIdx(recallCaret(caretIdx, buffer, restored));
          setBuffer(restored);
          setCmdIdx(0);
          return;
        }
        const raw = dausbox.getNthPrevCommand(cmdIdx - 1);
        const next = expandForEdit(raw);
        setLockedLines(next.lockedLines);
        setDepth(next.depth);
        setCaretIdx(recallCaret(caretIdx, buffer, next.buffer));
        setBuffer(next.buffer);
        setCmdIdx(cmdIdx - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        setCaretIdx(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setCaretIdx(buffer.length);
      } else if (event.key === "Tab") {
        event.preventDefault();
        if (buffer === "" && caretIdx === 0) {
          setDepth((prev) => prev + 1);
          return;
        }
        setBuffer(buffer.slice(0, caretIdx) + INDENT + buffer.slice(caretIdx));
        setCaretIdx(caretIdx + INDENT.length);
      } else if (event.key.length === 1) {
        event.preventDefault();
        setBuffer(
          buffer.slice(0, caretIdx) + event.key + buffer.slice(caretIdx),
        );
        setCaretIdx(caretIdx + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    buffer,
    caretIdx,
    cmdIdx,
    draft,
    dausbox,
    scrollToBottom,
    depth,
    lockedLines,
  ]);

  useEffect(() => {
    return dausbox.onPopulate((cmd) => {
      setLockedLines([]);
      setDepth(0);
      setBuffer(cmd);
      setCaretIdx(cmd.length);
      setCmdIdx(0);
      setTimeout(scrollToBottom, 0);
    });
  }, [dausbox, scrollToBottom]);

  const before = buffer.slice(0, caretIdx);
  const after = buffer.slice(caretIdx + 1);

  return (
    <>
      {lockedLines.map((line, i) => (
        <p className="buffer" key={i}>
          <span className="prompt">
            {i === 0 ? PROMPT : contPrompt(depthOf(line))}
          </span>
          {line.trimStart()}
        </p>
      ))}
      <p className="buffer">
        <span className="prompt">
          {lockedLines.length === 0 ? PROMPT : contPrompt(depth)}
        </span>
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
