import React from "react";
import { ChatMessage } from "../../../api/types";

interface ConversationHistoryProps {
  conversationHistory: ChatMessage[];
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  conversationHistory,
}) => {
  if (conversationHistory.length === 0) {
    return null;
  }

  return (
    <div className="llm-conversation-section">
      <h3 className="llm-conversation-title">💬 Conversation</h3>
      <div className="llm-conversation-history">
        {conversationHistory.map((message, index) => (
          <div 
            key={index}
            className={`llm-message llm-message-${message.role}`}
          >
            <div className="llm-message-content">
              {message.content}
            </div>
            <div className="llm-message-time">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 