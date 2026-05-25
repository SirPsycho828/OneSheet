import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../../src/lib/markdown";

describe("renderMarkdown", () => {
  it("renders h1", async () => {
    const html = await renderMarkdown("# Heading");
    expect(html).toContain("<h1>Heading</h1>");
  });

  it("renders h2", async () => {
    const html = await renderMarkdown("## Heading Two");
    expect(html).toContain("<h2>Heading Two</h2>");
  });

  it("renders h3", async () => {
    const html = await renderMarkdown("### Heading Three");
    expect(html).toContain("<h3>Heading Three</h3>");
  });

  it("renders bold text", async () => {
    const html = await renderMarkdown("**bold**");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("renders italic text", async () => {
    const html = await renderMarkdown("*italic*");
    expect(html).toContain("<em>italic</em>");
  });

  it("renders unordered list", async () => {
    const html = await renderMarkdown("- item");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>item</li>");
    expect(html).toContain("</ul>");
  });

  it("renders ordered list", async () => {
    const html = await renderMarkdown("1. item");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>item</li>");
    expect(html).toContain("</ol>");
  });

  it("renders anchor links", async () => {
    const html = await renderMarkdown("[link](https://example.com)");
    expect(html).toContain('<a href="https://example.com">link</a>');
  });

  it("renders horizontal rule", async () => {
    const html = await renderMarkdown("---");
    expect(html).toContain("<hr>");
  });

  it("renders GFM table with thead, tbody, tr, th, td", async () => {
    const md = `| A | B |\n| --- | --- |\n| 1 | 2 |`;
    const html = await renderMarkdown(md);
    expect(html).toContain("<table>");
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    expect(html).toContain("<tr>");
    expect(html).toContain("<th>");
    expect(html).toContain("<td>");
  });

  it("strips images (no <img> in output)", async () => {
    const html = await renderMarkdown("![image](https://example.com/img.png)");
    expect(html).not.toContain("<img");
  });

  it("strips fenced code blocks (no <pre> or <code>)", async () => {
    const html = await renderMarkdown("```\nconst x = 1;\n```");
    expect(html).not.toContain("<pre");
    expect(html).not.toContain("<code");
  });

  it("strips blockquotes (no <blockquote>)", async () => {
    const html = await renderMarkdown("> a quote");
    expect(html).not.toContain("<blockquote");
  });

  it("strips raw <script> tags", async () => {
    const html = await renderMarkdown(
      "<script>alert('xss')</script> safe text"
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(");
  });

  it("returns empty string for empty input", async () => {
    const html = await renderMarkdown("");
    expect(html).toBe("");
  });

  it("double newline produces separate paragraphs", async () => {
    const html = await renderMarkdown("First paragraph\n\nSecond paragraph");
    expect(html).toContain("<p>First paragraph</p>");
    expect(html).toContain("<p>Second paragraph</p>");
  });

  it("remark-breaks: single newline produces <br>", async () => {
    const html = await renderMarkdown("line one\nline two");
    expect(html).toContain("<br>");
  });
});
