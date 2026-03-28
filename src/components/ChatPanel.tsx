import { useState, useRef, useEffect } from "react";
import { Send, Terminal, Plus, Paperclip, X, Eye, Menu } from "lucide-react";
import type { Message } from "./AICoder";

interface Attachment {
  name: string;
  type: string;
  dataUrl: string;
}

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (input: string, attachments?: Attachment[]) => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onViewCode: (code: string, lang: string) => void;
}

const ChatPanel = ({ messages, isLoading, onSend, onNewChat, onToggleSidebar, onViewCode }: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    onSend(input.trim(), attachments.length > 0 ? attachments : undefined);
    setInput("");
    setAttachments([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [...prev, { name: file.name, type: file.type, dataUrl: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col w-[420px] min-w-[360px] border-r border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button onClick={onToggleSidebar} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Menu className="w-4 h-4" />
        </button>
        <Terminal className="w-5 h-5 text-primary" />
        <h1 className="text-sm font-semibold tracking-wider uppercase text-primary" style={{ fontFamily: "var(--font-mono)" }}>
          AI Coder
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted" style={{ fontFamily: "var(--font-mono)" }}>
            pollinations.ai
          </span>
          <button onClick={onNewChat} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="新增對話">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
            <Terminal className="w-12 h-12 mb-3 text-primary opacity-40" />
            <p className="text-sm" style={{ fontFamily: "var(--font-mono)" }}>
              告訴我你想要建造什麼...
            </p>
            <p className="text-xs mt-1 text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
              支援所有程式語言
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`animate-fade-in ${msg.role === "user" ? "flex justify-end" : ""}`}>
            <div
              className={`max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-secondary-foreground"
              }`}
              style={{ fontFamily: "var(--font-mono)", fontSize: "12px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {msg.role === "assistant" ? (
                <AssistantMessage content={msg.content} onViewCode={onViewCode} />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2 text-primary text-xs" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="animate-blink">▊</span> 正在思考中...
          </div>
        )}
      </div>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 border-t border-border flex gap-2 flex-wrap">
          {attachments.map((a, i) => (
            <div key={i} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs text-secondary-foreground">
              {a.type.startsWith("image/") ? (
                <img src={a.dataUrl} alt={a.name} className="w-6 h-6 rounded object-cover" />
              ) : (
                <Paperclip className="w-3 h-3" />
              )}
              <span className="truncate max-w-[80px]" style={{ fontFamily: "var(--font-mono)" }}>{a.name}</span>
              <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border">
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,.txt,.js,.ts,.py,.html,.css,.json,.md,.csv,.xml"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-primary transition-colors"
            title="上傳檔案"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <span className="text-primary text-sm" style={{ fontFamily: "var(--font-mono)" }}>{">"}</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="描述你想要的程式..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          />
          <button
            type="submit"
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className="text-primary hover:text-accent disabled:opacity-30 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

function AssistantMessage({ content, onViewCode }: { content: string; onViewCode: (code: string, lang: string) => void }) {
  // Split content into text and code blocks
  const parts: { type: "text" | "code"; content: string; lang?: string }[] = [];
  const regex = /```(\w*)\s*\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "code", content: match[2].trim(), lang: match[1] || "text" });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  if (parts.length === 0) return <>{content}</>;

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === "text") {
          return <span key={i}>{part.content}</span>;
        }
        return (
          <div key={i} className="my-2">
            <div className="flex items-center justify-between bg-background/50 rounded-t px-2 py-1">
              <span className="text-[10px] text-muted-foreground uppercase">{part.lang}</span>
              <button
                onClick={() => onViewCode(part.content, part.lang || "text")}
                className="flex items-center gap-1 text-[10px] text-primary hover:text-accent transition-colors"
              >
                <Eye className="w-3 h-3" /> 查看
              </button>
            </div>
            <pre className="bg-background/30 rounded-b px-2 py-1 text-[11px] max-h-[120px] overflow-hidden text-muted-foreground">
              <code>{part.content.slice(0, 200)}{part.content.length > 200 ? "..." : ""}</code>
            </pre>
          </div>
        );
      })}
    </>
  );
}

export default ChatPanel;
