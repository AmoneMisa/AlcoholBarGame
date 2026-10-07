// System mail text: line breaks, **bold** and `code` (tap to copy). Parsed into plain segments, never injected as HTML.
export type MailPiece = { kind: 'text' | 'bold' | 'code'; text: string };

export function mailPieces(text: string): MailPiece[] {
  const out: MailPiece[] = [];
  let last = 0;
  for (const match of text.matchAll(/\*\*(.+?)\*\*|`([^`\n]+)`/g)) {
    if (match.index > last) out.push({ kind: 'text', text: text.slice(last, match.index) });
    out.push(match[1] !== undefined ? { kind: 'bold', text: match[1] } : { kind: 'code', text: match[2]! });
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
  return out;
}
