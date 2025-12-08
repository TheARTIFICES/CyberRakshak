import React from "react";
import { Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatBubbleAssistantProps {
  text: string;
}

const ChatBubbleAssistant = ({ text }: ChatBubbleAssistantProps) => {
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

        {/* Markdown Content */}
        <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Headings
              h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-6 mb-3 text-slate-900 dark:text-white border-b pb-1 dark:border-slate-600" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-5 mb-2 text-slate-900 dark:text-white" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-base font-bold mt-4 mb-2 text-cyan-600 dark:text-cyan-400" {...props} />,
              h4: ({node, ...props}) => <h4 className="text-sm font-bold mt-3 mb-1 uppercase tracking-wide text-slate-500 dark:text-slate-400" {...props} />,
              
              // Lists
              ul: ({node, ...props}) => <ul className="list-disc ml-5 space-y-1 my-2 marker:text-cyan-500" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal ml-5 space-y-1 my-2 marker:text-cyan-500" {...props} />,
              li: ({node, ...props}) => <li className="pl-1" {...props} />,
              
              // Text Formatting
              strong: ({node, ...props}) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
              em: ({node, ...props}) => <em className="italic text-slate-600 dark:text-slate-400" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-cyan-500 pl-4 italic my-4 bg-slate-50 dark:bg-slate-900/50 py-2 rounded-r" {...props} />,
              
              // Code Blocks
              code({node, inline, className, children, ...props}: any) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline ? (
                  <div className="bg-slate-950 text-slate-200 p-4 rounded-lg my-3 overflow-x-auto border border-slate-800 font-mono text-xs shadow-inner">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800/50 text-xs text-slate-500 uppercase">
                      <span>{match?.[1] || 'Code'}</span>
                    </div>
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </div>
                ) : (
                  <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono text-xs text-red-500 dark:text-red-400 font-semibold border border-slate-200 dark:border-slate-600" {...props}>
                    {children}
                  </code>
                )
              },
              
              // Links and Paragraphs
              a: ({node, ...props}) => <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
              p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
              hr: ({node, ...props}) => <hr className="my-6 border-slate-200 dark:border-slate-700" {...props} />
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ChatBubbleAssistant;
