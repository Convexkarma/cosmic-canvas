import { create } from 'zustand';

export type Difficulty = 'easy' | 'medium' | 'hard' | null;

export interface FlashCard {
  id: string;
  title: string;
  question: string;
  answer: string;
  subtopic: string;
  difficulty: Difficulty;
  source: string;
  // SM-2 fields
  nextReviewDate?: string; // ISO string for serialization
  repetitions: number;
  easeFactor: number;
  interval: number; // days
}

export interface SubtopicNode {
  name: string;
  x: number;
  y: number;
  cards: FlashCard[];
}

export interface AppState {
  topic: string;
  cards: FlashCard[];
  subtopics: SubtopicNode[];
  selectedCardId: string | null;
  view: 'landing' | 'canvas';
  aiPanelOpen: boolean;
  chatMessages: { role: 'user' | 'assistant'; content: string }[];
  setTopic: (topic: string) => void;
  setCards: (cards: FlashCard[]) => void;
  selectCard: (id: string | null) => void;
  setView: (view: 'landing' | 'canvas') => void;
  toggleAiPanel: () => void;
  rateCard: (id: string, difficulty: Difficulty) => void;
  addChatMessage: (msg: { role: 'user' | 'assistant'; content: string }) => void;
}

/** Simplified SM-2 algorithm */
function sm2(card: FlashCard, grade: 'easy' | 'medium' | 'hard'): Pick<FlashCard, 'repetitions' | 'easeFactor' | 'interval' | 'nextReviewDate'> {
  // Map difficulty to SM-2 quality: easy=5, medium=3, hard=1
  const q = grade === 'easy' ? 5 : grade === 'medium' ? 3 : 1;

  let { repetitions, easeFactor, interval } = card;

  if (q < 3) {
    // Failed — reset
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  // Update ease factor (min 1.3)
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    repetitions,
    easeFactor,
    interval,
    nextReviewDate: nextReview.toISOString(),
  };
}

/** Check if a card is due for review */
export function isCardDue(card: FlashCard): boolean {
  if (!card.nextReviewDate) return false;
  return new Date(card.nextReviewDate) <= new Date();
}

/** Ensure card has SM-2 defaults */
function ensureSm2Defaults(card: any): FlashCard {
  return {
    ...card,
    difficulty: card.difficulty ?? null,
    repetitions: card.repetitions ?? 0,
    easeFactor: card.easeFactor ?? 2.5,
    interval: card.interval ?? 0,
  };
}

