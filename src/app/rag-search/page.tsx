"use client";
import { RagSearchForm } from '../llm/components/RagSearchForm';
import '../llm/page.css';

export default function RagSearchPage() {
  return (
    <div className="llm-page">
      <div className="llm-container">
        <header className="llm-header">
          <h1 className="llm-title">🏨 Hotel RAG Search</h1>
          <p className="llm-subtitle">
            Search our hotel database using AI-powered vector search and retrieval-augmented generation
          </p>
        </header>
        <div className="llm-content">
          <RagSearchForm />
        </div>
      </div>
    </div>
  );
} 