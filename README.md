# Hotel LLM - Generative Chat App

This is an LLM Generative Chat App built with [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Prerequisites

This project uses:
- **pnpm** as the package manager
- **tool-versions** for version management (make sure you have asdf or similar tool installed)

## Getting Started

First, ensure you have the correct Node.js version installed:

```bash
# If using asdf
asdf install

# Or check .tool-versions for the required versions
```

Install dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the chat interface by modifying `app/llm/page.tsx`. The page auto-updates as you edit the file.

## Features

- **LLM Chat Interface**: Interactive chat interface for communicating with language models
- **Markdown Support**: Rich text rendering for AI responses
- **Real-time Streaming**: Stream responses from LLM for better user experience

## Project Structure

- `/src/app/llm/` - Main chat interface and components
- `/src/app/api/chat-llm/` - API routes for LLM communication
- `/src/api/` - Additional API utilities

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
