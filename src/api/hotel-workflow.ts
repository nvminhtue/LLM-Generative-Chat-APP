// Using LangGraph StateGraph for robust workflow orchestration
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { WorkflowState, HotelSearchQuery, HotelRoom, ChatMessage } from "./types";
import { searchAllProviders } from "./hotel-providers";

// Initialize the LLM
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-001",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.1,
});

// Define the state using LangGraph Annotations
const GraphState = Annotation.Root({
  query: Annotation<HotelSearchQuery>({
    reducer: (current, update) => update ?? current,
    default: () => ({} as HotelSearchQuery),
  }),
  searchResults: Annotation<any[]>({
    reducer: (current, update) => update ?? current,
    default: () => [],
  }),
  cheapestOption: Annotation<HotelRoom>({
    reducer: (current, update) => update ?? current,
    default: () => ({} as HotelRoom),
  }),
  analysis: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => "",
  }),
  error: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => "",
  }),
  conversationHistory: Annotation<ChatMessage[]>({
    reducer: (current, update) => update ?? current,
    default: () => [],
  }),
  needsUserInput: Annotation<boolean>({
    reducer: (current, update) => update !== undefined ? update : current,
    default: () => false,
  }),
});

// LangGraph Node Functions - must return partial state updates
async function parseQuery(state: typeof GraphState.State) {
  console.log("🔍 [LangGraph Node] Parsing user query...");

  // Build conversation context
  const conversationContext = state.conversationHistory
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');
  
  const hasContext = state.conversationHistory.length > 0;
  
  const systemPrompt = `You are a hotel search assistant. ${hasContext ? 'Continue this conversation by' : 'Parse the user\'s natural language query and'} extract hotel search parameters.
  
  ${hasContext ? 'Previous conversation context:\n' + conversationContext + '\n\n' : ''}
  
  Extract the following information:
  - destination: The city/location they want to stay
  - checkIn: Check-in date (convert to YYYY-MM-DD format, use context if dates mentioned previously)
  - checkOut: Check-out date (convert to YYYY-MM-DD format, use context if dates mentioned previously)  
  - guests: Number of guests (default to 1 if not specified, use context if mentioned previously)
  - rooms: Number of rooms (default to 1 if not specified, use context if mentioned previously)
  
  ${hasContext ? 'Use the conversation history to fill in missing information. If the user is providing additional details (like dates), combine them with previous information.' : 'If any required information is missing, ask for clarification.'}
  
  Respond ONLY with a JSON object in this exact format:
  {
    "destination": "string",
    "checkIn": "YYYY-MM-DD",
    "checkOut": "YYYY-MM-DD",
    "guests": number,
    "rooms": number,
    "needsClarification": boolean,
    "clarificationMessage": "string (only if needsClarification is true)"
  }`;

  const currentMessage = state.conversationHistory.length > 0 
    ? state.conversationHistory[state.conversationHistory.length - 1].content
    : (state.analysis || "Find me a hotel for tomorrow");

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(currentMessage),
  ]);

  try {
    // Extract JSON from markdown code blocks if present
    let jsonString = response.content as string;
    const jsonMatch = jsonString.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonString.trim());

    if (parsed.needsClarification) {
      const newConversationHistory = [
        ...state.conversationHistory,
        { role: 'assistant' as const, content: parsed.clarificationMessage, timestamp: new Date() }
      ];
      
      return {
        error: parsed.clarificationMessage,
        analysis: "Query needs clarification",
        conversationHistory: newConversationHistory,
        needsUserInput: true,
      };
    }

    const checkIn = parsed.checkIn || new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
    const checkOut = parsed.checkOut || new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0];
    const guests = parsed.guests || 1;
    const rooms = parsed.rooms || 1;

    return {
      query: {
        destination: parsed.destination,
        checkIn,
        checkOut,
        guests,
        rooms,
      },
      analysis: `Searching for hotels in ${parsed.destination} from ${checkIn} to ${checkOut} for ${guests} guests in ${rooms} room(s)`,
    };
  } catch {
    const newConversationHistory = [
      ...state.conversationHistory,
      { role: 'assistant' as const, content: "Could not parse your hotel search request. Please provide destination, dates, and number of guests.", timestamp: new Date() }
    ];
    
    return {
      error: "Could not parse your hotel search request. Please provide destination, dates, and number of guests.",
      analysis: "Failed to parse query",
      conversationHistory: newConversationHistory,
      needsUserInput: true,
    };
  }
}

async function searchHotels(state: typeof GraphState.State) {
  console.log("🏨 [LangGraph Node] Searching hotels across multiple providers...");

  if (!state.query || !state.query.destination) {
    return {
      error: "No search query available",
      analysis: "Search failed - missing query",
    };
  }

  try {
    const searchResults = await searchAllProviders(state.query);

    return {
      searchResults,
      analysis: `Found ${searchResults.reduce(
        (total, result) => total + result.totalResults,
        0
      )} hotels across ${searchResults.length} providers`,
    };
  } catch {
    return {
      error: "Failed to search hotel providers",
      analysis: "Hotel search failed",
    };
  }
}

