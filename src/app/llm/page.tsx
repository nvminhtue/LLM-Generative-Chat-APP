"use client";

import {
  codeBlockLookBack,
  findCompleteCodeBlock,
  findPartialCodeBlock,
} from "@llm-ui/code";
import { markdownLookBack } from "@llm-ui/markdown";
import { useLLMOutput } from "@llm-ui/react";

import MarkdownComponent from "./markdown";
import CodeBlock from "./code-block";
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
    output,
    isStarted,
    isStreamFinished,
    isLoading,
    conversationHistory,
    needsUserInput,
    conversationComplete,
    hasResults,
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
    setSearchQuery(query);
    startChat(query);
  }, [startChat]);

  const { blockMatches } = useLLMOutput({
    llmOutput: output,
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

  // Prevent hydration issues by not rendering until mounted
  if (!mounted) {
    return <div className="llm-page-loading">Loading...</div>;
  }

  return (
    <div className="llm-page">
      <div className="llm-container">
        <header className="llm-header">
          <h1 className="llm-title">🏨 Hotel Price Finder</h1>
          <p className="llm-subtitle">Find the cheapest hotel deals across multiple booking platforms</p>
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

        <ConversationHistory conversationHistory={conversationHistory} />

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

        <div className="llm-content">
          {blockMatches.map((blockMatch, index) => {
            const Component = blockMatch.block.component;
            return (
              <div key={index} className="llm-block">
                <Component blockMatch={blockMatch} />
              </div>
            );
          })}
          
          {isStarted && blockMatches.length === 0 && !isLoading && (
            <div className="llm-empty-state">
              <div className="llm-empty-icon">🏨</div>
              <p>{MESSAGES.STARTING}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LLMPage;
