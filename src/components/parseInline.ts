import { constructNode, type Node } from "./tags";

function findJsonEnd(line: string, start: number): number {
  let depth = 0, inString = false, escaped = false, j = start;
  while (j < line.length) {
    const c = line[j];
    if (escaped) escaped = false;
    else if (c === "\\") escaped = true;
    else if (c === '"') inString = !inString;
    else if (!inString) {
      if (c === "{") depth++;
      else if (c === "}" && --depth === 0) return j + 1;
    }
    j++;
  }
  return -1;
}

export function parseInline(line: string, keyPrefix: string): Node[] {
  const nodes: Node[] = [];
  let i = 0, textStart = 0, tagIdx = 0;

  while (i < line.length) {
    if (line[i] === "$" && line[i + 1] === "$") {
      const colonIdx = line.indexOf(":", i + 2);
      if (colonIdx !== -1) {
        const jsonStart = colonIdx + 1;
        const end = findJsonEnd(line, jsonStart);
        if (end !== -1 && line.slice(end, end + 2) === "$$") {
          const tag = line.slice(i + 2, colonIdx);
          const jsonString = line.slice(jsonStart, end);
          try {
            const node = constructNode(tag, jsonString, `${keyPrefix}-${tagIdx++}`);
            if (i > textStart) nodes.push(line.slice(textStart, i));
            nodes.push(node);
            i = end + 2;
            textStart = i;
            continue;
          } catch (e) {
            console.error("Tag parse error:", e);
          }
        }
      }
    }
    i++;
  }

  if (textStart < line.length) nodes.push(line.slice(textStart));
  return nodes;
}
