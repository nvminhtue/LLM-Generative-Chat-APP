import React from "react";
import { ChatMessage } from "../../../api/types";
import {
  codeBlockLookBack,
  findCompleteCodeBlock,
  findPartialCodeBlock,
} from "@llm-ui/code";
import { markdownLookBack } from "@llm-ui/markdown";
import { useLLMOutput } from "@llm-ui/react";
import MarkdownComponent from "../markdown";
import CodeBlock from "../code-block";

interface ConversationHistoryProps {
  conversationHistory: ChatMessage[];
  currentStreamingMessage: string;
  isStreamFinished: boolean;
  needsUserInput: boolean;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  conversationHistory,
  currentStreamingMessage,
  isStreamFinished,
  needsUserInput,
}) => {
  if (conversationHistory.length === 0 && !currentStreamingMessage) {
    return null;
  }

  return (
    <div className="llm-conversation-section">
      <h3 className="llm-conversation-title">💬 Conversation</h3>
      <div className="llm-conversation-history">
        {conversationHistory.map((message, index) => (
          <div
            key={`message-${index}-${message.role}`}
            className={`llm-message llm-message-${message.role}`}
          >
            <div className="llm-message-content">
              {message.role === "assistant" ? (
                <AssistantMessageContent
                  content={message.content}
                  isStreamFinished={true}
                />
              ) : (
                message.content
              )}
            </div>
            <div className="llm-message-time">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}

        {/* Show current streaming message */}
        {currentStreamingMessage && !needsUserInput && (
          <div className="llm-message llm-message-assistant llm-streaming-message">
            <div className="llm-message-content">
              <AssistantMessageContent
                content={currentStreamingMessage}
                isStreamFinished={isStreamFinished}
              />
            </div>
            <div className="llm-message-time">
              {new Date().toLocaleTimeString()}
              {!isStreamFinished && (
                <span className="llm-typing-indicator"> ✏️</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface AssistantMessageContentProps {
  content: string;
  isStreamFinished: boolean;
}

const AssistantMessageContent: React.FC<AssistantMessageContentProps> = ({
  content,
  isStreamFinished,
}) => {
  const { blockMatches } = useLLMOutput({
    llmOutput: content,
    fallbackBlock: {
      component: MarkdownComponent,
      lookBack: markdownLookBack(),
    },
    blocks: [
      {
        component: CodeBlock,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack(),
      },
    ],
    isStreamFinished,
  });
  
    return (
      <div className="llm-assistant-content">
        {blockMatches.map((blockMatch, index) => {
          const Component = blockMatch.block.component;
          return (
            <div key={index} className="llm-block">
              <Component blockMatch={blockMatch} />
            </div>
          );
        })}
      </div>
    );
};
