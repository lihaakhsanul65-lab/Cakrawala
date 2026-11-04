import React, { useState } from 'react';
import { Check, Copy, Code2, Sigma, BookOpen, Lightbulb, ChevronRight } from 'lucide-react';

interface FormattedAiMessageProps {
  content: string;
}

export const FormattedAiMessage: React.FC<FormattedAiMessageProps> = ({ content }) => {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  const handleCopyCode = (codeText: string, idx: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  // Helper to parse inline markdown (bold, italic, inline code)
  const renderInlineFormatted = (text: string) => {
    // Split by inline code first: `code`
    const parts = text.split(/(`[^`]+`)/g);

    return parts.map((part, pIdx) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={pIdx}
            className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-800 font-mono text-[11px] font-semibold border border-blue-200 mx-0.5"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Handle bold **text** and italic *text*
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={pIdx}>
          {boldParts.map((bPart, bIdx) => {
            if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) {
              return (
                <strong key={bIdx} className="font-bold text-slate-900">
                  {bPart.slice(2, -2)}
                </strong>
              );
            }
            // Check italic *text*
            const italicParts = bPart.split(/(\*[^*]+\*)/g);
            return (
              <span key={bIdx}>
                {italicParts.map((iPart, iIdx) => {
                  if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 2) {
                    return (
                      <em key={iIdx} className="italic text-slate-700">
                        {iPart.slice(1, -1)}
                      </em>
                    );
                  }
                  return iPart;
                })}
              </span>
            );
          })}
        </span>
      );
    });
  };

  // Split content by code blocks: ```lang ... ``` and math blocks: $$ ... $$
  const rawBlocks = content.split(/(```[\s\S]*?```|\$\$[\s\S]*?\$\$)/g);

  return (
    <div className="space-y-2.5 text-xs text-slate-800 leading-relaxed font-sans">
      {rawBlocks.map((block, blockIdx) => {
        if (!block) return null;

        // 1. Code Block: ```lang ... ```
        if (block.startsWith('```') && block.endsWith('```')) {
          const lines = block.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const lang = hasLang ? firstLine : 'code';
          const codeBody = (hasLang ? lines.slice(1) : lines).join('\n');

          return (
            <div key={blockIdx} className="my-2 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 text-slate-100 shadow-sm">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-blue-400">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{lang}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(codeBody, blockIdx)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer text-[10px]"
                >
                  {copiedCodeIdx === blockIdx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-[11px] font-mono leading-normal select-all">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        // 2. Math Formula Block: $$ ... $$
        if (block.startsWith('$$') && block.endsWith('$$')) {
          const mathExpr = block.slice(2, -2).trim();
          return (
            <div
              key={blockIdx}
              className="my-2.5 p-3 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-950 flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="p-1 rounded-md bg-blue-600 text-white shrink-0">
                  <Sigma className="w-3.5 h-3.5" />
                </span>
                <span className="font-mono text-xs font-bold tracking-wide select-all text-blue-950">
                  {mathExpr}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(mathExpr, blockIdx)}
                className="shrink-0 p-1 rounded hover:bg-blue-200/60 text-blue-700 transition cursor-pointer"
                title="Salin Rumus"
              >
                {copiedCodeIdx === blockIdx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          );
        }

        // 3. Regular Markdown Lines
        const paragraphLines = block.split('\n');

        return (
          <div key={blockIdx} className="space-y-1.5">
            {paragraphLines.map((line, lIdx) => {
              const trimmed = line.trim();

              if (!trimmed) {
                return <div key={lIdx} className="h-1" />;
              }

              // Divider ---
              if (trimmed === '---' || trimmed === '***') {
                return <hr key={lIdx} className="my-2.5 border-slate-200" />;
              }

              // Headings
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={lIdx} className="font-extrabold text-xs text-blue-950 pt-2 pb-0.5 flex items-center gap-1.5 border-b border-blue-100">
                    <span className="w-1.5 h-3.5 rounded-full bg-blue-600" />
                    <span>{renderInlineFormatted(trimmed.slice(4))}</span>
                  </h4>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={lIdx} className="font-extrabold text-sm text-slate-900 pt-2 pb-0.5 flex items-center gap-1.5 border-b border-slate-200">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>{renderInlineFormatted(trimmed.slice(3))}</span>
                  </h3>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h2 key={lIdx} className="font-black text-sm text-slate-900 pt-1 pb-1">
                    {renderInlineFormatted(trimmed.slice(2))}
                  </h2>
                );
              }

              // Quotes / Callouts: > Note
              if (trimmed.startsWith('> ')) {
                return (
                  <div
                    key={lIdx}
                    className="p-2.5 my-1.5 rounded-r-xl bg-blue-50/70 border-l-4 border-blue-600 text-blue-900 text-xs italic flex items-start gap-2"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5 not-italic" />
                    <div>{renderInlineFormatted(trimmed.slice(2))}</div>
                  </div>
                );
              }

              // Numbered list: 1. 2. 3.
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
              if (numMatch) {
                const num = numMatch[1];
                const text = numMatch[2];
                return (
                  <div key={lIdx} className="flex items-start gap-2.5 py-0.5 pl-1">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-mono shadow-2xs">
                      {num}
                    </span>
                    <div className="flex-1 text-slate-800">
                      {renderInlineFormatted(text)}
                    </div>
                  </div>
                );
              }

              // Bullet points: - or *
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 py-0.5 pl-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-2" />
                    <div className="flex-1 text-slate-800">
                      {renderInlineFormatted(trimmed.slice(2))}
                    </div>
                  </div>
                );
              }

              // Regular paragraph
              return (
                <p key={lIdx} className="leading-relaxed text-slate-800">
                  {renderInlineFormatted(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
