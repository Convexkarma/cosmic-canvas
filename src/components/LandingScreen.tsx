import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Loader2, Clock, X, Trash2, LogIn, LogOut, User } from 'lucide-react';
import { useCardStore } from '@/stores/useCardStore';
import { generateCards } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useTopicHistory } from '@/hooks/useTopicHistory';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Starfield from './Starfield';

const LandingScreen = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { setTopic, setCards, setView } = useCardStore();
  const { history, addTopic, removeTopic, clearHistory } = useTopicHistory();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleExplore = async (topicText: string) => {
    if (!topicText.trim() || loading) return;

    setLoading(true);
    try {
      const data = await generateCards(topicText.trim());
      const resolvedTopic = data.topic || topicText.trim();
      setTopic(resolvedTopic);
      setCards(data.cards);
      addTopic(resolvedTopic, data.cards.length, new Set(data.cards.map((c: any) => c.subtopic)).size);
      setView('canvas');
    } catch (err) {
      toast({
        title: 'Generation failed',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExplore(input);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <Starfield />

      {/* Auth button */}
      <div className="absolute top-4 right-4 z-20">
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground hidden sm:inline truncate max-w-[150px]">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="rounded-lg bg-card/80 cosmic-border backdrop-blur-sm px-3 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="rounded-lg bg-primary/20 cosmic-border backdrop-blur-sm px-4 py-2 text-xs font-display font-semibold text-primary hover:bg-primary/30 transition-all flex items-center gap-1.5"
          >
            <LogIn className="h-3.5 w-3.5" /> Sign In
          </button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center gap-6 md:gap-8 px-4 w-full max-w-2xl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-primary animate-pulse-glow" />
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground md:text-7xl">
            Cosmic<span className="text-primary">Cards</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="max-w-md text-center text-base md:text-lg text-muted-foreground"
        >
          AI-powered flashcards arranged as a cosmic mind-map.
          Enter any topic to explore.
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="relative w-full max-w-lg"
        >
          <div className="relative group">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/30 to-accent/30 opacity-50 blur-lg transition-opacity group-hover:opacity-80" />
            <div className="relative flex items-center rounded-xl bg-card cosmic-border">
              <Search className="ml-4 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What do you want to learn today?"
                disabled={loading}
                className="flex-1 bg-transparent px-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none font-mono text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="m-2 rounded-lg bg-primary px-5 py-2 font-display text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Generating…</span>
                  </>
                ) : (
                  'Explore'
                )}
              </button>
            </div>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-2 pt-2"
        >
          {['Quantum Entanglement', 'Neural Networks', 'Roman Empire', 'Blockchain'].map((t) => (
            <button
              key={t}
              onClick={() => setInput(t)}
              disabled={loading}
              className="rounded-full cosmic-border bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-primary/50 disabled:opacity-50"
            >
              {t}
            </button>
          ))}
        </motion.div>

        {/* Saved Topics History */}
        <AnimatePresence>
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="w-full max-w-lg mt-2"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Recent Topics</span>
                </div>
                <button
                  onClick={clearHistory}
                  className="text-[10px] font-mono text-muted-foreground/50 hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {history.slice(0, 5).map((item, i) => (
                  <motion.div
                    key={item.topic}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.3 + i * 0.05 }}
                    className="group flex items-center gap-3 rounded-lg bg-card/40 cosmic-border px-3 py-2.5 hover:bg-card/70 transition-all cursor-pointer"
                    onClick={() => handleExplore(item.topic)}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-display text-sm font-medium text-foreground truncate block">
                        {item.topic}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {item.cardCount} cards · {item.subtopicCount} branches · {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeTopic(item.topic); }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LandingScreen;
