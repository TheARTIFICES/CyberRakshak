import React, { useState } from "react";
import { Bot, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TypingIndicator from "./TypingIndicator"; 

interface ChatBubbleAssistantProps {
  text: string;
}

// Helper Component to handle Code Copy state
const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match?.[1] || 'text';

  const handleCopy = () => {
    // Extract text content
    const codeText = String(children).replace(/\n$/, "");
    navigator.clipboard.writeText(codeText);
    
    // Show feedback
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono text-xs text-red-500 dark:text-red-400 font-semibold border border-slate-200 dark:border-slate-600" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-200 rounded-lg my-3 overflow-hidden border border-slate-800 font-mono text-xs shadow-inner group">
      {/* Code Header Bar */}
      <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-500 uppercase select-none">
        <span className="font-semibold">{language}</span>
        
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none"
          title="Copy Code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto">
        <code className={className} {...props}>
          {children}
        </code>
      </div>
    </div>
  );
};

const ChatBubbleAssistant = ({ text }: ChatBubbleAssistantProps) => {
  // Determine if we should show the typing animation
  // Shows if text is explicitly "Thinking..." OR just whitespace (heartbeats)
  const isThinking = text === "Thinking..." || text.trim().length === 0;

  return (
    <div className="flex gap-4 max-w-4xl w-full">
      {/* Icon */}
      <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
        <Bot className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
      </div>
      
      {/* Content Bubble */}
      <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl rounded-tl-none shadow-sm overflow-hidden">
        
        {/* Header with Name */}
        <div className="mb-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">CyRa AI</span>
          <span className="text-xs text-slate-400">Cybersecurity Assistant</span>
        </div>

        {/* Content Area */}
        <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 min-h-[24px]">
          {isThinking ? (
            <div className="py-2">
              <TypingIndicator />
            </div>
          ) : (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Use our custom CodeBlock component
                code: CodeBlock,

                // Markdown Styles
                h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-6 mb-3 text-slate-900 dark:text-white border-b pb-1 dark:border-slate-600" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-5 mb-2 text-slate-900 dark:text-white" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-base font-bold mt-4 mb-2 text-cyan-600 dark:text-cyan-400" {...props} />,
                h4: ({node, ...props}) => <h4 className="text-sm font-bold mt-3 mb-1 uppercase tracking-wide text-slate-500 dark:text-slate-400" {...props} />,
                
                ul: ({node, ...props}) => <ul className="list-disc ml-5 space-y-1 my-2 marker:text-cyan-500" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal ml-5 space-y-1 my-2 marker:text-cyan-500" {...props} />,
                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                
                strong: ({node, ...props}) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                em: ({node, ...props}) => <em className="italic text-slate-600 dark:text-slate-400" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-cyan-500 pl-4 italic my-4 bg-slate-50 dark:bg-slate-900/50 py-2 rounded-r" {...props} />,
                
                a: ({node, ...props}) => <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                hr: ({node, ...props}) => <hr className="my-6 border-slate-200 dark:border-slate-700" {...props} />
              }}
            >
              {text}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubbleAssistant;
