import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface PromptResultProps {
  result: string;
}

export function PromptResult({ result }: PromptResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (!result) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-10 rounded-2xl glass-panel border border-primary/20 shadow-2xl shadow-primary/5 overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-secondary/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg text-foreground">Generated Prompt</h3>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-all duration-200 border border-white/5 hover:border-white/10"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground/80">Copy Prompt</span>
            </>
          )}
        </button>
      </div>
      
      <div className="p-6 md:p-8 overflow-x-auto bg-[#0a0a0c]">
        <div className="prose-custom">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {result}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
