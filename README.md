# Hotel LLM - AI-Powered Hotel Price Comparison

This is an intelligent hotel booking assistant built with [Next.js](https://nextjs.org) and [LangGraph JS](https://js.langchain.com/docs/langgraph). The application uses AI to search across multiple hotel booking platforms and find the cheapest options for your travel needs.

## 🏨 Features

- **Smart Hotel Search**: Natural language hotel search queries (e.g., "Find a cheap hotel in Paris for next weekend")
- **Multi-Platform Comparison**: Searches across multiple hotel booking platforms (Booking.com, Expedia, Hotels.com)
- **LangGraph Workflow**: Orchestrated AI workflow using LangGraph JS for intelligent processing
- **Real-time Streaming**: Stream search results and analysis in real-time
- **Cheapest Option Recommendation**: Automatically finds and recommends the most affordable option
- **Modern UI**: Beautiful, responsive interface with quick search options

## 🚀 How It Works

1. **Query Parsing**: AI parses your natural language query to extract search parameters
2. **Multi-Platform Search**: Searches hotel providers simultaneously for better coverage
3. **Price Analysis**: Compares all results and identifies the cheapest option
4. **AI Recommendation**: Provides detailed analysis and recommendations

## Prerequisites

This project uses:
- **pnpm** as the package manager
- **Node.js** version specified in `.tool-versions`
- **Google Gemini API** for AI processing

## Getting Started

### 1. Install Dependencies

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

### 2. Environment Setup

Create a `.env.local` file in the root directory and add your API keys:

```bash
# Google Gemini API Key (required)
# Get your API key from: https://ai.google.dev/
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000/llm](http://localhost:3000/llm) with your browser to access the hotel search interface.

## 💡 Usage Examples

Try these natural language queries:

- "Find a cheap hotel in New York for December 25-27 for 2 guests"
- "Budget hotel in London for 1 night"
- "Family hotel in Orlando for 4 guests, 3 nights"
- "Hotel in Tokyo for 2 people, next weekend"

## 🏗️ Architecture

### LangGraph Workflow

The application uses a LangGraph workflow with three main nodes:

1. **Parse Query** - Extracts search parameters from natural language
2. **Search Hotels** - Queries multiple hotel booking platforms
3. **Analyze & Select** - Finds cheapest option and provides recommendations

### Project Structure

```
src/
├── api/
│   ├── types.ts              # TypeScript interfaces
│   ├── hotel-providers.ts    # Hotel API integrations
│   └── hotel-workflow.ts     # LangGraph workflow
├── app/
│   ├── api/chat-llm/        # API routes
│   └── llm/                 # Frontend interface
```

## 🔧 Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **AI/LLM**: Google Gemini, LangChain, LangGraph JS
- **Styling**: CSS Modules with modern gradients and animations
- **API Integration**: Axios for HTTP requests
- **Date Handling**: date-fns for date operations

## 🔄 Extending the System

### Adding New Hotel Providers

1. Create a new provider class in `src/api/hotel-providers.ts`
2. Implement the `searchHotels` method
3. Add the provider to the `hotelProviders` object
4. Update the `searchAllProviders` function

### Customizing the Workflow

The LangGraph workflow can be extended by:
- Adding new nodes for additional processing steps
- Implementing conditional routing based on search criteria
- Adding caching mechanisms for frequent searches

## 🚀 Deployment

### Environment Variables for Production

```bash
GEMINI_API_KEY=your_production_gemini_api_key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/hotel-llm)

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new).

## 📚 Learn More

- [LangGraph JS Documentation](https://js.langchain.com/docs/langgraph)
- [Google Gemini API](https://ai.google.dev/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
