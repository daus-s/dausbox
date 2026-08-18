import "../styles/terminal.css";
import { Fragment, useEffect, useRef, useState } from "react";
import DausBox from "../dausbox/dausbox";
import { type HistoryEntry } from "../dausbox/history";
import InputBuffer from "./InputBuffer";
import OutputBlock from "./OutputBlock";
import { contPrompt, depthOf, PROMPT } from "./promptFormat";
import MarkdownBlock from "./MarkdownBlock";
import { setActiveDausbox } from "./tags";

export default function Terminal() {
  const [dausbox, setDausBox] = useState<DausBox | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    DausBox.create().then((box) => {
      box.setWidth(Math.floor(innerWidth / 12));
      setDausBox(box);
      setActiveDausbox(box);
      if (localStorage.getItem("doWelcome") !== "no") box.welcome();
    });
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      if (!dausbox) return;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        dausbox.setWidth(Math.floor(innerWidth / 12));
      }, 150); // adjust delay to taste
    };
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [dausbox]);

  useEffect(() => {
    if (!dausbox) return;
    return dausbox.get_history().subscribe(setHistory);
  }, [dausbox]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!dausbox) {
    return (
      <div className="terminal">
        <p>loading...</p>
      </div>
    );
  }

  return (
    <div className="terminal">
      {history.map((entry, i) => {
        if ("input" in entry) {
          return (
            <Fragment key={i}>
              {entry.input.split("\n").map((line, j) => (
                <p key={j} className="history-input">
                  <span className="prompt">
                    {j === 0 ? PROMPT : contPrompt(depthOf(line))}
                  </span>
                  {line.trimStart()}
                </p>
              ))}
            </Fragment>
          );
        }
        if ("output" in entry) {
          if (entry.markdown) {
            return (
              <MarkdownBlock key={i} markdown={entry.output} entryIdx={i} />
            );
          } else {
            return <OutputBlock key={i} output={entry.output} entryIdx={i} />;
          }
        }
        return (
          <Fragment key={i}>
            {entry.error.split("\n").map((line, j) => {
              return (
                <p key={j} className="error">
                  {line}
                </p>
              );
            })}
          </Fragment>
        );
      })}
      <InputBuffer dausbox={dausbox} scrollToBottom={scrollToBottom} />
      <div ref={bottomRef} />
    </div>
  );
}
