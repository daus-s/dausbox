import "./styles/terminal.css";

import { useEffect, useRef, useState } from "react";

import Cursor from "./Cursor";

import { evaluate } from "./interpreter/interpreter";

function Terminal() {
  const bottomRef = useRef<HTMLDivElement>(null);

  const [history, setHistory] = useState<{ expr: string; res: string }[]>([]);
  const [buffer, setBuffer] = useState("");

  //on enter pass to interpreter and add to history
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const output = evaluate(buffer);
      setHistory([...history, { expr: buffer, res: output }]);
      setBuffer("");
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (event.key === "Backspace") {
      event.preventDefault();
      setBuffer(buffer.slice(0, -1));
    } else if (event.key.length === 1) {
      event.preventDefault();
      setBuffer(buffer + event.key);
    }
  };

  useEffect(() => {}, [buffer]);

  return (
    <div className="terminal">
      {history.map(({ expr, res }, index) => (
        <>
          <p key={2 * index}>
            {"> "}
            {expr}
          </p>
          {res && <p key={2 * index + 1}> {res}</p>}
        </>
      ))}

      <p className="buffer">
        {"> "}
        {buffer}
        <Cursor />
      </p>
      <input
        type="text"
        autoFocus
        onBlur={(e) => e.currentTarget.focus()}
        onKeyDown={handleKeyDown}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
        aria-label="terminal input"
      />

      <div ref={bottomRef} />
    </div>
  );
}

export default Terminal;
