import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useCardStore, isCardDue } from '@/stores/useCardStore';
import { ArrowLeft, MessageCircle, ZoomIn, ZoomOut, RotateCcw, BookOpen, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import Starfield from './Starfield';
import CardModal from './CardModal';
import AiPanel from './AiPanel';

const difficultyGlow: Record<string, string> = {
  easy: 'glow-easy',
  medium: 'glow-medium',
  hard: 'glow-hard',
};

const difficultyBorder: Record<string, string> = {
  easy: 'border-cosmic-easy/50',
  medium: 'border-cosmic-medium/50',
  hard: 'border-cosmic-hard/50',
};

const CanvasView = () => {
  const { topic, subtopics, selectCard, setView, toggleAiPanel } = useCardStore();
  const isMobile = useIsMobile();
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [showTooltip, setShowTooltip] = useState(true);

  // Auto-hide tooltip after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const canvasSize = 2000;
  const center = canvasSize / 2;
  const initialScale = isMobile ? 0.45 : 0.7;

  // Correct centering: account for scale factor
  const initialX = (windowSize.w - canvasSize * initialScale) / 2;
  const initialY = (windowSize.h - canvasSize * initialScale) / 2;

  // Build connection lines data
  const lines = useMemo(() => {
    const result: { x1: number; y1: number; x2: number; y2: number }[] = [];
    subtopics.forEach((st) => {
      result.push({ x1: 0, y1: 0, x2: st.x, y2: st.y });
      const cardCount = st.cards.length;
      const cardRadius = cardCount > 4 ? 160 : 130;
      const baseAngle = Math.atan2(st.y, st.x);
      st.cards.forEach((_, ci) => {
        const spread = cardCount > 4 ? Math.PI * 0.8 : Math.PI * 0.6;
        const angle = baseAngle - spread / 2 + (spread / Math.max(cardCount - 1, 1)) * ci;
        const cx = st.x + Math.cos(angle) * cardRadius;
        const cy = st.y + Math.sin(angle) * cardRadius;
        result.push({ x1: st.x, y1: st.y, x2: cx, y2: cy });
      });
    });
    return result;
  }, [subtopics]);

  // Calculate card positions
  const cardPositions = useMemo(() => {
    const positions: { id: string; x: number; y: number; title: string; difficulty: string | null; subtopic: string; isDue: boolean }[] = [];
    subtopics.forEach((st) => {
      const cardCount = st.cards.length;
      const cardRadius = cardCount > 4 ? 160 : 130;
      const baseAngle = Math.atan2(st.y, st.x);
      st.cards.forEach((card, ci) => {
        const spread = cardCount > 4 ? Math.PI * 0.8 : Math.PI * 0.6;
        const angle = baseAngle - spread / 2 + (spread / Math.max(cardCount - 1, 1)) * ci;
        positions.push({
          id: card.id,
          x: st.x + Math.cos(angle) * cardRadius,
          y: st.y + Math.sin(angle) * cardRadius,
          title: card.title,
          difficulty: card.difficulty,
          subtopic: card.subtopic,
          isDue: isCardDue(card),
        });
      });
    });
    return positions;
  }, [subtopics]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-background touch-none">
      <Starfield />

      {/* Toolbar */}
      <div className="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 md:gap-3 pointer-events-auto">
          <button
            onClick={() => setView('landing')}
            className="rounded-lg bg-card/80 cosmic-border backdrop-blur-sm p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="rounded-lg bg-card/80 cosmic-border backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2">
            <h2 className="font-display text-xs md:text-sm font-semibold text-foreground truncate max-w-[150px] md:max-w-none">{topic}</h2>
          </div>
        </div>
        <div className="relative pointer-events-auto">
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.9 }}
                transition={{ type: 'spring', damping: 22, stiffness: 180, mass: 0.8 }}
                className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-card/95 cosmic-border backdrop-blur-xl p-3 shadow-lg z-50"
              >
                <div className="absolute -top-1.5 right-4 w-3 h-3 rotate-45 bg-card/95 cosmic-border border-b-0 border-r-0" />
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="font-display text-xs font-semibold text-foreground">AI Assistant</span>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground leading-relaxed mb-2">
                  Chat, ask questions & get summaries about your topic!
                </p>
                <div className="flex gap-1.5">
                  <span className="flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-mono text-primary">
                    <MessageCircle className="h-2.5 w-2.5" /> Chat
                  </span>
                  <span className="flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-[9px] font-mono text-accent">
                    <BookOpen className="h-2.5 w-2.5" /> Summary
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => { setShowTooltip(false); toggleAiPanel(); }}
            className="rounded-xl bg-primary/20 cosmic-border backdrop-blur-sm p-2.5 md:p-3 text-primary hover:bg-primary/30 transition-all shadow-lg shadow-primary/10 animate-gentle-bounce"
          >
            <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <TransformWrapper
        key={`${windowSize.w}-${windowSize.h}-${initialScale}`}
        initialScale={initialScale}
        minScale={0.2}
        maxScale={2.5}
        initialPositionX={initialX}
        initialPositionY={initialY}
        limitToBounds={false}
        pinch={{ step: 5 }}
        panning={{ velocityDisabled: false }}
        smooth={true}
        wheel={{ smoothStep: 0.04 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom controls - hidden on mobile (use pinch), shown on desktop */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 hidden md:flex items-center gap-2">
              <button onClick={() => zoomIn()} className="rounded-lg bg-card/80 cosmic-border backdrop-blur-sm p-2 text-muted-foreground hover:text-foreground transition-colors">
                <ZoomIn className="h-4 w-4" />
              </button>
              <button onClick={() => zoomOut()} className="rounded-lg bg-card/80 cosmic-border backdrop-blur-sm p-2 text-muted-foreground hover:text-foreground transition-colors">
                <ZoomOut className="h-4 w-4" />
              </button>
              <button onClick={() => resetTransform()} className="rounded-lg bg-card/80 cosmic-border backdrop-blur-sm p-2 text-muted-foreground hover:text-foreground transition-colors">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
              <div style={{ width: canvasSize, height: canvasSize, position: 'relative' }}>
                {/* SVG connection lines */}
                <svg
                  width={canvasSize}
                  height={canvasSize}
                  className="absolute inset-0 pointer-events-none"
                >
                  {lines.map((line, i) => (
                    <motion.line
                      key={i}
                      x1={center + line.x1}
                      y1={center + line.y1}
                      x2={center + line.x2}
                      y2={center + line.y2}
                      stroke="rgba(79,158,255,0.2)"
                      strokeWidth={1}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: i * 0.03 }}
                    />
                  ))}
                </svg>

                {/* Central topic node */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 20, delay: 0.1 }}
                  className="absolute rounded-full bg-card cosmic-border glow-blue flex items-center justify-center animate-glow-pulse"
                  style={{
                    left: center - (isMobile ? 45 : 60),
                    top: center - (isMobile ? 45 : 60),
                    width: isMobile ? 90 : 120,
                    height: isMobile ? 90 : 120,
                  }}
                >
                  <span className="font-display text-xs md:text-sm font-bold text-foreground text-center px-2 md:px-3 leading-tight">
                    {topic}
                  </span>
                </motion.div>

                {/* Subtopic nodes */}
                {subtopics.map((st, si) => (
                  <motion.div
                    key={st.name}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20, delay: 0.3 + si * 0.1 }}
                    className="absolute rounded-xl bg-card cosmic-border glow-violet flex items-center justify-center"
                    style={{
                      left: center + st.x - 50,
                      top: center + st.y - 20,
                      width: 100,
                      height: 40,
                    }}
                  >
                    <span className="font-display text-xs font-semibold text-accent text-center px-2 truncate">
                      {st.name}
                    </span>
                  </motion.div>
                ))}

                {/* Card nodes */}
                {cardPositions.map((cp, ci) => (
                  <motion.button
                    key={cp.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20, delay: 0.6 + ci * 0.05 }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); selectCard(cp.id); }}
                    className={`absolute rounded-lg bg-card cosmic-border px-2 md:px-3 py-1.5 md:py-2 text-left transition-all hover:brightness-125 cursor-pointer ${
                      cp.difficulty ? difficultyGlow[cp.difficulty] : 'animate-glow-pulse'
                    } ${cp.difficulty ? difficultyBorder[cp.difficulty] : ''}`}
                    style={{
                      left: center + cp.x - (isMobile ? 45 : 55),
                      top: center + cp.y - (isMobile ? 15 : 18),
                      width: isMobile ? 90 : 110,
                      maxWidth: isMobile ? 90 : 110,
                    }}
                  >
                    {cp.isDue && (
                      <span className="absolute -top-2 -right-2 rounded-full bg-cosmic-hard/90 text-[7px] font-mono text-foreground px-1.5 py-0.5 leading-none shadow-lg animate-pulse">
                        DUE
                      </span>
                    )}
                    <span className="font-mono text-[9px] md:text-[10px] text-foreground leading-tight line-clamp-2 block">
                      {cp.title}
                    </span>
                    {cp.difficulty && (
                      <span className={`text-[8px] font-mono mt-1 block ${
                        cp.difficulty === 'easy' ? 'text-cosmic-easy' : cp.difficulty === 'medium' ? 'text-cosmic-medium' : 'text-cosmic-hard'
                      }`}>
                        {cp.difficulty}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      <CardModal />
      <AiPanel />
    </div>
  );
};

export default CanvasView;
