import { useState, useCallback } from 'react';
import { debounce } from 'lodash';
import { searchMonsters, searchSpells, searchCharacters } from '@/services/api'; // We'll need to implement these API endpoints or use existing

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
      // If query is empty, we still want to fetch defaults (e.g. recent or popular)
      // Passing empty string to backend search APIs should return a limited list of defaults
      setLoading(true);
      try {
        let data: unknown;
        if (type === 'monster') {
          data = await searchMonsters(query || ''); // Ensure backend handles empty string
        } else if (type === 'spell') {
          data = await searchSpells(query || '');
        } else if (type === 'character') {
          data = await searchCharacters(query || '');
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
