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

  const startChat = useCallback(() => {
    // Only proceed if we're in the browser
    if (typeof window === 'undefined') return;
    
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    setIsStart(true);
    setIsLoading(true);
    setOutput("");
    setIsStreamFinished(false);

    const eventSource = new EventSource("/api/chat-llm");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsLoading(true);
    };

    eventSource.onerror = (error) => {
      eventSource.close();
      setIsLoading(false);
      setIsStreamFinished(true);
    };

    eventSource.addEventListener("token", (e) => {
      const token = e.data.replaceAll(NEWLINE, "\n");
      
      // Use functional update to ensure proper state handling
      setOutput((prevOutput) => {
        const newOutput = prevOutput + token;
        return newOutput;
      });
      
      // Only set loading to false after we receive the first token
      setIsLoading(false);
    });

    eventSource.addEventListener("finished", (e) => {
      eventSource.close();
      setIsStreamFinished(true);
      setIsLoading(false);
      eventSourceRef.current = null;
    });

  }, []);

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
  }, []);

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
          <h1 className="llm-title">Hotel AI Assistant</h1>
          <p className="llm-subtitle">Get information about hotel booking platforms and more</p>
        </header>

        <div className="llm-controls">
          {!isStarted && (
            <button onClick={startChat} className="llm-button llm-button-primary">
              <span className="llm-button-icon">🚀</span>
              Start Chat
            </button>
          )}
          
          {isStarted && (
            <div className="llm-control-group">
              <button 
                onClick={resetChat} 
                className="llm-button llm-button-secondary"
                disabled={isLoading}
              >
                <span className="llm-button-icon">🔄</span>
                Reset Chat
              </button>
              {isLoading && (
                <div className="llm-loading-indicator">
                  <div className="llm-spinner"></div>
                  <span>AI is thinking...</span>
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
              <div className="llm-empty-icon">💭</div>
              <p>Starting conversation...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LLMPage;
