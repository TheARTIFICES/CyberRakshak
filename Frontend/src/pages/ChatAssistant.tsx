import React, { useState, useRef, useEffect } from "react";
import { Bot, Wallet, Scale, FlaskConical } from "lucide-react";
import chatAssistantService from "../services/chatAssistant";
import ChatBubbleAssistant from "../components/chat/ChatBubbleAssistant";
import ChatInputBar from "../components/chat/ChatInputBar"; // Use new InputBar
import ScanSelectionModal from "../components/chat/ScanSelectionModal"; // Import Modal
import type { ToolCall } from "../services/api";

interface Message {
  id: number;
  sender: "user" | "ai";
  content: string;
  timestamp: Date;
  /** Deterministic calls behind an assistant answer, when the backend supplies them. */
  toolCalls?: ToolCall[];
}

const ChatAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "ai",
      content: "Hello! I'm CyRa, your cybersecurity operations assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  
  // State for Context Selection
  const [contextModalOpen, setContextModalOpen] = useState(false);
  const [selectedScanIds, setSelectedScanIds] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Framed around what the advisor is actually for — the financial /
  // tool-calling layer — rather than generic security-ops verbs. Each card
  // sends a real, specific question rather than its own title as a prompt.
  const capabilities = [
    {
      id: 1,
      icon: <Wallet className="w-8 h-8 text-emerald-500" />,
      title: "Ask About Financial Risk",
      description: "“Where should we invest ₹1 crore to cut the most Expected Annual Loss?”",
      prompt: "Where should we invest ₹1 crore to reduce the most Expected Annual Loss?"
    },
    {
      id: 2,
      icon: <Scale className="w-8 h-8 text-cyan-500" />,
      title: "Check Compliance Posture",
      description: "“Which framework are we weakest on, and what is the penalty exposure?”",
      prompt: "Which regulatory framework are we weakest on, and what is our penalty exposure?"
    },
    {
      id: 3,
      icon: <FlaskConical className="w-8 h-8 text-purple-500" />,
      title: "Run a What-If Scenario",
      description: "“What happens to our EAL if we enforce MFA everywhere?”",
      prompt: "What happens to our Expected Annual Loss if we enforce MFA across the organization?"
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset context when chat resets (simulated by messages length 1)
  // In a real app, you might have a dedicated "New Chat" button function
  const handleNewChat = () => {
      setMessages([messages[0]]);
      setSelectedScanIds([]); // Clear context on new chat
  };

  const processMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsgId = Date.now();
    const aiMsgId = userMsgId + 1;

    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      content: text,
      timestamp: new Date()
    };

    const aiPlaceholder: Message = {
      id: aiMsgId,
      sender: "ai",
      content: "Thinking...", 
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg, aiPlaceholder]);

    const history = messages.slice(-6).map(m => ({
      role: m.sender === "ai" ? "assistant" : "user" as "assistant" | "user",
      content: m.content.length > 500 ? m.content.substring(0, 500) + "..." : m.content
    }));

    try {
      console.log("Sending Context IDs:", selectedScanIds);
      await chatAssistantService.sendStreamingMessage(text, history, selectedScanIds, (fullText) => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, content: fullText } : msg
          )
        );
      });
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMsgId ? { ...msg, content: "I'm having trouble connecting to the server. Please try again later." } : msg
        )
      );
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center relative bg-[#f0f2f5] dark:bg-[#050b14] transition-colors duration-300 bg-grid-slate-200/[0.5] dark:bg-grid-white/[0.05]">
      {/* Floating Header */}
      <div className="fixed top-0 left-0 right-0 z-10 flex justify-center pt-6">
        <div className="flex items-center bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-xl px-6 py-3 rounded-full border border-slate-200 dark:border-white/10 shadow-lg gap-4">
          <div className="flex items-center">
            <Bot className="w-5 h-5 text-cyan-500 mr-2" />
            <span className="font-semibold text-slate-800 dark:text-slate-100">CyRa AI</span>
          </div>
          
          <button 
            onClick={handleNewChat}
            className="text-xs text-slate-500 hover:text-red-500 transition border-l border-slate-300 pl-4"
          >
            Reset Chat
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 w-full max-w-5xl pt-24 pb-32 px-4">
        {messages.length === 1 && (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">How can I assist you today?</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-12">Select a capability to get started</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              {capabilities.map((capability) => (
                <div 
                  key={capability.id}
                  className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 hover:border-cyan-500 shadow-sm hover:shadow-xl transition-all p-8 flex flex-col items-center gap-4 cursor-pointer rounded-xl"
                  onClick={() => processMessage(capability.prompt)}
                >
                  <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-700">
                    {capability.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 text-center">{capability.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-center text-sm">{capability.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {messages.length > 1 && messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              {message.sender === "user" ? (
                <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-6 py-3 max-w-[80%] shadow-md">
                  <p>{message.content}</p>
                </div>
              ) : (
                <ChatBubbleAssistant text={message.content} toolCalls={message.toolCalls} />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 z-10 flex justify-center pb-6 px-4">
        <div className="w-full max-w-3xl">
          <ChatInputBar 
            onSend={processMessage} 
            onAddContext={() => setContextModalOpen(true)}
            contextCount={selectedScanIds.length}
          />
        </div>
      </div>

      {/* Context Modal */}
      <ScanSelectionModal 
        open={contextModalOpen}
        onClose={() => setContextModalOpen(false)}
        selectedIds={selectedScanIds}
        onSelectionChange={setSelectedScanIds}
      />
    </div>
  );
};

export default ChatAssistant;
