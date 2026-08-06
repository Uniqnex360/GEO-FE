export { streamApi } from "../../api/streamAPI";

export type Log = {
  color: string;
  message: string;
};

function parseInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function SimpleMarkdownRenderer({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2 text-slate-800 text-sm font-sans leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) {
          return (
            <h4
              key={i}
              className="text-base font-bold text-slate-900 pt-3 pb-1"
            >
              {line.replace("### ", "")}
            </h4>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h3
              key={i}
              className="text-lg font-bold text-slate-900 pt-4 pb-1 border-b border-slate-100"
            >
              {line.replace("## ", "")}
            </h3>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h2
              key={i}
              className="text-xl font-extrabold text-slate-900 pt-4 pb-2"
            >
              {line.replace("# ", "")}
            </h2>
          );
        }
        if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
          const cleanLine = line.trim().replace(/^[\*\-]\s+/, "");
          return (
            <ul key={i} className="list-disc pl-5 my-1">
              <li>{parseInlineMarkdown(cleanLine)}</li>
            </ul>
          );
        }
        return line.trim() === "" ? (
          <div key={i} className="h-2" />
        ) : (
          <p key={i}>{parseInlineMarkdown(line)}</p>
        );
      })}
    </div>
  );
}
