import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import "../styles/markdown.css";

export default function MarkdownBlock({
  markdown,
  entryIdx,
}: {
  markdown: string;
  entryIdx: number;
}) {
  const key = `out-md-${entryIdx}`;
  const [isOpen, setIsOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>("none");

  const firstLine = markdown.split("\n")[0];
  markdown = markdown.substring(firstLine.length + 1); // remove first line from markdown text for header

  useEffect(() => {
    if (contentRef.current) {
      setMaxHeight(isOpen ? `${contentRef.current.scrollHeight}px` : "0px");
    }
  }, [isOpen, markdown]);

  return (
    <div className="markdown">
      <div className="markdown-header" onClick={() => setIsOpen(!isOpen)}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{firstLine}</ReactMarkdown>
        <span className={`markdown-caret ${isOpen ? "open" : ""}`}>▶</span>
      </div>

      <div className="markdown-content" style={{ maxHeight }} ref={contentRef}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} key={key}>
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
