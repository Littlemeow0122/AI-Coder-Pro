import { useState } from "react";
import { Code, Eye, Copy, Check } from "lucide-react";

interface CodePreviewProps {
  code: string;
}

const CodePreview = ({ code }: CodePreviewProps) => {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex gap-1">
          <button
            onClick={() => setTab("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
              tab === "preview"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <Eye className="w-3.5 h-3.5" /> 預覽
          </button>
          <button
            onClick={() => setTab("code")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
              tab === "code"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <Code className="w-3.5 h-3.5" /> 程式碼
          </button>
        </div>
        {code && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-primary transition-colors"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "已複製" : "複製"}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {!code ? (
          <div className="flex items-center justify-center h-full text-muted-foreground opacity-40">
            <div className="text-center">
              <Code className="w-16 h-16 mx-auto mb-4 text-primary opacity-30" />
              <p className="text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                等待生成程式碼...
              </p>
            </div>
          </div>
        ) : tab === "preview" ? (
          <iframe
            srcDoc={code}
            className="w-full h-full border-0 bg-white rounded-none"
            sandbox="allow-scripts allow-modals"
            title="Preview"
          />
        ) : (
          <pre className="w-full h-full overflow-auto p-4 text-xs leading-relaxed text-secondary-foreground scrollbar-thin" style={{ fontFamily: "var(--font-mono)" }}>
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
};

export default CodePreview;
