import "./styles/terminal.css";

import { useEffect, useRef, useState } from "react";

import Cursor from "./Cursor";

import DausBox from "./dausbox";
import { History } from "./history";

function Terminal() {
  const bottomRef = useRef<HTMLDivElement>(null);

  const [dausbox, setDausBox] = useState<DausBox | null>();
  const [buffer, setBuffer] = useState("");
  const [history, setHistory] = useState<History | null>(null);

  useEffect(() => {
    DausBox.create().then((box) => {
      setDausBox(box);
      setHistory(box.get_history() ?? new History());
    });
  }, []);

  //on enter pass to interpreter and add to history
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();

      if (!dausbox) return;

      console.log("executing:", buffer);
      dausbox.execute(buffer);
      console.log("executed");

      setHistory(dausbox.get_history() ?? new History());
      setBuffer("");
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (event.key === "Backspace") {
      event.preventDefault();
      setBuffer(buffer.slice(0, -1));
    } else if (event.key.length === 1 && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      setBuffer(buffer + event.key);
    }
  };
  if (!history) return <p>loading...</p>;

  return (
    <div className="terminal">
      {(history ? history.entries() : []).map((entry, index) => (
        <>
          <p key={2 * index}>
            {"dausbox> "}
            {entry.input}
          </p>
          {entry.output != null ? (
            entry.output.trim().startsWith("**") &&
            entry.output.trim().endsWith("**") ? (
              <p style={{ fontWeight: "bolder" }}>
                {"          " + entry.output.trim().slice(2, -2)}
              </p>
            ) : (
              entry.output
                .split("\n")
                .map((s) => <p className="output-line">{"          " + s}</p>)
            )
          ) : (
            <span className="error">{entry.error}</span>
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
