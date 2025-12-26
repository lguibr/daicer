import { useState } from 'react';
import { useWindowSize, useDebounce, useLocalStorage, useMediaQuery } from '@/hooks';

/**
 * Example component demonstrating usage of @uidotdev/usehooks
 */
export function HooksExample() {
  const { width, height } = useWindowSize();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [theme, setTheme] = useLocalStorage('theme', 'dark');
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div>
      <h2>Hooks Example</h2>

      <section>
        <h3>useWindowSize</h3>
        <p>
          Window: {width}px × {height}px
        </p>
        <p>Mobile: {isMobile ? 'Yes' : 'No'}</p>
      </section>

      <section>
        <h3>useDebounce</h3>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type to search..."
        />
        <p>Immediate: {searchTerm}</p>
        <p>Debounced: {debouncedSearch}</p>
      </section>

      <section>
        <h3>useLocalStorage</h3>
        <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          Toggle Theme: {theme}
        </button>
      </section>
    </div>
  );
}
