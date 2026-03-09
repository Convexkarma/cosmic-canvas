import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SavedTopic {
  topic: string;
  cardCount: number;
  subtopicCount: number;
  timestamp: number;
}

const STORAGE_KEY = 'cosmic-cards-history';

function loadLocalHistory(): SavedTopic[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistLocalHistory(items: SavedTopic[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useTopicHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<SavedTopic[]>(loadLocalHistory);

  // Load from DB when user logs in
  useEffect(() => {
    if (!user) {
      setHistory(loadLocalHistory());
      return;
    }

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('topic_history')
        .select('topic, card_count, subtopic_count, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        const items: SavedTopic[] = data.map((d: any) => ({
          topic: d.topic,
          cardCount: d.card_count,
          subtopicCount: d.subtopic_count,
          timestamp: new Date(d.created_at).getTime(),
        }));
        setHistory(items);
        persistLocalHistory(items);
      }
    };

    fetchHistory();
  }, [user]);

  const addTopic = useCallback(async (topic: string, cardCount: number, subtopicCount: number) => {
    const newItem: SavedTopic = { topic, cardCount, subtopicCount, timestamp: Date.now() };

    setHistory((prev) => {
      const filtered = prev.filter((h) => h.topic.toLowerCase() !== topic.toLowerCase());
      const updated = [newItem, ...filtered].slice(0, 20);
      persistLocalHistory(updated);
      return updated;
    });

    if (user) {
      // Remove duplicate then insert
      await supabase.from('topic_history')
        .delete()
        .eq('user_id', user.id)
        .ilike('topic', topic);

      await supabase.from('topic_history').insert({
        user_id: user.id,
        topic,
        card_count: cardCount,
        subtopic_count: subtopicCount,
      });
    }
  }, [user]);

  const removeTopic = useCallback(async (topic: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.topic !== topic);
      persistLocalHistory(updated);
      return updated;
    });

    if (user) {
      await supabase.from('topic_history')
        .delete()
        .eq('user_id', user.id)
        .eq('topic', topic);
    }
  }, [user]);

  const clearHistory = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);

    if (user) {
      await supabase.from('topic_history')
        .delete()
        .eq('user_id', user.id);
    }
  }, [user]);

  return { history, addTopic, removeTopic, clearHistory };
}
