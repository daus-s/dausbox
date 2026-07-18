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
  const [rerender, setRerender] = useState(false);
  const [dausbox, setDausBox] = useState<DausBox | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // rerender when rerender is invoked
  }, [rerender])

  useEffect(() => {
    DausBox.create().then((box) => {
      box.setWidth(Math.floor(innerWidth / 12));
      const rerenderCallBack = () => setRerender(r => !r);
      box.setRerenderCallBack(rerenderCallBack);
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
      <div ref={bottomRef} />
    </div>
  );
}
