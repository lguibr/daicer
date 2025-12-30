import { useState, useCallback } from 'react';
import { debounce } from 'lodash';
import { searchMonsters, searchSpells } from '@/services/api'; // We'll need to implement these API endpoints or use existing

interface SearchResult {
  id: string;
  name: string;
  type: string;
  description?: string;
}

export function useEntitySearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    debounce(async (query: string, type: 'monster' | 'spell' | 'character') => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        let data = [];
        // TODO: Replace with real API calls once endpoints are exposed
        // For now, we simulate or use what we have
        if (type === 'monster') {
          // data = await searchMonsters(query);
          console.log('Searching monsters for:', query);
        } else if (type === 'spell') {
          // data = await searchSpells(query);
        }

        // Mock data for UI development
        if (type === 'monster') {
          data = [
            { id: 'giant-goat', name: 'Giant Goat', type: 'beast' },
            { id: 'goat', name: 'Goat', type: 'beast' },
            { id: 'goblin', name: 'Goblin', type: 'humanoid' },
          ].filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));
        }

        setResults(data as SearchResult[]);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  return { results, loading, search };
}