async function analyzeAndSelectCheapest(state: typeof GraphState.State) {
  console.log("💰 [LangGraph Node] Analyzing prices and selecting cheapest option...");

  if (!state.searchResults || state.searchResults.length === 0) {
    return {
      error: "No search results to analyze",
      analysis: "Analysis failed - no results",
    };
  }

  // Collect all rooms from all providers
  const allRooms: HotelRoom[] = [];
  state.searchResults.forEach((result) => {
    allRooms.push(...result.rooms);
  });

  if (allRooms.length === 0) {
    return {
      error: "No hotel rooms found",
      analysis: "No available rooms found",
    };
  }

  // Find the cheapest room
  const cheapestOption = allRooms.reduce((cheapest, current) => {
    return current.price < cheapest.price ? current : cheapest;
  });

  // Generate analysis using LLM
  const systemPrompt = `You are a hotel recommendation expert. Analyze the hotel search results and provide a comprehensive recommendation focusing on the cheapest option.

    Include:
    1. Summary of the cheapest option with key details
    2. Brief comparison with other options
    3. Value proposition and what makes this a good choice
    4. Any important considerations for the traveler

    Be concise but informative.`;

    const userPrompt = `Here are the hotel search results:

    Cheapest Option:
    - Hotel: ${cheapestOption.hotelName}
    - Room: ${cheapestOption.roomType}
    - Price: $${cheapestOption.price} per night
    - Provider: ${cheapestOption.provider}
    - Rating: ${cheapestOption.rating}/5
    - Amenities: ${cheapestOption.amenities.join(", ")}

    All Available Options:
    ${allRooms
    .map(
        (room) =>
        `- ${room.hotelName} (${room.roomType}): $${room.price}/night - ${room.provider} - ${room.rating}/5`
    )
    .join("\n")}

    Provide your analysis and recommendation.`;

    const response = await llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
    ]);

    return {
        cheapestOption,
        analysis: response.content as string,
    };
}

// Conditional routing functions for LangGraph edges
function shouldContinueToSearch(state: typeof GraphState.State): string {
  console.log("🔀 [LangGraph Router] Checking if should continue to search...");
  if (state.error || state.needsUserInput) {
    console.log("❌ [LangGraph Router] Stopping workflow - error or needs user input");
    return END;
  }
  console.log("✅ [LangGraph Router] Continuing to search hotels");
  return "searchHotels";
}

function shouldContinueToAnalysis(state: typeof GraphState.State): string {
  console.log("🔀 [LangGraph Router] Checking if should continue to analysis...");
  if (state.error) {
    console.log("❌ [LangGraph Router] Stopping workflow - search error");
    return END;
  }
  console.log("✅ [LangGraph Router] Continuing to analysis");
  return "analyzeAndSelectCheapest";
}

// Create the LangGraph StateGraph
const createHotelWorkflowGraph = () => {
  console.log("🏗️ [LangGraph] Creating StateGraph workflow...");
  
  const workflow = new StateGraph(GraphState)
    // Add nodes to the graph
    .addNode("parseQuery", parseQuery)
    .addNode("searchHotels", searchHotels)
    .addNode("analyzeAndSelectCheapest", analyzeAndSelectCheapest)
    
    // Define the workflow edges
    .addEdge(START, "parseQuery")
    .addConditionalEdges("parseQuery", shouldContinueToSearch, {
      searchHotels: "searchHotels",
      [END]: END,
    })
    .addConditionalEdges("searchHotels", shouldContinueToAnalysis, {
      analyzeAndSelectCheapest: "analyzeAndSelectCheapest", 
      [END]: END,
    })
    .addEdge("analyzeAndSelectCheapest", END);

  console.log("✅ [LangGraph] StateGraph workflow created successfully");
  return workflow.compile();
};

// Compile the LangGraph workflow
export const hotelWorkflow = createHotelWorkflowGraph();

// Helper function to run the LangGraph workflow
export async function findCheapestHotel(
  userQuery: string,
  conversationHistory: ChatMessage[] = []
): Promise<WorkflowState> {
  console.log("🚀 [LangGraph] Starting hotel search workflow...");
  
  // Add the user's new message to conversation history
  const newUserMessage: ChatMessage = {
    role: 'user',
    content: userQuery,
    timestamp: new Date()
  };
  
  const updatedHistory = [...conversationHistory, newUserMessage];
  
  const initialState = {
    query: {} as HotelSearchQuery,
    searchResults: [],
    analysis: userQuery,
    conversationHistory: updatedHistory,
    error: "",
    cheapestOption: {} as HotelRoom,
    needsUserInput: false,
  };

  try {
    console.log("📊 [LangGraph] Invoking StateGraph with initial state");
    const result = await hotelWorkflow.invoke(initialState);
    console.log("✅ [LangGraph] Workflow completed successfully");
    return result as WorkflowState;
  } catch (error) {
    console.error("❌ [LangGraph] Workflow execution failed:", error);
    return {
      query: {} as HotelSearchQuery,
      searchResults: [],
      analysis: "An error occurred while processing your hotel search request.",
      error: "LangGraph workflow execution failed",
      conversationHistory: updatedHistory,
    };
  }
}

/* 
🎯 LangGraph Features Implemented:

✅ **StateGraph**: Proper graph-based workflow orchestration
✅ **Annotation-based State**: Type-safe state definition with reducers
✅ **Nodes**: Pure functions that return partial state updates
✅ **Edges**: START, conditional edges, and END transitions
✅ **Conditional Routing**: Smart workflow decisions based on state
✅ **Graph Compilation**: Optimized execution plan
✅ **Error Handling**: Graceful error propagation through state
✅ **Logging**: Detailed workflow execution tracking

🚀 Benefits over simple sequential workflow:
- Automatic state merging and validation
- Visual workflow representation (can be exported)
- Better error recovery and retry mechanisms  
- Parallelizable node execution (future enhancement)
- Checkpoint/resume capabilities (future enhancement)
- Built-in debugging and monitoring tools
*/
