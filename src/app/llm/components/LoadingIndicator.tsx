import React from "react";
import { MESSAGES } from "../constants";

interface LoadingIndicatorProps {
  message?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = MESSAGES.LOADING,
}) => {
  return (
    <div className="llm-loading-indicator">
      <div className="llm-spinner"></div>
      <span>{message}</span>
    </div>
  );
}; 