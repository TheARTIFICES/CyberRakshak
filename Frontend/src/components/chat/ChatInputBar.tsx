import React, { useState } from "react";
import { Send, Plus, Paperclip } from "lucide-react";

// Updated Props
interface Props {
  onSend: (msg: string) => void;
  onAddContext: () => void;
  contextCount: number;
}

const ChatInputBar = ({ onSend, onAddContext, contextCount }: Props) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    onSend(message);
    setMessage("");
  };

  return (
    <div className="
      flex items-center gap-2
      bg-slate-100 dark:bg-slate-700
      rounded-xl px-2 py-2
      shadow-inner border border-slate-300 dark:border-slate-600
      transition-all duration-200
      focus-within:ring-2 focus-within:ring-blue-400
    ">

      {/* Add Context Button */}
      <button 
        onClick={onAddContext}
        className={`
          flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs font-medium
          ${contextCount > 0 
            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800" 
            : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"
          }
        `}
        title="Add scan context"
      >
        <Plus className="w-4 h-4" />
        {contextCount > 0 && <span>{contextCount} Scans</span>}
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

      {/* Input */}
      <input
        type="text"
        className="flex-1 bg-transparent outline-none text-sm px-2 text-slate-800 dark:text-slate-100 placeholder-slate-500"
        placeholder="Ask CyberRakshak anything…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
      />

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!message.trim()}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition shadow-sm"
      >
        <Send className="w-4 h-4" />
      </button>

    </div>
  );
};

export default ChatInputBar;
