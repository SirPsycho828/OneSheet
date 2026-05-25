import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import type { Schema } from "hast-util-sanitize";

// Custom sanitization schema: allow only resume-relevant HTML elements.
// Elements not in tagNames have their children kept (unwrapped).
// Elements in `strip` have both the element and its children removed.
// img, pre, code, blockquote are excluded from tagNames so their content is
// unwrapped; they are also added to `strip` to drop their content entirely.
const sanitizeSchema: Schema = {
  tagNames: [
    "h1",
    "h2",
    "h3",
    "p",
    "strong",
    "em",
    "a",
    "ul",
    "ol",
    "li",
    "hr",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "br",
    "del",
  ],
  attributes: {
    a: ["href", "title"],
    th: ["align"],
    td: ["align"],
  },
  protocols: {
    href: ["http", "https", "mailto"],
  },
  // Strip these elements AND their children entirely (no content pass-through)
  strip: ["script", "style", "img", "pre", "code", "blockquote"],
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkBreaks)
  .use(remarkRehype)
  .use(rehypeSanitize, sanitizeSchema)
  .use(rehypeStringify);

export async function renderMarkdown(markdown: string): Promise<string> {
  if (markdown === "") return "";
  const result = await processor.process(markdown);
  return String(result);
}
