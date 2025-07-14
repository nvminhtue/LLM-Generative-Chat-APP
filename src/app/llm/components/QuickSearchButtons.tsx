import React from "react";
import { QUICK_SEARCHES } from "../constants";

interface QuickSearchButtonsProps {
  onQuickSearch: (query: string) => void;
}

export const QuickSearchButtons: React.FC<QuickSearchButtonsProps> = ({
  onQuickSearch,
}) => {
  return (
    <div className="llm-quick-searches">
      <p className="llm-quick-label">Quick searches:</p>
      <div className="llm-quick-buttons">
        {QUICK_SEARCHES.map((search, index) => (
          <button
            key={index}
            onClick={() => onQuickSearch(search.query)}
            className="llm-button llm-button-quick"
          >
            {search.label}
          </button>
        ))}
      </div>
    </div>
  );
}; 