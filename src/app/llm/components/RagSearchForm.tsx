"use client";
import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SearchResult {
  id: string;
  hotelName: string;
  roomType: string;
  price: number;
  currency: string;
  description: string;
  amenities: string[];
  provider: string;
  rating: number;
  location: string;
  availability: boolean;
}

interface RagSearchResponse {
  query?: string;
  criteria?: any;
  results: SearchResult[];
  analysis: string;
}

export const RagSearchForm = () => {
  const [searchType, setSearchType] = useState<'simple' | 'advanced'>('simple');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<RagSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Advanced search criteria
  const [criteria, setCriteria] = useState({
    location: '',
    maxPrice: '',
    minRating: '',
    amenities: '',
    roomType: ''
  });

  const handleSimpleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/rag-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), searchType: 'simple' }),
      });
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data.data);
    } catch (err) {
      setError('Failed to perform search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const handleAdvancedSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const searchCriteria: any = {};
      if (criteria.location) searchCriteria.location = criteria.location;
      if (criteria.maxPrice) searchCriteria.maxPrice = parseFloat(criteria.maxPrice);
      if (criteria.minRating) searchCriteria.minRating = parseFloat(criteria.minRating);
      if (criteria.amenities) searchCriteria.amenities = criteria.amenities.split(',').map(a => a.trim());
      if (criteria.roomType) searchCriteria.roomType = criteria.roomType;
      const response = await fetch('/api/rag-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchType: 'advanced', criteria: searchCriteria }),
      });
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data.data);
    } catch (err) {
      setError('Failed to perform search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [criteria]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchType === 'simple') {
      handleSimpleSearch();
    } else {
      handleAdvancedSearch();
    }
  }, [searchType, handleSimpleSearch, handleAdvancedSearch]);

  const updateCriteria = useCallback((field: string, value: string) => {
    setCriteria(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="llm-search-section">
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          type="button"
          className={`llm-button llm-button-primary${searchType === 'simple' ? ' active' : ''}`}
          style={{ flex: 1, opacity: searchType === 'simple' ? 1 : 0.7 }}
          onClick={() => setSearchType('simple')}
          disabled={isLoading}
        >
          Simple Search
        </button>
        <button
          type="button"
          className={`llm-button llm-button-secondary${searchType === 'advanced' ? ' active' : ''}`}
          style={{ flex: 1, opacity: searchType === 'advanced' ? 1 : 0.7 }}
          onClick={() => setSearchType('advanced')}
          disabled={isLoading}
        >
          Advanced Search
        </button>
      </div>
      <form onSubmit={handleSubmit} className="llm-search-form">
        {searchType === 'simple' ? (
          <div className="llm-input-group">
            <input
              id="query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., luxury hotels in New York, budget hotels with pool, family resorts..."
              className="llm-search-input"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              className="llm-button llm-button-primary"
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
            <input
              type="text"
              value={criteria.location}
              onChange={e => updateCriteria('location', e.target.value)}
              placeholder="Location (e.g., New York, Miami)"
              className="llm-search-input"
              disabled={isLoading}
            />
            <input
              type="number"
              value={criteria.maxPrice}
              onChange={e => updateCriteria('maxPrice', e.target.value)}
              placeholder="Max Price ($)"
              className="llm-search-input"
              disabled={isLoading}
            />
            <input
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={criteria.minRating}
              onChange={e => updateCriteria('minRating', e.target.value)}
              placeholder="Min Rating (e.g., 4.0)"
              className="llm-search-input"
              disabled={isLoading}
            />
            <input
              type="text"
              value={criteria.roomType}
              onChange={e => updateCriteria('roomType', e.target.value)}
              placeholder="Room Type (e.g., Suite, Deluxe)"
              className="llm-search-input"
              disabled={isLoading}
            />
            <input
              type="text"
              value={criteria.amenities}
              onChange={e => updateCriteria('amenities', e.target.value)}
              placeholder="Amenities (comma-separated)"
              className="llm-search-input"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="llm-button llm-button-primary"
              style={{ gridColumn: '1 / -1' }}
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        )}
      </form>
      {error && (
        <div className="llm-empty-state" style={{ color: '#d9534f', marginTop: 16 }}>{error}</div>
      )}
      {results && (
        <div className="llm-content" style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem', color: '#333' }}>Analysis</h3>
            <div style={{ lineHeight: 1.6, color: '#555', marginTop: 8 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{results.analysis}</ReactMarkdown>
            </div>
          </div>
          <div>
            <h3 style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem', color: '#333' }}>
              Found Hotels ({results.results.length})
            </h3>
            <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', marginTop: 16 }}>
              {results.results.map((hotel) => (
                <div key={hotel.id} style={{ background: 'white', borderRadius: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.07)', borderLeft: '4px solid #667eea', padding: 20 }}>
                  <h4 style={{ margin: 0, color: '#333', fontSize: 18 }}>{hotel.hotelName}</h4>
                  <p style={{ color: '#666', fontWeight: 500, margin: '5px 0' }}>{hotel.roomType}</p>
                  <p style={{ fontSize: 20, fontWeight: 'bold', color: '#28a745', margin: '10px 0' }}>${hotel.price} {hotel.currency}</p>
                  <p style={{ margin: '5px 0', color: '#666' }}>📍 {hotel.location}</p>
                  <p style={{ margin: '5px 0', color: '#666' }}>⭐ {hotel.rating}/5</p>
                  <p style={{ margin: '5px 0', color: '#666' }}>🏢 {hotel.provider}</p>
                  <p style={{ margin: '10px 0', color: '#555', fontStyle: 'italic' }}>{hotel.description}</p>
                  <div style={{ marginTop: 15 }}>
                    <strong style={{ color: '#333' }}>Amenities:</strong>
                    <ul style={{ margin: '5px 0', paddingLeft: 20 }}>
                      {hotel.amenities.map((amenity, index) => (
                        <li key={index} style={{ color: '#666', margin: '2px 0' }}>{amenity}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 