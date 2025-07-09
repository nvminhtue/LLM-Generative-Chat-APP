'use client';

import {
  codeBlockLookBack,
  findCompleteCodeBlock,
  findPartialCodeBlock,
} from "@llm-ui/code";
import { markdownLookBack } from "@llm-ui/markdown";
import { useLLMOutput, useStreamExample } from "@llm-ui/react";

import MarkdownComponent from "./markdown";
import CodeBlock from "./code-block";

const example = `## Python

\`\`\`python
print('Hello llm-ui!')
<h1>Hello World</h1>
# Hello World
## Title
\`\`\`
...continues...
`;

const LLMPage = () => {
  const { isStreamFinished, output } = useStreamExample(example);

  const { blockMatches } = useLLMOutput({
    llmOutput: output,
    fallbackBlock: {
      component: MarkdownComponent, // from Step 1
      lookBack: markdownLookBack(),
    },
    blocks: [
      {
        component: CodeBlock, // from Step 2
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack(),
      },
    ],
    isStreamFinished,
  });

  return (
    <div>
      {blockMatches.map((blockMatch, index) => {
        const Component = blockMatch.block.component;
        return <Component key={index} blockMatch={blockMatch} />;
      })}
    </div>
  );
};

export default LLMPage;