// Mock data for initial demo
const MOCK_CARDS: FlashCard[] = [
  { id: '1', title: 'What is entanglement?', question: 'Define quantum entanglement in simple terms.', answer: 'Quantum entanglement is a phenomenon where two particles become linked, so the quantum state of one instantly influences the other, regardless of distance.', subtopic: 'Fundamentals', difficulty: null, source: 'https://example.com', repetitions: 0, easeFactor: 2.5, interval: 0 },
  { id: '2', title: 'EPR Paradox', question: 'What is the EPR paradox?', answer: 'The Einstein-Podolsky-Rosen paradox argued that quantum mechanics is incomplete because entanglement seems to allow faster-than-light communication.', subtopic: 'Fundamentals', difficulty: null, source: 'https://example.com', repetitions: 0, easeFactor: 2.5, interval: 0 },
  { id: '3', title: 'Bell\'s Theorem', question: 'What did Bell\'s theorem prove?', answer: 'Bell\'s theorem proved that no theory of local hidden variables can reproduce all predictions of quantum mechanics, confirming entanglement is real.', subtopic: 'Fundamentals', difficulty: null, source: 'https://example.com', repetitions: 0, easeFactor: 2.5, interval: 0 },
  { id: '4', title: 'Superposition', question: 'How does superposition relate to entanglement?', answer: 'Entangled particles exist in superposition — multiple states simultaneously — until measured, at which point both particles\' states are determined.', subtopic: 'Quantum States', difficulty: null, source: 'https://example.com', repetitions: 0, easeFactor: 2.5, interval: 0 },
  { id: '5', title: 'Quantum Teleportation', question: 'What is quantum teleportation?', answer: 'Quantum teleportation uses entanglement to transfer quantum information between particles without physically moving them.', subtopic: 'Applications', difficulty: null, source: 'https://example.com', repetitions: 0, easeFactor: 2.5, interval: 0 },
  { id: '6', title: 'Quantum Computing', question: 'How does entanglement enable quantum computing?', answer: 'Entangled qubits can process exponentially more information than classical bits by leveraging correlated quantum states.', subtopic: 'Applications', difficulty: null, source: 'https://example.com', repetitions: 0, easeFactor: 2.5, interval: 0 },
  { id: '7', title: 'Quantum Cryptography', question: 'How is entanglement used in cryptography?', answer: 'Quantum key distribution uses entangled photons to create unbreakable encryption — any eavesdropping disturbs the quantum state and is detected.', subtopic: 'Applications', difficulty: null, source: 'https://example.com', repetitions: 0, easeFactor: 2.5, interval: 0 },
  { id: '8', title: 'Decoherence', question: 'What causes entanglement to break?', answer: 'Decoherence occurs when entangled particles interact with their environment, causing the quantum correlations to dissipate.', subtopic: 'Challenges', difficulty: null, source: 'https://example.com', repetitions: 0, easeFactor: 2.5, interval: 0 },
  { id: '9', title: 'Spooky Action', question: 'Why did Einstein call it "spooky action at a distance"?', answer: 'Einstein was uncomfortable with the idea that measuring one particle could instantly affect another far away, seemingly violating locality.', subtopic: 'History', difficulty: null, source: 'https://example.com', repetitions: 0, easeFactor: 2.5, interval: 0 },
  { id: '10', title: 'Photon Entanglement', question: 'How are photons typically entangled?', answer: 'Photons are commonly entangled using spontaneous parametric down-conversion, where a single photon splits into two entangled photons in a crystal.', subtopic: 'Quantum States', difficulty: null, source: 'https://example.com', repetitions: 0, easeFactor: 2.5, interval: 0 },
  { id: '11', title: 'No-Cloning Theorem', question: 'What is the no-cloning theorem?', answer: 'The no-cloning theorem states it\'s impossible to create an identical copy of an unknown quantum state, which is fundamental to quantum security.', subtopic: 'Quantum States', difficulty: null, source: 'https://example.com', repetitions: 0, easeFactor: 2.5, interval: 0 },
  { id: '12', title: 'Quantum Internet', question: 'What role does entanglement play in a quantum internet?', answer: 'A quantum internet would use entanglement to enable ultra-secure communication and distributed quantum computing across global networks.', subtopic: 'Applications', difficulty: null, source: 'https://example.com', repetitions: 0, easeFactor: 2.5, interval: 0 },
];

function buildSubtopics(cards: FlashCard[]): SubtopicNode[] {
  const groups: Record<string, FlashCard[]> = {};
  cards.forEach(c => {
    if (!groups[c.subtopic]) groups[c.subtopic] = [];
    groups[c.subtopic].push(c);
  });

  const names = Object.keys(groups);
  const angleStep = (2 * Math.PI) / names.length;
  const radius = names.length > 6 ? 420 : 350;

  return names.map((name, i) => ({
    name,
    x: Math.cos(angleStep * i - Math.PI / 2) * radius,
    y: Math.sin(angleStep * i - Math.PI / 2) * radius,
    cards: groups[name],
  }));
}

export const useCardStore = create<AppState>((set) => ({
  topic: '',
  cards: [],
  subtopics: [],
  selectedCardId: null,
  view: 'landing',
  aiPanelOpen: false,
  chatMessages: [],
  setTopic: (topic) => set({ topic }),
  setCards: (cards) => {
    const normalized = cards.map(ensureSm2Defaults);
    set({ cards: normalized, subtopics: buildSubtopics(normalized) });
  },
  selectCard: (id) => set({ selectedCardId: id }),
  setView: (view) => set({ view }),
  toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  rateCard: (id, difficulty) =>
    set((s) => {
      if (!difficulty) return s;
      const updated = s.cards.map((c) => {
        if (c.id !== id) return c;
        const sm2Result = sm2(c, difficulty);
        return { ...c, difficulty, ...sm2Result };
      });
      return { cards: updated, subtopics: buildSubtopics(updated) };
    }),
  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
}));

export { MOCK_CARDS, buildSubtopics };
