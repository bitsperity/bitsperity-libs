/**
 * Dependency-free, safe, lightweight Markdown rendering (subset).
 * - Escapes HTML by default
 * - Supports: headings, bold/italic, inline code, code blocks, links, lists, paragraphs
 */

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(md: string): string {
  // inline code
  md = md.replace(/`([^`]+)`/g, (_m, p1) => `<code>${escapeHtml(p1)}</code>`);
  // bold **text**
  md = md.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // italic *text*
  md = md.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // links [text](url)
  md = md.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (_m, text, url) => {
    const safeText = escapeHtml(text);
    const safeUrl = escapeHtml(url);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer nofollow">${safeText}</a>`;
  });
  return md;
}

export async function renderMarkdownSafe(markdown: string | null | undefined): Promise<string> {
  try {
    const src = String(markdown ?? '').replace(/\r\n?/g, '\n');
    if (!src.trim()) return '';

    // handle fenced code blocks ```lang\n...\n```
    let html = '';
    const lines = src.split('\n');
    let i = 0;
    let inCode = false;
    let codeBuffer: string[] = [];

    const flushParagraph = (buffer: string[]) => {
      const text = buffer.join(' ').trim();
      if (!text) return '';
      return `<p>${renderInline(escapeHtml(text))}</p>`;
    };

    let pBuffer: string[] = [];
    let listBuffer: string[] = [];

    const flushList = () => {
      if (listBuffer.length === 0) return '';
      const items = listBuffer.map((li) => `<li>${renderInline(escapeHtml(li))}</li>`).join('');
      listBuffer = [];
      return `<ul>${items}</ul>`;
    };

    while (i < lines.length) {
      const line = lines[i];

      // fenced code
      if (line.trim().startsWith('```')) {
        if (!inCode) {
          inCode = true; codeBuffer = []; i++; continue;
        } else {
          const code = escapeHtml(codeBuffer.join('\n'));
          html += flushParagraph(pBuffer); pBuffer = [];
          html += flushList();
          html += `<pre><code>${code}</code></pre>`;
          inCode = false; codeBuffer = []; i++; continue;
        }
      }
      if (inCode) { codeBuffer.push(line); i++; continue; }

      // headings
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        const level = h[1].length;
        const content = renderInline(escapeHtml(h[2]));
        html += flushParagraph(pBuffer); pBuffer = [];
        html += flushList();
        html += `<h${level}>${content}</h${level}>`;
        i++; continue;
      }

      // lists
      const li = line.match(/^\s*[-*+]\s+(.*)$/);
      if (li) {
        html += flushParagraph(pBuffer); pBuffer = [];
        listBuffer.push(li[1]);
        i++; continue;
      }

      // blank line → flush paragraph/list
      if (line.trim() === '') {
        html += flushParagraph(pBuffer); pBuffer = [];
        html += flushList();
        i++; continue;
      }

      pBuffer.push(line.trim());
      i++;
    }

    // flush tail
    html += flushParagraph(pBuffer);
    html += flushList();

    return html;
  } catch {
    return '';
  }
}


