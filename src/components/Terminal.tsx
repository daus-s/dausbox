import "../styles/terminal.css";

import { useEffect, useRef, useState } from "react";

import DausBox from "../dausbox/dausbox";
import { History } from "../dausbox/history";
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
      box.setWidth(Math.floor(innerWidth / 12));
      setDausBox(box);
    });
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {

      if (!dausbox)
        return;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        dausbox.setWidth(
          Math.floor(innerWidth / 12)
          )
      }, 150); // adjust delay to taste
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [dausbox]);

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
      {history.entries().map((entry, i) => {
        if ("input" in entry) {
          return (
            <p key={i} className="history-input">
              <span className="prompt">dausbox&gt;&nbsp;</span>
              {entry.input}
            </p>
          );
        }
        if ("output" in entry) {
          return renderOutput(entry.output, i);
        }
        return (
          <span key={i} className="error">
            {entry.error}
          </span>
        );
      })}
      <InputBuffer
        dausbox={dausbox}
        onExec={() => setTick(tick + 1)}
        scrollToBottom={scrollToBottom}
      />
      <div ref={bottomRef} />
    </div>
  );
}
