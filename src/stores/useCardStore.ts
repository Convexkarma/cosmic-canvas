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
  nextReviewDate?: Date;
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

// Mock data for initial demo
const MOCK_CARDS: FlashCard[] = [
  { id: '1', title: 'What is entanglement?', question: 'Define quantum entanglement in simple terms.', answer: 'Quantum entanglement is a phenomenon where two particles become linked, so the quantum state of one instantly influences the other, regardless of distance.', subtopic: 'Fundamentals', difficulty: null, source: 'https://example.com' },
  { id: '2', title: 'EPR Paradox', question: 'What is the EPR paradox?', answer: 'The Einstein-Podolsky-Rosen paradox argued that quantum mechanics is incomplete because entanglement seems to allow faster-than-light communication.', subtopic: 'Fundamentals', difficulty: null, source: 'https://example.com' },
  { id: '3', title: 'Bell\'s Theorem', question: 'What did Bell\'s theorem prove?', answer: 'Bell\'s theorem proved that no theory of local hidden variables can reproduce all predictions of quantum mechanics, confirming entanglement is real.', subtopic: 'Fundamentals', difficulty: null, source: 'https://example.com' },
  { id: '4', title: 'Superposition', question: 'How does superposition relate to entanglement?', answer: 'Entangled particles exist in superposition — multiple states simultaneously — until measured, at which point both particles\' states are determined.', subtopic: 'Quantum States', difficulty: null, source: 'https://example.com' },
  { id: '5', title: 'Quantum Teleportation', question: 'What is quantum teleportation?', answer: 'Quantum teleportation uses entanglement to transfer quantum information between particles without physically moving them.', subtopic: 'Applications', difficulty: null, source: 'https://example.com' },
  { id: '6', title: 'Quantum Computing', question: 'How does entanglement enable quantum computing?', answer: 'Entangled qubits can process exponentially more information than classical bits by leveraging correlated quantum states.', subtopic: 'Applications', difficulty: null, source: 'https://example.com' },
  { id: '7', title: 'Quantum Cryptography', question: 'How is entanglement used in cryptography?', answer: 'Quantum key distribution uses entangled photons to create unbreakable encryption — any eavesdropping disturbs the quantum state and is detected.', subtopic: 'Applications', difficulty: null, source: 'https://example.com' },
  { id: '8', title: 'Decoherence', question: 'What causes entanglement to break?', answer: 'Decoherence occurs when entangled particles interact with their environment, causing the quantum correlations to dissipate.', subtopic: 'Challenges', difficulty: null, source: 'https://example.com' },
  { id: '9', title: 'Spooky Action', question: 'Why did Einstein call it "spooky action at a distance"?', answer: 'Einstein was uncomfortable with the idea that measuring one particle could instantly affect another far away, seemingly violating locality.', subtopic: 'History', difficulty: null, source: 'https://example.com' },
  { id: '10', title: 'Photon Entanglement', question: 'How are photons typically entangled?', answer: 'Photons are commonly entangled using spontaneous parametric down-conversion, where a single photon splits into two entangled photons in a crystal.', subtopic: 'Quantum States', difficulty: null, source: 'https://example.com' },
  { id: '11', title: 'No-Cloning Theorem', question: 'What is the no-cloning theorem?', answer: 'The no-cloning theorem states it\'s impossible to create an identical copy of an unknown quantum state, which is fundamental to quantum security.', subtopic: 'Quantum States', difficulty: null, source: 'https://example.com' },
  { id: '12', title: 'Quantum Internet', question: 'What role does entanglement play in a quantum internet?', answer: 'A quantum internet would use entanglement to enable ultra-secure communication and distributed quantum computing across global networks.', subtopic: 'Applications', difficulty: null, source: 'https://example.com' },
];

function buildSubtopics(cards: FlashCard[]): SubtopicNode[] {
  const groups: Record<string, FlashCard[]> = {};
  cards.forEach(c => {
    if (!groups[c.subtopic]) groups[c.subtopic] = [];
    groups[c.subtopic].push(c);
  });

  const names = Object.keys(groups);
  const angleStep = (2 * Math.PI) / names.length;
  const radius = 350;

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
  setCards: (cards) => set({ cards, subtopics: buildSubtopics(cards) }),
  selectCard: (id) => set({ selectedCardId: id }),
  setView: (view) => set({ view }),
  toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  rateCard: (id, difficulty) =>
    set((s) => ({
      cards: s.cards.map((c) => (c.id === id ? { ...c, difficulty } : c)),
      subtopics: buildSubtopics(
        s.cards.map((c) => (c.id === id ? { ...c, difficulty } : c))
      ),
    })),
  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
}));

export { MOCK_CARDS, buildSubtopics };
