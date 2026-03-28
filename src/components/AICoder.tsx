import { useState, useRef, useEffect } from "react";
import ChatPanel from "./ChatPanel";
import CodePreview from "./CodePreview";
import { streamPollinationsAI } from "@/lib/pollinations";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are an expert web developer AI. When the user asks you to build something, respond ONLY with the complete HTML code (including inline CSS and JS in a single HTML file). Do not add any explanation text outside the code. Wrap everything in a single \`\`\`html code block. If the user asks a question that isn't about coding, answer briefly then offer to build something.`;

const AICoder = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  const extractCode = (text: string): string => {
    const match = text.match(/```html\s*([\s\S]*?)```/);
    if (match) return match[1].trim();
    const anyMatch = text.match(/```[\s\S]*?\n([\s\S]*?)```/);
    if (anyMatch) return anyMatch[1].trim();
    if (text.includes("<!DOCTYPE") || text.includes("<html") || text.includes("<div")) {
      return text.trim();
    }
    return "";
  };

  const handleSend = async (input: string) => {
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = "";

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

      const code = extractCode(assistantContent);
      if (code) setGeneratedCode(code);
    };

    try {
      await streamPollinationsAI({
        messages: [
          { role: "system" as const, content: SYSTEM_PROMPT },
          ...messages,
          userMsg,
        ],
        onDelta: updateAssistant,
        onDone: () => setIsLoading(false),
      });
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ 發生錯誤，請稍後再試。" },
      ]);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
      <ChatPanel
        messages={messages}
        isLoading={isLoading}
        onSend={handleSend}
      />
      <CodePreview code={generatedCode} />
    </div>
  );
};

export default AICoder;
