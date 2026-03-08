import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';
import { useCardStore, type FlashCard, type Difficulty, isCardDue } from '@/stores/useCardStore';
import { useState } from 'react';

const difficultyConfig: Record<string, { label: string; glowClass: string; colorClass: string }> = {
  easy: { label: 'Easy', glowClass: 'glow-easy', colorClass: 'text-cosmic-easy' },
  medium: { label: 'Medium', glowClass: 'glow-medium', colorClass: 'text-cosmic-medium' },
  hard: { label: 'Hard', glowClass: 'glow-hard', colorClass: 'text-cosmic-hard' },
};

const CardModal = () => {
  const { selectedCardId, cards, selectCard, rateCard } = useCardStore();
  const [flipped, setFlipped] = useState(false);

  const card: FlashCard | undefined = cards.find((c) => c.id === selectedCardId);

  const handleClose = () => {
    setFlipped(false);
    selectCard(null);
  };

  const handleRate = (d: Difficulty) => {
    if (card) rateCard(card.id, d);
  };

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-md mx-0 md:mx-4 mb-0 md:mb-0"
          >
            <button
              onClick={handleClose}
              className="absolute -top-10 right-4 md:right-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Flip container */}
            <div
              className="card-flip cursor-pointer"
              onClick={() => setFlipped(!flipped)}
              style={{ minHeight: '240px' }}
            >
              <div className={`card-flip-inner relative w-full ${flipped ? 'flipped' : ''}`} style={{ minHeight: '240px' }}>
                {/* Front */}
                <div className="card-face absolute inset-0 rounded-xl md:rounded-xl rounded-b-none bg-card cosmic-border p-4 md:p-6 glow-blue flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{card.subtopic}</span>
                    <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mt-2">{card.title}</h2>
                  </div>
                  <p className="text-foreground/90 font-mono text-sm leading-relaxed mt-4">{card.question}</p>
                  <p className="text-xs text-muted-foreground mt-4 text-center">Click to flip →</p>
                </div>

                {/* Back */}
                <div className="card-face card-face-back absolute inset-0 rounded-xl md:rounded-xl rounded-b-none bg-card cosmic-border p-4 md:p-6 glow-violet flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-accent font-mono uppercase tracking-wider">Answer</span>
                    <p className="text-foreground font-mono text-sm leading-relaxed mt-3">{card.answer}</p>
                  </div>
                  <div className="mt-4">
                    <a href={card.source} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                      Source
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Review status */}
            {card.nextReviewDate && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className={`text-[10px] font-mono ${isCardDue(card) ? 'text-cosmic-hard' : 'text-muted-foreground'}`}>
                  {isCardDue(card)
                    ? '⚡ Due for review now!'
                    : `Next review: ${new Date(card.nextReviewDate).toLocaleDateString()}`
                  }
                </span>
                {card.interval > 0 && (
                  <span className="text-[10px] font-mono text-muted-foreground/60">
                    (interval: {card.interval}d)
                  </span>
                )}
              </div>
            )}

            {/* Difficulty rating */}
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="text-xs text-muted-foreground font-mono">Rate difficulty:</span>
              {(['easy', 'medium', 'hard'] as const).map((d) => {
                const cfg = difficultyConfig[d];
                const isActive = card.difficulty === d;
                return (
                  <button
                    key={d}
                    onClick={() => handleRate(d)}
                    className={`rounded-lg cosmic-border px-4 py-1.5 text-xs font-mono transition-all ${
                      isActive ? `${cfg.glowClass} ${cfg.colorClass} font-semibold` : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CardModal;
