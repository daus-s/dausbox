import { parseInline } from "./parseInline";

export default function OutputBlock({ output, entryIdx }: { output: string; entryIdx: number }) {
  return (
    <>
      {output.split("\n").map((line, lineIdx) => {
        const key = `out-${entryIdx}-${lineIdx}`;
        return (
          <p key={key} className="output-line">
            {parseInline(line, key)}
          </p>
        );
      })}
    </>
  );
}
