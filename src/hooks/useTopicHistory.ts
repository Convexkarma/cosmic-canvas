import { useState, useCallback } from 'react';

export interface SavedTopic {
  topic: string;
  cardCount: number;
  subtopicCount: number;
  timestamp: number;
}

const STORAGE_KEY = 'cosmic-cards-history';

function loadHistory(): SavedTopic[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistHistory(items: SavedTopic[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useTopicHistory() {
  const [history, setHistory] = useState<SavedTopic[]>(loadHistory);

  const addTopic = useCallback((topic: string, cardCount: number, subtopicCount: number) => {
    setHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((h) => h.topic.toLowerCase() !== topic.toLowerCase());
      const updated = [{ topic, cardCount, subtopicCount, timestamp: Date.now() }, ...filtered].slice(0, 20);
      persistHistory(updated);
      return updated;
    });
  }, []);

  const removeTopic = useCallback((topic: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.topic !== topic);
      persistHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addTopic, removeTopic, clearHistory };
}
