import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, MessageCircle, BookOpen, Loader2 } from 'lucide-react';
import { useCardStore } from '@/stores/useCardStore';
import { streamChat, streamSummary } from '@/lib/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';

const AiPanel = () => {
  const { aiPanelOpen, toggleAiPanel, topic, cards, chatMessages, addChatMessage } = useCardStore();
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const cardContext = cards.map(c => `[${c.subtopic}] ${c.title}: Q: ${c.question} A: ${c.answer}`).join('\n');

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg = { role: 'user' as const, content: input.trim() };
    addChatMessage(userMsg);
    setInput('');
    setIsStreaming(true);

    let assistantSoFar = '';
    const allMessages = [...chatMessages, userMsg];

    await streamChat({
      messages: allMessages,
      topic,
      cardContext,
      onDelta: (chunk) => {
        assistantSoFar += chunk;
        // Update the last assistant message or create one
        useCardStore.setState((s) => {
          const msgs = [...s.chatMessages];
          if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
            msgs[msgs.length - 1] = { role: 'assistant', content: assistantSoFar };
          } else {
            msgs.push({ role: 'assistant', content: assistantSoFar });
          }
          return { chatMessages: msgs };
        });
      },
      onDone: () => setIsStreaming(false),
      onError: (err) => {
        addChatMessage({ role: 'assistant', content: `⚠️ ${err}` });
        setIsStreaming(false);
      },
    });
  };

  const handleSummarize = async () => {
    if (isSummarizing) return;
    setIsSummarizing(true);
    setSummary('');

    let text = '';
    await streamSummary({
      topic,
      cards,
      onDelta: (chunk) => {
        text += chunk;
        setSummary(text);
      },
      onDone: () => setIsSummarizing(false),
      onError: (err) => {
        setSummary(`⚠️ ${err}`);
        setIsSummarizing(false);
      },
    });
  };

  return (
    <AnimatePresence>
      {aiPanelOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 z-40 w-[380px] max-w-full bg-card/95 backdrop-blur-xl cosmic-border border-l flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-display text-sm font-semibold text-foreground">AI Assistant</span>
            </div>
            <button onClick={toggleAiPanel} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-4 mt-2 bg-muted/30">
              <TabsTrigger value="chat" className="gap-1.5 text-xs">
                <MessageCircle className="h-3 w-3" /> Chat
              </TabsTrigger>
              <TabsTrigger value="summary" className="gap-1.5 text-xs">
                <BookOpen className="h-3 w-3" /> Summary
              </TabsTrigger>
            </TabsList>

            {/* Chat tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-0 px-4 pb-4">
              <div className="flex-1 overflow-y-auto space-y-3 py-3 min-h-0">
                {chatMessages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-8 font-mono">
                    Ask anything about <span className="text-primary">{topic}</span>
                  </p>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs font-mono ${
                      msg.role === 'user'
                        ? 'bg-primary/20 text-foreground'
                        : 'bg-muted/30 text-foreground'
                    }`}>
                      <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 text-xs">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isStreaming && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && (
                  <div className="flex justify-start">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask a question..."
                  disabled={isStreaming}
                  className="w-full rounded-lg bg-muted/30 cosmic-border px-3 py-2.5 pr-10 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={isStreaming || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </TabsContent>

            {/* Summary tab */}
            <TabsContent value="summary" className="flex-1 flex flex-col min-h-0 mt-0 px-4 pb-4">
              <div className="flex-1 overflow-y-auto py-3 min-h-0">
                {!summary && !isSummarizing && (
                  <div className="flex flex-col items-center gap-4 mt-8">
                    <p className="text-xs text-muted-foreground text-center font-mono">
                      Generate a comprehensive summary of <span className="text-primary">{topic}</span>
                    </p>
                    <button
                      onClick={handleSummarize}
                      className="rounded-lg bg-primary px-4 py-2 text-xs font-display font-semibold text-primary-foreground hover:brightness-110 transition-all"
                    >
                      Generate Summary
                    </button>
                  </div>
                )}
                {(summary || isSummarizing) && (
                  <div className="prose prose-sm prose-invert max-w-none text-xs font-mono [&_p]:my-2 [&_h2]:text-sm [&_h2]:font-display [&_h2]:text-accent [&_h3]:text-xs [&_strong]:text-primary">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                    {isSummarizing && <Loader2 className="h-4 w-4 animate-spin text-primary mt-2" />}
                  </div>
                )}
              </div>
              {summary && !isSummarizing && (
                <button
                  onClick={handleSummarize}
                  className="rounded-lg cosmic-border px-3 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                >
                  Regenerate
                </button>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AiPanel;
