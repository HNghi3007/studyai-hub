"use client";

import { useState, useRef, useEffect } from "react";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import FloatingActionMenu from "@/components/ui/floating-action-menu";
import {
  Paperclip, X, FileText, FileImage, FileCode, File,
  Download, Copy, Check, Plus, Trash2, MessageSquare,
  PanelLeftClose, PanelLeftOpen, Mic, MessageSquarePlus, ImagePlus,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UploadedFile {
  name: string;
  type: string;
  content: string;
  isImage: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  files?: UploadedFile[];
  generatedImage?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function generateTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "Cuộc trò chuyện mới";
  const text = first.content ?? "Cuộc trò chuyện mới";
  return text.slice(0, 40) + (text.length > 40 ? "..." : "");
}

const LANG_EXT: Record<string, string> = {
  python: "py", py: "py", javascript: "js", js: "js",
  typescript: "ts", ts: "ts", tsx: "tsx", jsx: "jsx",
  html: "html", css: "css", java: "java", cpp: "cpp",
  c: "c", go: "go", rust: "rs", php: "php",
  json: "json", yaml: "yml", yml: "yml", sql: "sql",
  bash: "sh", sh: "sh", markdown: "md", md: "md", txt: "txt",
};

function getExt(lang: string) {
  return LANG_EXT[lang.toLowerCase()] ?? "txt";
}

// ─── Components ──────────────────────────────────────────────────────────────

function FileIcon({ type }: { type: string }) {
  if (type.startsWith("image/")) return <FileImage className="w-4 h-4" />;
  if (type.includes("pdf") || type.includes("word")) return <FileText className="w-4 h-4" />;
  if (type.includes("json") || type.includes("javascript") || type.includes("typescript")) return <FileCode className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const ext = getExt(lang);
  const fileName = `code.${ext}`;

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-[#333] bg-[#0d0d0d]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a1a] border-b border-[#333]">
        <span className="text-xs text-gray-400 font-mono">{lang || "code"}</span>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded hover:bg-[#2a2a2a] transition-colors">
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={handleDownload} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded hover:bg-[#2a2a2a] transition-colors">
            <Download className="w-3 h-3" />
            {fileName}
          </button>
        </div>
      </div>
      <pre className="p-3 overflow-x-auto text-xs text-gray-200 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\w]*\n[\s\S]*?```)/g);
  return (
    <div>
      {parts.map((part, i) => {
        const m = part.match(/^```([\w]*)\n([\s\S]*?)```$/);
        if (m) return <CodeBlock key={i} lang={m[1] || "txt"} code={m[2]} />;
        return <span key={i} className="whitespace-pre-wrap">{part}</span>;
      })}
    </div>
  );
}

function EditableSession({ session, isActive, onSelect, onDelete, onRename }: {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(session.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setValue(session.title);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editing, session.title]);

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (trimmed) onRename(trimmed);
    setEditing(false);
  };

  return (
    <div
      onClick={() => { if (!editing) onSelect(); }}
      onDoubleClick={() => setEditing(true)}
      className={`group flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer transition-all ${
        isActive
          ? "bg-gray-200 text-gray-900 dark:bg-[#2a2a2a] dark:text-white"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#1a1a1a] dark:hover:text-white"
      }`}
    >
      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleConfirm}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
            if (e.key === "Escape") setEditing(false);
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-xs bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-white rounded px-1.5 py-0.5 outline-none border border-gray-300 dark:border-[#555] min-w-0"
        />
      ) : (
        <span className="text-xs truncate flex-1">{session.title}</span>
      )}
      {!editing && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-all flex-shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ─── Voice Modal ─────────────────────────────────────────────────────────────

function VoiceModal({ onClose, onSend }: { onClose: () => void; onSend: (msg: string) => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1F2023] rounded-3xl p-8 border border-[#333] w-96 z-10">
        <h3 className="text-white text-center font-semibold mb-1">Voice Input</h3>
        <p className="text-gray-500 text-xs text-center mb-4">Nhấn mic để bắt đầu, nhấn lại để dừng & gửi</p>
        <AIVoiceInput
          onStart={() => console.log("Recording started")}
          onStop={(duration) => {
            if (duration > 0) onSend(`[Voice message - ${duration}s]`);
            onClose();
          }}
        />
        <button onClick={onClose} className="w-full mt-2 text-gray-500 hover:text-white text-sm transition-colors py-2">
          Đóng
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"chat" | "image">("chat");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showVoice, setShowVoice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("chat_sessions");
    if (saved) {
      try {
        const parsed: ChatSession[] = JSON.parse(saved);
        if (parsed.length > 0) {
          setSessions(parsed);
          setCurrentId(parsed[0].id);
          setMessages(parsed[0].messages);
          return;
        }
      } catch { /* ignore */ }
    }
    const first: ChatSession = { id: generateId(), title: "Cuộc trò chuyện mới", messages: [], createdAt: Date.now() };
    setSessions([first]);
    setCurrentId(first.id);
    localStorage.setItem("chat_sessions", JSON.stringify([first]));
  }, []);

  useEffect(() => {
    if (!currentId || messages.length === 0) return;
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === currentId ? { ...s, messages, title: generateTitle(messages) } : s
      );
      localStorage.setItem("chat_sessions", JSON.stringify(updated));
      return updated;
    });
  }, [messages, currentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createNewChat = () => {
    const s: ChatSession = { id: generateId(), title: "Cuộc trò chuyện mới", messages: [], createdAt: Date.now() };
    setSessions((prev) => {
      const updated = [s, ...prev];
      localStorage.setItem("chat_sessions", JSON.stringify(updated));
      return updated;
    });
    setCurrentId(s.id);
    setMessages([]);
  };

  const switchChat = (id: string) => {
    const s = sessions.find((x) => x.id === id);
    if (s) { setCurrentId(id); setMessages(s.messages); }
  };

  const deleteChat = (id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem("chat_sessions", JSON.stringify(updated));
      if (id === currentId) {
        if (updated.length > 0) {
          setCurrentId(updated[0].id);
          setMessages(updated[0].messages);
        } else {
          const fresh: ChatSession = { id: generateId(), title: "Cuộc trò chuyện mới", messages: [], createdAt: Date.now() };
          setCurrentId(fresh.id);
          setMessages([]);
          localStorage.setItem("chat_sessions", JSON.stringify([fresh]));
          return [fresh];
        }
      }
      return updated;
    });
  };

  const renameChat = (id: string, newTitle: string) => {
    setSessions((prev) => {
      const updated = prev.map((s) => s.id === id ? { ...s, title: newTitle } : s);
      localStorage.setItem("chat_sessions", JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllHistory = () => {
    if (!window.confirm("Xóa toàn bộ lịch sử chat? Không thể hoàn tác.")) return;
    const fresh: ChatSession = { id: generateId(), title: "Cuộc trò chuyện mới", messages: [], createdAt: Date.now() };
    setSessions([fresh]);
    setCurrentId(fresh.id);
    setMessages([]);
    localStorage.setItem("chat_sessions", JSON.stringify([fresh]));
  };

  const readFile = (file: File): Promise<UploadedFile> =>
    new Promise((resolve, reject) => {
      const isImage = file.type.startsWith("image/");
      const reader = new FileReader();
      if (isImage) reader.readAsDataURL(file);
      else reader.readAsText(file);
      reader.onload = () => resolve({ name: file.name, type: file.type, content: reader.result as string, isImage });
      reader.onerror = reject;
    });

  const handleFileUpload = async (files: FileList) => {
    const processed = await Promise.all(Array.from(files).slice(0, 5).map(readFile));
    setUploadedFiles((prev) => [...prev, ...processed].slice(0, 5));
  };

  const handleSend = async (message: string) => {
    if (!message.trim() && uploadedFiles.length === 0) return;
    setIsLoading(true);

    if (mode === "image") {
      setMessages((prev) => [...prev, { role: "user", content: `${message}` }]);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: message }], mode: "image" }),
        });
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          data.imageUrl
            ? { role: "assistant", content: "", generatedImage: data.imageUrl }
            : { role: "assistant", content: "Không thể tạo ảnh. Thử lại nhé." },
        ]);
      } catch {
        setMessages((prev) => [...prev, { role: "assistant", content: "Lỗi kết nối." }]);
      } finally { setIsLoading(false); }
      return;
    }

    const hasImages = uploadedFiles.some((f) => f.isImage);
    let apiMessages;

    if (hasImages) {
      const parts: object[] = [];
      if (message) parts.push({ type: "text", text: message });
      uploadedFiles.forEach((f) => {
        if (f.isImage) parts.push({ type: "image_url", image_url: { url: f.content } });
        else parts.push({ type: "text", text: `[File: ${f.name}]\n\`\`\`\n${f.content.slice(0, 3000)}\n\`\`\`` });
      });
      apiMessages = [...messages.map((m) => ({ role: m.role, content: m.content })), { role: "user", content: parts }];
    } else {
      const fileParts = uploadedFiles.map((f) =>
        `[File: ${f.name}]\n\`\`\`\n${f.content.slice(0, 3000)}${f.content.length > 3000 ? "\n...(cắt bớt)" : ""}\n\`\`\``
      );
      const apiContent = [message, ...fileParts].filter(Boolean).join("\n\n");
      apiMessages = [...messages.map((m) => ({ role: m.role, content: m.content })), { role: "user", content: apiContent }];
    }

    const userMsg: Message = {
      role: "user",
      content: message || "Phân tích file này.",
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setUploadedFiles([]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "Không có phản hồi." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Lỗi kết nối." }]);
    } finally { setIsLoading(false); }
  };

  return (
    <>
      {showVoice && (
        <VoiceModal
          onClose={() => setShowVoice(false)}
          onSend={(msg) => { handleSend(msg); setShowVoice(false); }}
        />
      )}

      <div className="flex h-screen bg-white dark:bg-[#121212] overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-64 flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0f0f0f]">
            <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
              <span className="text-gray-900 dark:text-white font-semibold text-sm">Lịch sử</span>
              <button onClick={createNewChat} className="flex items-center gap-1 px-2 py-1 bg-gray-900 text-white dark:bg-white dark:text-black rounded-lg text-xs hover:opacity-80 transition-all">
                <Plus className="w-3 h-3" /> Mới
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
              {sessions.length === 0 && <p className="text-gray-400 dark:text-gray-600 text-xs text-center mt-6">Chưa có cuộc trò chuyện</p>}
              {sessions.map((s) => (
                <EditableSession
                  key={s.id}
                  session={s}
                  isActive={s.id === currentId}
                  onSelect={() => switchChat(s.id)}
                  onDelete={() => deleteChat(s.id)}
                  onRename={(t) => renameChat(s.id, t)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2a2a2a] flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen((v) => !v)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
              </button>
              <h1 className="text-gray-900 dark:text-white font-semibold">StudyAI Hub</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("chat")}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    mode === "chat"
                      ? "bg-gray-900 text-white dark:bg-white dark:text-black"
                      : "bg-gray-100 text-gray-500 hover:text-gray-900 dark:bg-[#2a2a2a] dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setMode("image")}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    mode === "image"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:text-gray-900 dark:bg-[#2a2a2a] dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  Tạo ảnh
                </button>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <p className="text-gray-500 dark:text-gray-500 text-lg">
                  {mode === "image" ? "Mô tả ảnh bạn muốn tạo..." : "Bắt đầu cuộc trò chuyện..."}
                </p>
                {mode === "chat" && <p className="text-gray-400 dark:text-gray-600 text-sm">Double-click tên chat để đổi tên</p>}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white dark:bg-white dark:text-black"
                    : "bg-gray-100 text-gray-900 border border-gray-200 dark:bg-[#1F2023] dark:text-gray-100 dark:border-[#333]"
                }`}>
                  {msg.files && msg.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.files.map((f, fi) => (
                        <div key={fi} className="flex items-center gap-1.5 bg-black/10 dark:bg-black/20 rounded-lg px-2 py-1">
                          {f.isImage
                            ? <img src={f.content} alt={f.name} className="h-16 rounded-lg object-cover" />
                            : <><FileIcon type={f.type} /><span className="text-xs truncate max-w-[120px]">{f.name}</span></>
                          }
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.generatedImage
                    ? <img src={msg.generatedImage} alt="generated" className="rounded-xl max-w-full" />
                    : msg.role === "assistant"
                    ? <MessageContent content={msg.content} />
                    : <span className="whitespace-pre-wrap">{msg.content}</span>
                  }
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border border-gray-200 dark:bg-[#1F2023] dark:border-[#333] rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* File preview */}
          {uploadedFiles.length > 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 flex-shrink-0">
              {uploadedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-gray-100 border border-gray-300 dark:bg-[#2a2a2a] dark:border-[#444] rounded-xl px-3 py-2">
                  {f.isImage ? <img src={f.content} alt={f.name} className="h-10 rounded-lg object-cover" /> : <FileIcon type={f.type} />}
                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[100px]">{f.name}</span>
                  <button onClick={() => setUploadedFiles((prev) => prev.filter((_, fi) => fi !== i))} className="ml-1 text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 flex flex-col gap-2 flex-shrink-0">
            {mode === "chat" && (
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 dark:bg-[#2a2a2a] dark:hover:bg-[#3a3a3a] dark:text-gray-400 dark:hover:text-white rounded-full text-sm transition-all"
                >
                  <Paperclip className="w-4 h-4" /> Tải file lên
                </button>
                <button
                  onClick={() => setShowVoice(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 dark:bg-[#2a2a2a] dark:hover:bg-[#3a3a3a] dark:text-gray-400 dark:hover:text-white rounded-full text-sm transition-all"
                >
                  <Mic className="w-4 h-4" /> Voice
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.md,.json,.js,.ts,.tsx,.jsx,.py,.cpp,.c,.java,.csv"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                />
              </div>
            )}
            <PromptInputBox
              onSend={handleSend}
              isLoading={isLoading}
              placeholder={mode === "image" ? "Mô tả ảnh muốn tạo..." : "Nhắn tin với AI..."}
            />
          </div>
        </div>
      </div>

      <FloatingActionMenu
        className="bottom-28 right-6"
        options={[
          {
            label: "Trò chuyện mới",
            Icon: <MessageSquarePlus className="w-4 h-4" />,
            onClick: createNewChat,
          },
          {
            label: mode === "chat" ? "Chế độ tạo ảnh" : "Chế độ chat",
            Icon: mode === "chat" ? <ImagePlus className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />,
            onClick: () => setMode(mode === "chat" ? "image" : "chat"),
          },
          {
            label: "Voice",
            Icon: <Mic className="w-4 h-4" />,
            onClick: () => setShowVoice(true),
          },
          {
            label: "Xóa lịch sử",
            Icon: <Trash2 className="w-4 h-4" />,
            onClick: clearAllHistory,
          },
        ]}
      />
    </>
  );
}