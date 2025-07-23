import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <h1 className={styles.title}>🏨 Hotel LLM - AI-Powered Hotel Search</h1>
        <p className={styles.description}>
          Intelligent hotel booking assistant with RAG-powered search capabilities
        </p>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="/llm"
          >
            🚀 Try Hotel Search
          </a>
          <a
            href="/rag-search"
            className={styles.secondary}
          >
            🔍 RAG Search
          </a>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>🤖 AI-Powered Search</h3>
            <p>Natural language hotel search with intelligent recommendations</p>
          </div>
          <div className={styles.feature}>
            <h3>🔍 Vector Database</h3>
            <p>RAG system with semantic search across 20+ hotel options</p>
          </div>
          <div className={styles.feature}>
            <h3>💰 Price Comparison</h3>
            <p>Compare prices across multiple booking platforms</p>
          </div>
        </div>
      </main>
      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
