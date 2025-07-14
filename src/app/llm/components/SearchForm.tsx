import React from "react";
import { PLACEHOLDERS } from "../constants";

interface SearchFormProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  searchQuery,
  onSearchQueryChange,
  onSubmit,
  isLoading,
}) => {
  return (
    <form onSubmit={onSubmit} className="llm-search-form">
      <div className="llm-input-group">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder={PLACEHOLDERS.SEARCH}
          className="llm-search-input"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="llm-button llm-button-primary"
          disabled={isLoading || !searchQuery.trim()}
        >
          <span className="llm-button-icon">🔍</span>
          Search Hotels
        </button>
      </div>
    </form>
  );
}; 