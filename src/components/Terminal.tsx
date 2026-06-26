import "../styles/terminal.css";

import { useEffect, useRef, useState } from "react";

import DausBox from "../dausbox";
import { History } from "../history";
import InputBuffer from "./InputBuffer";

function renderOutput(output: string, entryIdx: number) {
  // Bold block: **text**
  const trimmed = output.trim();
  if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
    return (
      <p key={`out-${entryIdx}`} className="output-line output-bold">
        {trimmed.slice(2, -2)}
      </p>
    );
  }

  return output.split("\n").map((line, lineIdx) => (
    <p key={`out-${entryIdx}-${lineIdx}`} className="output-line">
      {line}
    </p>
  ));
}

export default function Terminal() {
  const [dausbox, setDausBox] = useState<DausBox | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    DausBox.create().then((box) => {
      setDausBox(box);
    });
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [tick, setTick] = useState(0);

  if (!dausbox) {
    return (
      <div className="terminal">
        <p>loading...</p>
      </div>
    );
  }
  const history = dausbox.get_history() ?? new History();

  return (
    <div className="terminal">
      {history.entries().map((entry, i) => (
        <div key={i} className="history-entry">
          <p className="history-input">
            <span className="prompt">dausbox&gt;&nbsp;</span>
            {entry.input}
          </p>
          {entry.output != null ? (
            renderOutput(entry.output, i)
          ) : (
            <span className="error">{entry.error}</span>
          )}
        </div>
      ))}
      <InputBuffer
        dausbox={dausbox}
        onExec={() => setTick(tick + 1)}
        scrollToBottom={scrollToBottom}
      />
      {/* Sentinel — always at the bottom of the DOM */}
      <div ref={bottomRef} />
    </div>
  );
}
