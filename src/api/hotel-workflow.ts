// LangGraph-inspired workflow with better state management and error handling
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

// Node functions with improved error handling and state management
async function parseQuery(state: WorkflowState): Promise<WorkflowState> {
  console.log("🔍 Parsing user query...");

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
        ...state,
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
      ...state,
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
      ...state,
      error: "Could not parse your hotel search request. Please provide destination, dates, and number of guests.",
      analysis: "Failed to parse query",
      conversationHistory: newConversationHistory,
      needsUserInput: true,
    };
  }
}

async function searchHotels(state: WorkflowState): Promise<WorkflowState> {
  console.log("🏨 Searching hotels across multiple providers...");

  if (!state.query || !state.query.destination) {
    return {
      ...state,
      error: "No search query available",
      analysis: "Search failed - missing query",
    };
  }

  try {
    const searchResults = await searchAllProviders(state.query);

    return {
      ...state,
      searchResults,
      analysis: `Found ${searchResults.reduce(
        (total, result) => total + result.totalResults,
        0
      )} hotels across ${searchResults.length} providers`,
    };
  } catch {
    return {
      ...state,
      error: "Failed to search hotel providers",
      analysis: "Hotel search failed",
    };
  }
}

async function analyzeAndSelectCheapest(state: WorkflowState): Promise<WorkflowState> {
  console.log("💰 Analyzing prices and selecting cheapest option...");

  if (!state.searchResults || state.searchResults.length === 0) {
    return {
      ...state,
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
      ...state,
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
        ...state,
        cheapestOption,
        analysis: response.content as string,
    };
}

// LangGraph-inspired workflow with conditional execution and state management
export const hotelWorkflow = {
  async invoke(initialState: WorkflowState): Promise<WorkflowState> {
    console.log("🚀 Starting LangGraph-inspired hotel workflow...");
    
    let state = { ...initialState };

    // Node execution with conditional flow control (LangGraph concept)
    const nodes = {
      parseQuery,
      searchHotels,
      analyzeAndSelectCheapest
    };

    // Step 1: Parse Query (with conditional routing)
    try {
      console.log("📍 Executing node: parseQuery");
      state = await nodes.parseQuery(state);
      
      // Conditional edge: stop if error or needs user input
      if (state.error || state.needsUserInput) {
        console.log("❌ Workflow stopped: needs user input or error occurred");
        return state;
      }
    } catch (error) {
      console.error("Parse Query Error:", error);
      return { ...state, error: "Failed to parse query", analysis: "Parse error" };
    }

    // Step 2: Search Hotels (with conditional routing)
    try {
      console.log("📍 Executing node: searchHotels");
      state = await nodes.searchHotels(state);
      
      // Conditional edge: stop if error
      if (state.error) {
        console.log("❌ Workflow stopped: hotel search failed");
        return state;
      }
    } catch (error) {
      console.error("Search Hotels Error:", error);
      return { ...state, error: "Failed to search hotels", analysis: "Search error" };
    }

    // Step 3: Analyze and Select (final node)
    try {
      console.log("📍 Executing node: analyzeAndSelectCheapest");
      state = await nodes.analyzeAndSelectCheapest(state);
      console.log("✅ Workflow completed successfully");
      return state;
    } catch (error) {
      console.error("Analysis Error:", error);
      return { ...state, error: "Failed to analyze results", analysis: "Analysis error" };
    }
  },
};

// Helper function to run the workflow
export async function findCheapestHotel(
  userQuery: string,
  conversationHistory: ChatMessage[] = []
): Promise<WorkflowState> {
  // Add the user's new message to conversation history
  const newUserMessage: ChatMessage = {
    role: 'user',
    content: userQuery,
    timestamp: new Date()
  };
  
  const updatedHistory = [...conversationHistory, newUserMessage];
  
  const initialState: WorkflowState = {
    query: {} as HotelSearchQuery,
    searchResults: [],
    analysis: userQuery,
    conversationHistory: updatedHistory,
  };

  try {
    const result = await hotelWorkflow.invoke(initialState);
    return result;
  } catch (error) {
    console.error("Workflow error:", error);
    return {
      query: {} as HotelSearchQuery,
      searchResults: [],
      analysis: "An error occurred while processing your hotel search request.",
      error: "Workflow execution failed",
      conversationHistory: updatedHistory,
    };
  }
}

/* 
LangGraph Benefits Demonstrated:

1. **State Management**: Immutable state updates with spread operator (...state)
2. **Conditional Routing**: Workflow stops or continues based on state conditions
3. **Error Handling**: Try-catch blocks around each node with proper error propagation
4. **Node Isolation**: Each function is a pure node that takes state and returns new state
5. **Logging**: Clear workflow execution tracking for debugging
6. **Workflow Visualization**: Easy to understand the flow: parseQuery → searchHotels → analyzeAndSelectCheapest

To use full LangGraph features in the future:
- Add workflow checkpointing for resumability  
- Implement parallel node execution
- Add workflow visualization/debugging tools
- Use LangGraph's built-in state management features
*/
