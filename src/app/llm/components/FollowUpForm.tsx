import React from "react";
import { PLACEHOLDERS } from "../constants";

interface FollowUpFormProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const FollowUpForm: React.FC<FollowUpFormProps> = ({
  searchQuery,
  onSearchQueryChange,
  onSubmit,
  isLoading,
}) => {
  return (
    <div className="llm-followup-section">
      <form onSubmit={onSubmit} className="llm-followup-form">
        <div className="llm-input-group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder={PLACEHOLDERS.FOLLOWUP}
            className="llm-search-input"
            disabled={isLoading}
            autoFocus
          />
          <button 
            type="submit" 
            className="llm-button llm-button-primary"
            disabled={isLoading || !searchQuery.trim()}
          >
            <span className="llm-button-icon">💬</span>
            Reply
          </button>
        </div>
      </form>
    </div>
  );
}; 