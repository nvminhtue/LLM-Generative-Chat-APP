"use client";
import { useState, useCallback, useEffect } from "react";
import { useChat } from "./hooks/useChat";
import {
  SearchForm,
  QuickSearchButtons,
  ConversationHistory,
  FollowUpForm,
  LoadingIndicator,
} from "./components";
import { MESSAGES } from "./constants";
import "./page.css";

const LLMPage = () => {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const {
    isStarted,
    isStreamFinished,
    isLoading,
    conversationHistory,
    currentStreamingMessage,
    needsUserInput,
    startChat,
    resetChat,
  } = useChat();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const isFollowUp = isStarted && conversationHistory.length > 0;
      startChat(searchQuery, isFollowUp);
      setSearchQuery("");
    }
  }, [searchQuery, startChat, isStarted, conversationHistory]);

  const handleQuickSearch = useCallback((query: string) => {
    // setSearchQuery(query);
    startChat(query);
  }, [startChat]);

  // Prevent hydration issues by not rendering until mounted
  if (!mounted) {
    return <div className="llm-page-loading">Loading...</div>;
  }

  return (
    <div className="llm-page">
      <div className="llm-container">
        <header className="llm-header">
          <h1 className="llm-title">🏨 Hotel Price Finder</h1>
          <p className="llm-subtitle">
            Find the cheapest hotel deals across multiple booking platforms
          </p>
        </header>

        {!isStarted && (
          <div className="llm-search-section">
            <SearchForm
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
            <QuickSearchButtons onQuickSearch={handleQuickSearch} />
          </div>
        )}

        <ConversationHistory
          conversationHistory={conversationHistory}
          currentStreamingMessage={currentStreamingMessage}
          isStreamFinished={isStreamFinished}
          needsUserInput={needsUserInput}
        />

        {isStarted && needsUserInput && isStreamFinished && (
          <FollowUpForm
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        )}

        <div className="llm-controls">
          {isStarted && (
            <div className="llm-control-group">
              <button
                onClick={resetChat}
                className="llm-button llm-button-secondary"
                disabled={isLoading}
              >
                <span className="llm-button-icon">🔄</span>
                New Search
              </button>
              {isLoading && <LoadingIndicator />}
            </div>
          )}
        </div>

        {isStarted &&
          conversationHistory.length === 0 &&
          !currentStreamingMessage &&
          !isLoading && (
            <div className="llm-empty-state">
              <div className="llm-empty-icon">🏨</div>
              <p>{MESSAGES.STARTING}</p>
            </div>
          )}
      </div>
    </div>
  );
};

export default LLMPage;
