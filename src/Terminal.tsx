import "./styles/terminal.css";

import { useEffect, useRef, useState } from "react";

import Cursor from "./Cursor";

import DausBox from "./dasl/dausbox";

function Terminal() {
  const bottomRef = useRef<HTMLDivElement>(null);

  const dausbox = useRef(new DausBox());
  const [buffer, setBuffer] = useState("");
  const [history, setHistory] = useState<
    { input: string; output: { code: number; result: string } }[]
  >([]);

  //on enter pass to interpreter and add to history
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      dausbox.current.execute(buffer);
      setHistory([
        ...history,
        dausbox.current.get_history()[dausbox.current.get_history().length - 1],
      ]);
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
      {history.map(({ input, output }, index) => (
        <>
          <p key={2 * index}>
            {"dausbox> "}
            {input}
          </p>
          {"        "}
          {output.result.length > 0 && (
            <p
              style={{
                color:
                  output.code === 0
                    ? "blue"
                    : output.code === -1
                      ? "yellow"
                      : "red",

                fontWeight: output.code === -1 ? "bold" : "normal",
              }}
              key={2 * index + 1}
            >
              {"        "}
              {output.result}
            </p>
          )}
        </>
      ))}

      <p className="buffer">
        {"dausbox> "}
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
