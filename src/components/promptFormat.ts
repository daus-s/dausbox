export const INDENT = "  ";
export const PROMPT = "dausbox> ";
const BASE_DOTS = ".".repeat(PROMPT.length - 1);

export const contPrompt = (d: number) => BASE_DOTS + "..".repeat(d) + " ";
export const depthOf = (line: string) => (line.length - line.trimStart().length) / INDENT.length;

export function expandForEdit(raw: string) {
  const rawLines = raw.split("\n");
  const lockedLines = rawLines.slice(0, -1).map(l => INDENT.repeat(depthOf(l)) + l.trimStart());
  const lastLine = rawLines[rawLines.length - 1];
  return {
    lockedLines,
    buffer: lastLine.trimStart(),
    depth: depthOf(lastLine),
  };
}

export function recallCaret(oldCaretIdx: number, oldBuffer: string, newBuffer: string) {
  return oldCaretIdx === oldBuffer.length ? newBuffer.length : Math.min(oldCaretIdx, newBuffer.length);
}
