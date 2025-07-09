import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type LLMOutputComponent } from "@llm-ui/react";
import "./markdown.css";

// Customize this component with your own styling
const MarkdownComponent: LLMOutputComponent = ({ blockMatch }) => {
  const markdown = blockMatch.output;
  return (
    <div className="markdown-content">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom heading styling
          h1: ({ children }) => (
            <h1 className="markdown-h1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="markdown-h2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="markdown-h3">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="markdown-h4">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="markdown-h5">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="markdown-h6">{children}</h6>
          ),
          // Custom paragraph styling
          p: ({ children }) => (
            <p className="markdown-paragraph">{children}</p>
          ),
          // Custom list styling
          ul: ({ children }) => (
            <ul className="markdown-ul">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="markdown-ol">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="markdown-li">{children}</li>
          ),
          // Custom link styling
          a: ({ href, children }) => (
            <a href={href} className="markdown-link" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          // Custom blockquote styling
          blockquote: ({ children }) => (
            <blockquote className="markdown-blockquote">{children}</blockquote>
          ),
          // Custom code styling
          code: ({ children, className }) => {
            const isInline = !className?.includes('language-');
            return (
              <code className={isInline ? "markdown-inline-code" : "markdown-code"}>
                {children}
              </code>
            );
          },
          // Custom table styling
          table: ({ children }) => (
            <div className="markdown-table-container">
              <table className="markdown-table">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="markdown-thead">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="markdown-tbody">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="markdown-tr">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="markdown-th">{children}</th>
          ),
          td: ({ children }) => (
            <td className="markdown-td">{children}</td>
          ),
          // Custom horizontal rule
          hr: () => <hr className="markdown-hr" />,
          // Custom strong/bold text
          strong: ({ children }) => (
            <strong className="markdown-strong">{children}</strong>
          ),
          // Custom emphasis/italic text
          em: ({ children }) => (
            <em className="markdown-em">{children}</em>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownComponent;
