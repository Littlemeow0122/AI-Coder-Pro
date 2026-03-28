import { useState, useCallback } from "react";
import ChatPanel from "./ChatPanel";
import CodePreview from "./CodePreview";
import ChatHistory from "./ChatHistory";
import { streamPollinationsAI } from "@/lib/pollinations";
import { loadSessions, saveSession, deleteSession, newSessionId, type ChatSession } from "@/lib/chatHistory";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are an expert developer AI. When the user asks you to build or write code, respond with the complete code wrapped in a fenced code block with the language identifier (e.g. \`\`\`html, \`\`\`python, \`\`\`javascript, \`\`\`css, \`\`\`typescript, \`\`\`java, etc.). You can generate code in ANY programming language. If the code is a complete HTML file, use \`\`\`html. If the user asks a question that isn't about coding, answer briefly then offer to build something. If the user shares an image or file, analyze it and respond helpfully.`;

const AICoder = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => newSessionId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const extractCode = (text: string): { code: string; lang: string } => {
    const match = text.match(/```(\w+)\s*\n([\s\S]*?)```/);
    if (match) return { lang: match[1], code: match[2].trim() };
    const anyMatch = text.match(/```\s*\n?([\s\S]*?)```/);
    if (anyMatch) return { lang: "text", code: anyMatch[1].trim() };
    if (text.includes("<!DOCTYPE") || text.includes("<html")) {
      return { lang: "html", code: text.trim() };
    }
    return { lang: "", code: "" };
  };

  const persistSession = useCallback((id: string, msgs: Message[]) => {
    const existing = sessions.find((s) => s.id === id);
    const title = msgs.find((m) => m.role === "user")?.content.slice(0, 40) || "新對話";
    const session: ChatSession = {
      id,
      title,
      messages: msgs,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    saveSession(session);
    setSessions(loadSessions());
  }, [sessions]);

  const handleSend = async (input: string, attachments?: { name: string; type: string; dataUrl: string }[]) => {
    let content = input;
    if (attachments?.length) {
      const fileDescs = attachments.map((a) => `[附件: ${a.name} (${a.type})]`).join("\n");
      content = `${input}\n\n${fileDescs}`;
    }

    const userMsg: Message = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    let assistantContent = "";

    const apiMessages: { role: "system" | "user" | "assistant"; content: string | any[] }[] = [
      { role: "system" as const, content: SYSTEM_PROMPT },
    ];

    // Build message history for API
    for (const msg of newMessages) {
      if (msg.role === "user") {
        apiMessages.push({ role: "user", content: msg.content });
      } else {
        apiMessages.push({ role: "assistant", content: msg.content });
      }
    }

    // If there are image attachments, modify the last user message to include image URLs
    if (attachments?.length) {
      const imageAttachments = attachments.filter((a) => a.type.startsWith("image/"));
      if (imageAttachments.length > 0) {
        const lastUserIdx = apiMessages.length - 1;
        const parts: any[] = [{ type: "text", text: input }];
        for (const img of imageAttachments) {
          parts.push({ type: "image_url", image_url: { url: img.dataUrl } });
        }
        apiMessages[lastUserIdx] = { role: "user", content: parts };
      }
    }

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });

      const { code, lang } = extractCode(assistantContent);
      if (code) {
        setGeneratedCode(code);
        setCodeLanguage(lang);
      }
    };

    try {
      await streamPollinationsAI({
        messages: apiMessages,
        onDelta: updateAssistant,
        onDone: () => {
          setIsLoading(false);
          const finalMsgs = [...newMessages, { role: "assistant" as const, content: assistantContent }];
          setMessages(finalMsgs);
          persistSession(currentSessionId, finalMsgs);
        },
      });
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      const errorMsg: Message = { role: "assistant", content: "⚠️ 發生錯誤，請稍後再試。" };
      const finalMsgs = [...newMessages, errorMsg];
      setMessages(finalMsgs);
      persistSession(currentSessionId, finalMsgs);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(newSessionId());
    setMessages([]);
    setGeneratedCode("");
    setCodeLanguage("");
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    // Try to extract last code from messages
    for (let i = session.messages.length - 1; i >= 0; i--) {
      const msg = session.messages[i];
      if (msg.role === "assistant") {
        const { code, lang } = extractCode(msg.content);
        if (code) {
          setGeneratedCode(code);
          setCodeLanguage(lang);
          break;
        }
      }
    }
    setSidebarOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    setSessions(loadSessions());
    if (id === currentSessionId) handleNewChat();
  };

  const handleViewCode = (code: string, lang: string) => {
    setGeneratedCode(code);
    setCodeLanguage(lang);
  };

  return (
    <div className="flex h-screen bg-background text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
      <ChatHistory
        sessions={sessions}
        currentSessionId={currentSessionId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSelect={handleSelectSession}
        onDelete={handleDeleteSession}
        onNewChat={handleNewChat}
      />
      <ChatPanel
        messages={messages}
        isLoading={isLoading}
        onSend={handleSend}
        onNewChat={handleNewChat}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onViewCode={handleViewCode}
      />
      <CodePreview code={generatedCode} language={codeLanguage} />
    </div>
  );
};

export default AICoder;
