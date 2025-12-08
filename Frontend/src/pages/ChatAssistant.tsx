import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Zap, Radar, Brain } from "lucide-react";
// Import the service
import chatAssistantService from "../services/chatAssistant";

// Define message type for clarity
interface Message {
  id: number;
  sender: "user" | "ai";
  content: string; // This will hold the text or "Thinking..."
  timestamp: Date;
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
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Capability cards data
  const capabilities = [
    {
      id: 1,
      icon: <Radar className="w-8 h-8 text-blue-500" />,
      title: "Initiate Intelligent Scan",
      description: "Discover vulnerabilities across your infrastructure"
    },
    {
      id: 2,
      icon: <Brain className="w-8 h-8 text-purple-500" />,
      title: "Analyze Attack Paths",
      description: "Map potential routes attackers could take"
    },
    {
      id: 3,
      icon: <Zap className="w-8 h-8 text-cyan-500" />,
      title: "Auto-Remediate Criticals",
      description: "Apply patches and fixes automatically"
    }
  ];

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Unified send function for both Input and Capabilities
  const processMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Generate IDs immediately
    const userMsgId = Date.now();
    const aiMsgId = userMsgId + 1;

    // 2. Create User Message
    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      content: text,
      timestamp: new Date()
    };

    // 3. Create AI Placeholder Message
    // This acts as the "Typing..." indicator until text arrives
    const aiPlaceholder: Message = {
      id: aiMsgId,
      sender: "ai",
      content: "Thinking...", 
      timestamp: new Date()
    };

    // 4. Update State ONCE with both messages
    setMessages(prev => [...prev, userMsg, aiPlaceholder]);
    setInputValue("");

    // 5. Prepare History (Snapshotted before this update)
    const history = messages.map(m => ({
      role: m.sender === "ai" ? "assistant" : "user" as "assistant" | "user",
      content: m.content
    }));

    // 6. Call Streaming API
    try {
      await chatAssistantService.sendStreamingMessage(text, history, (fullText) => {
        // ONLY update the existing placeholder message.
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, content: fullText } : msg
          )
        );
      });
    } catch (error) {
      console.error("Chat error:", error);
      // Update the placeholder with error text if it fails
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMsgId ? { ...msg, content: "I'm having trouble connecting to the server. Please try again later." } : msg
        )
      );
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      processMessage(inputValue);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center relative bg-[#f0f2f5] dark:bg-[#050b14] transition-colors duration-300 bg-grid-slate-200/[0.5] dark:bg-grid-white/[0.05]">
      {/* Floating Header */}
      <div className="fixed top-0 left-0 right-0 z-10 flex justify-center pt-6">
        <div className="flex items-center bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-xl px-6 py-3 rounded-full border border-slate-200 dark:border-white/10 shadow-lg">
          <Bot className="w-5 h-5 text-cyan-500 mr-2" />
          <span className="font-semibold text-slate-800 dark:text-slate-100">CyRa AI</span>
          <div className="flex items-center ml-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-xs text-green-600 dark:text-green-400">Online</span>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 w-full max-w-5xl pt-24 pb-32 px-4">
        {/* Empty State - Starter Grid */}
        {messages.length === 1 && (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">How can I assist you today?</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-12">Select a capability to get started</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              {capabilities.map((capability) => (
                <div 
                  key={capability.id}
                  className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 hover:border-cyan-500 shadow-sm hover:shadow-xl transition-all p-8 flex flex-col items-center gap-4 cursor-pointer rounded-xl"
                  onClick={() => processMessage(capability.title)}
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

        {/* Chat Messages */}
        {messages.length > 1 && (
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                {message.sender === "user" ? (
                  // User Message Bubble
                  <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-6 py-3 max-w-[80%]">
                    <p>{message.content}</p>
                  </div>
                ) : (
                  // AI Message Bubble
                  <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-6 py-6 shadow-sm w-full max-w-[80%]">
                    <div className="flex items-start mb-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center mr-3 flex-shrink-0">
                        <Bot className="w-4 h-4 text-cyan-500" />
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">CyRa AI</span>
                    </div>
                    {/* Render newlines properly */}
                    <div className="text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Omni-Bar Input */}
      <div className="fixed bottom-0 left-0 right-0 z-10 flex justify-center pb-6">
        <div className="w-full max-w-3xl bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-xl border border-slate-300 dark:border-cyan-500/30 rounded-full shadow-2xl p-2 flex items-center gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message CyRa AI..."
            className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 text-lg px-6 py-4 resize-none max-h-32 focus:outline-none"
            rows={1}
          />
          <button
            onClick={() => processMessage(inputValue)}
            disabled={inputValue.trim() === ""}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 flex items-center justify-center transition-all shadow-lg text-white"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
