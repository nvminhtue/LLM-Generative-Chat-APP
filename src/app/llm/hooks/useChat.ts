import { useState, useCallback, useRef, useEffect } from "react";
import { ChatMessage } from "../../../api/types";
import { NEWLINE, DEFAULT_QUERY, MESSAGES } from "../constants";

interface ChatState {
  output: string;
  isStarted: boolean;
  isStreamFinished: boolean;
  isLoading: boolean;
  conversationHistory: ChatMessage[];
  currentStreamingMessage: string;
  needsUserInput: boolean;
  conversationComplete: boolean;
  hasResults: boolean;
}

interface ChatActions {
  startChat: (query?: string, isFollowUp?: boolean) => Promise<void>;
  resetChat: () => void;
  setOutput: React.Dispatch<React.SetStateAction<string>>;
  setConversationHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export interface UseChatReturn extends ChatState, ChatActions {}

export const useChat = (): UseChatReturn => {
  const [output, setOutput] = useState<string>("");
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isStreamFinished, setIsStreamFinished] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>("");
  const [needsUserInput, setNeedsUserInput] = useState<boolean>(false);
  const [conversationComplete, setConversationComplete] = useState<boolean>(false);
  const [hasResults, setHasResults] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Cleanup function to close EventSource
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleStreamEvent = useCallback((eventType: string, data: string) => {
    switch (eventType) {
      case 'conversation':
        try {
          const newHistory = JSON.parse(data) as ChatMessage[];
          console.log('Received conversation history:', newHistory);
          setConversationHistory(newHistory);
          
          // Clear streaming message if we have a new assistant message
          const lastMessage = newHistory[newHistory.length - 1];
          console.log('Last message:', lastMessage);
          if (lastMessage && lastMessage.role === 'assistant') {
            console.log('Clearing currentStreamingMessage due to new assistant message');
            setCurrentStreamingMessage("");
          }
        } catch (e) {
          console.error('Failed to parse conversation history:', e);
        }
        break;
      
      case 'state':
        try {
          const state = JSON.parse(data);
          setNeedsUserInput(state.needsUserInput || false);
          setConversationComplete(state.conversationComplete || false);
          setHasResults(state.hasResults || false);
        } catch (e) {
          console.error('Failed to parse state:', e);
        }
        break;
      
      case 'token':
        if (data === 'true') {
          console.log('Token stream finished');
          setIsStreamFinished(true);
          setIsLoading(false);
        } else {
          const token = data.replaceAll(NEWLINE, "\n");
          console.log('Received token:', token);
          
          // Build up the current streaming message for real-time display
          setCurrentStreamingMessage((prev) => {
            const newValue = prev + token;
            console.log('Updated currentStreamingMessage length:', newValue.length);
            return newValue;
          });
          
          // Keep output state for backward compatibility
          setOutput((prevOutput) => prevOutput + token);
        }
        break;
      
      case 'finished':
        setIsStreamFinished(true);
        setIsLoading(false);
        break;
    }
  }, []);

  const processStreamResponse = useCallback(async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder();
    setIsLoading(false);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('event: ')) {
          const eventType = line.slice(7);
          
          // Get the data from the next line
          const nextLineIndex = i + 1;
          if (nextLineIndex < lines.length && lines[nextLineIndex].startsWith('data: ')) {
            const data = lines[nextLineIndex].slice(6);
            handleStreamEvent(eventType, data);
          }
        }
      }
    }
  }, [handleStreamEvent]);

  const startChat = useCallback(async (query?: string, isFollowUp = false) => {
    // Only proceed if we're in the browser
    if (typeof window === 'undefined') return;
    
    const finalQuery = query || DEFAULT_QUERY;
    
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    // Note: User message will be added by backend via conversation events
    
    if (!isFollowUp) {
      setIsStarted(true);
      setOutput("");
      setCurrentStreamingMessage("");
      setNeedsUserInput(false);
      setConversationComplete(false);
      setHasResults(false);
    }
    
    setIsLoading(true);
    setIsStreamFinished(false);
    setCurrentStreamingMessage(""); // Reset streaming message for new response

    try {
      // Make POST request with the query and conversation history
      const response = await fetch("/api/chat-llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query: finalQuery,
          conversationHistory: conversationHistory 
        }),
      });

      if (!response.ok) {
        throw new Error(MESSAGES.FAILED_START);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error(MESSAGES.NO_READER);
      }

      await processStreamResponse(reader);
    } catch (error) {
      console.error('Chat error:', error);
      setOutput(MESSAGES.ERROR);
      setIsLoading(false);
      setIsStreamFinished(true);
    }
  }, [conversationHistory, processStreamResponse]);

  const resetChat = useCallback(() => {
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setIsStarted(false);
    setOutput("");
    setIsStreamFinished(false);
    setIsLoading(false);
    setConversationHistory([]);
    setCurrentStreamingMessage("");
    setNeedsUserInput(false);
    setConversationComplete(false);
    setHasResults(false);
  }, []);

  return {
    // State
    output,
    isStarted,
    isStreamFinished,
    isLoading,
    conversationHistory,
    currentStreamingMessage,
    needsUserInput,
    conversationComplete,
    hasResults,
    
    // Actions
    startChat,
    resetChat,
    setOutput,
    setConversationHistory,
  };
}; 