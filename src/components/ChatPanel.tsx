import { useState, useRef, useEffect } from "react";
import { Send, Terminal } from "lucide-react";
import type { Message } from "./AICoder";

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (input: string) => void;
}

const ChatPanel = ({ messages, isLoading, onSend }: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col w-[420px] min-w-[360px] border-r border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Terminal className="w-5 h-5 text-primary" />
        <h1 className="text-sm font-semibold tracking-wider uppercase text-primary" style={{ fontFamily: "var(--font-mono)" }}>
          AI Coder
        </h1>
        <span className="ml-auto text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted" style={{ fontFamily: "var(--font-mono)" }}>
          pollinations.ai
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
            <Terminal className="w-12 h-12 mb-3 text-primary opacity-40" />
            <p className="text-sm" style={{ fontFamily: "var(--font-mono)" }}>
              告訴我你想要建造什麼...
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
              {msg.role === "assistant" ? formatAssistantMessage(msg.content) : msg.content}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2 text-primary text-xs" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="animate-blink">▊</span> 正在思考中...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border">
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
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
            disabled={!input.trim() || isLoading}
            className="text-primary hover:text-accent disabled:opacity-30 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

function formatAssistantMessage(content: string): string {
  // Hide the raw code block in chat, show a short label instead
  return content.replace(/```html[\s\S]*?```/g, "✅ 程式碼已生成 → 查看右側預覽");
}

export default ChatPanel;
