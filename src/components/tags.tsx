export type Node = string | React.JSX.Element;

type TagRenderer = (json: unknown, key: string) => React.JSX.Element;

interface LinkData {
  link: string;
  display: string;
}

interface ImageData {
  src: string;
  alt?: string;
  height?: number;
  width?: number;
}

interface InvertData {
  content: string
}

interface UnderlineData {
  content: string
}


const TAG_REGISTRY: Record<string, TagRenderer> = {
  link: (json, key) => {
    if (typeof json !== "object" || json === null) throw new Error("Invalid JSON");
    if (!("link" in json)) throw new Error("Missing link");
    if (!("display" in json)) throw new Error("Missing display");
    const { link: href, display } = json as LinkData;
    return <a key={key} href={href} target="_blank" rel="noopener noreferrer">{display}</a>;
  },
  image: (json, key) => {
    if (typeof json !== "object" || json === null) throw new Error("Invalid JSON");
    if (!("src" in json)) throw new Error("Missing src");
    const { src, alt, height, width } = json as ImageData;
    return <img key={key} src={src} alt={alt ?? ""} style={{ height: `${height ?? 1}em`, width: `${width ?? 1}em` }} />;
  },
  invert: (json, key) => {
    if  (typeof json !== "object" || json === null ) throw new Error("Invalid JSON");
    if (!("content" in json)) throw new Error("Missing content");
    const { content } = json as InvertData;
    return <span className="invert" key={key}>{content}</span>;
  },
  underline: (json, key) => {
    if (typeof json !== "object" || json === null) throw new Error("Invalid JSON");
    if (!("content" in json)) throw new Error("Missing content");
    const { content } = json as UnderlineData;
    return <span key={key} style={{ textDecoration: "underline" }}>{content}</span>;
  },
};

export function registerTagRenderer(tagName: string, renderer: TagRenderer) {
  TAG_REGISTRY[tagName] = renderer;
};

export function constructNode(tag: string, jsonString: string, key: string): Node {
  const renderer = TAG_REGISTRY[tag];
  if (!renderer) return `$$${tag}:${jsonString}$$`; // unknown tag, render literally
  const json = JSON.parse(jsonString);
  return renderer(json, key);
}
