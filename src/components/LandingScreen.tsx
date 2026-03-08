import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles } from 'lucide-react';
import { useCardStore, MOCK_CARDS } from '@/stores/useCardStore';
import Starfield from './Starfield';

const LandingScreen = () => {
  const [input, setInput] = useState('');
  const { setTopic, setCards, setView } = useCardStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTopic(input.trim());
    // For now, use mock data — will wire API later
    setCards(MOCK_CARDS);
    setView('canvas');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <Starfield />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center gap-8 px-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <Sparkles className="h-8 w-8 text-primary animate-pulse-glow" />
          <h1 className="font-display text-5xl font-bold tracking-tight text-foreground md:text-7xl">
            Cosmic<span className="text-primary">Cards</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="max-w-md text-center text-lg text-muted-foreground"
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
                className="flex-1 bg-transparent px-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none font-mono text-sm"
              />
              <button
                type="submit"
                className="m-2 rounded-lg bg-primary px-5 py-2 font-display text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-95"
              >
                Explore
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
              onClick={() => {
                setInput(t);
              }}
              className="rounded-full cosmic-border bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-primary/50"
            >
              {t}
            </button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LandingScreen;
