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
import { useState, useCallback, useEffect, useRef } from "react";
import "./page.css";

const NEWLINE = "$NEWLINE$";

const LLMPage = () => {
  const [mounted, setMounted] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [isStarted, setIsStart] = useState<boolean>(false);
  const [isStreamFinished, setIsStreamFinished] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cleanup function to close EventSource
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const startChat = useCallback(async (query?: string) => {
    // Only proceed if we're in the browser
    if (typeof window === 'undefined') return;
    
    const finalQuery = query || searchQuery || "Find me a cheap hotel for tonight";
    
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    setIsStart(true);
    setIsLoading(true);
    setOutput("");
    setIsStreamFinished(false);

    try {
      // Make POST request with the query
      const response = await fetch("/api/chat-llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: finalQuery }),
      });

      if (!response.ok) {
        throw new Error("Failed to start hotel search");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response reader available");
      }

      const decoder = new TextDecoder();
      setIsLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === 'true') {
              setIsStreamFinished(true);
              setIsLoading(false);
            } else {
              const token = data.replaceAll(NEWLINE, "\n");
              setOutput((prevOutput) => prevOutput + token);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setOutput("❌ Failed to process your hotel search request. Please try again.");
      setIsLoading(false);
      setIsStreamFinished(true);
    }
  }, [searchQuery]);

  const resetChat = useCallback(() => {
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setIsStart(false);
    setOutput("");
    setIsStreamFinished(false);
    setIsLoading(false);
    setSearchQuery("");
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      startChat(searchQuery);
    }
  }, [searchQuery, startChat]);

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
            <form onSubmit={handleSubmit} className="llm-search-form">
              <div className="llm-input-group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., 'Find a hotel in New York for December 25-27 for 2 guests'"
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

            <div className="llm-quick-searches">
              <p className="llm-quick-label">Quick searches:</p>
              <div className="llm-quick-buttons">
                <button
                  onClick={() => handleQuickSearch("Find a cheap hotel in Paris for next weekend")}
                  className="llm-button llm-button-quick"
                >
                  Paris Next Weekend
                </button>
                <button
                  onClick={() => handleQuickSearch("Hotel in Tokyo for 2 people, December 20-22")}
                  className="llm-button llm-button-quick"
                >
                  Tokyo December
                </button>
                <button
                  onClick={() => handleQuickSearch("Budget hotel in London for 1 night")}
                  className="llm-button llm-button-quick"
                >
                  London Budget
                </button>
                <button
                  onClick={() => handleQuickSearch("Family hotel in Orlando for 4 guests, 3 nights")}
                  className="llm-button llm-button-quick"
                >
                  Orlando Family
                </button>
              </div>
            </div>
          </div>
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
              {isLoading && (
                <div className="llm-loading-indicator">
                  <div className="llm-spinner"></div>
                  <span>Searching hotels...</span>
                </div>
              )}
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
              <p>Starting hotel search...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LLMPage;
