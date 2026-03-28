import { MessageSquare, Plus, Trash2, X } from "lucide-react";
import type { ChatSession } from "@/lib/chatHistory";

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (session: ChatSession) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
}

const ChatHistory = ({ sessions, currentSessionId, isOpen, onToggle, onSelect, onDelete, onNewChat }: ChatHistoryProps) => {
  if (!isOpen) return null;

  return (
    <div className="flex flex-col w-[260px] min-w-[220px] border-r border-border bg-sidebar-background">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground" style={{ fontFamily: "var(--font-mono)" }}>
          聊天記錄
        </span>
        <div className="flex gap-1">
          <button onClick={onNewChat} className="p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground transition-colors" title="新增對話">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={onToggle} className="p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {sessions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8" style={{ fontFamily: "var(--font-mono)" }}>
            還沒有聊天記錄
          </p>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`group flex items-center gap-2 px-2 py-2 rounded cursor-pointer text-xs transition-colors ${
              s.id === currentSessionId
                ? "bg-primary/15 text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
            onClick={() => onSelect(s)}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate flex-1" style={{ fontFamily: "var(--font-mono)" }}>
              {s.title}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;
