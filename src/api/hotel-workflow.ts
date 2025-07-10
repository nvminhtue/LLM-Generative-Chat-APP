import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { WorkflowState, HotelSearchQuery, HotelRoom } from './types';
import { searchAllProviders } from './hotel-providers';

// Initialize the LLM
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-001",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.1,
});

// Node functions
async function parseQuery(state: WorkflowState): Promise<Partial<WorkflowState>> {
  console.log("🔍 Parsing user query...");
  
  const systemPrompt = `You are a hotel search assistant. Parse the user's natural language query and extract hotel search parameters.
  
  Extract the following information:
  - destination: The city/location they want to stay
  - checkIn: Check-in date (convert to YYYY-MM-DD format)
  - checkOut: Check-out date (convert to YYYY-MM-DD format)  
  - guests: Number of guests (default to 2 if not specified)
  - rooms: Number of rooms (default to 1 if not specified)
  
  If any required information is missing, make reasonable assumptions or ask for clarification.
  
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

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(state.analysis || "Find me a hotel for tonight")
  ]);

  try {
    const parsed = JSON.parse(response.content as string);
    
    if (parsed.needsClarification) {
      return {
        error: parsed.clarificationMessage,
        analysis: "Query needs clarification"
      };
    }

    return {
      query: {
        destination: parsed.destination,
        checkIn: parsed.checkIn,
        checkOut: parsed.checkOut,
        guests: parsed.guests,
        rooms: parsed.rooms
      },
      analysis: `Searching for hotels in ${parsed.destination} from ${parsed.checkIn} to ${parsed.checkOut} for ${parsed.guests} guests in ${parsed.rooms} room(s)`
    };
  } catch (error) {
    return {
      error: "Could not parse your hotel search request. Please provide destination, dates, and number of guests.",
      analysis: "Failed to parse query"
    };
  }
}

async function searchHotels(state: WorkflowState): Promise<Partial<WorkflowState>> {
  console.log("🏨 Searching hotels across multiple providers...");
  
  if (!state.query) {
    return {
      error: "No search query available",
      analysis: "Search failed - missing query"
    };
  }

  try {
    const searchResults = await searchAllProviders(state.query);
    
    return {
      searchResults,
      analysis: `Found ${searchResults.reduce((total, result) => total + result.totalResults, 0)} hotels across ${searchResults.length} providers`
    };
  } catch (error) {
    return {
      error: "Failed to search hotel providers",
      analysis: "Hotel search failed"
    };
  }
}

async function analyzeAndSelectCheapest(state: WorkflowState): Promise<Partial<WorkflowState>> {
  console.log("💰 Analyzing prices and selecting cheapest option...");
  
  if (!state.searchResults || state.searchResults.length === 0) {
    return {
      error: "No search results to analyze",
      analysis: "Analysis failed - no results"
    };
  }

  // Collect all rooms from all providers
  const allRooms: HotelRoom[] = [];
  state.searchResults.forEach(result => {
    allRooms.push(...result.rooms);
  });

  if (allRooms.length === 0) {
    return {
      error: "No hotel rooms found",
      analysis: "No available rooms found"
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
- Amenities: ${cheapestOption.amenities.join(', ')}

All Available Options:
${allRooms.map(room => 
  `- ${room.hotelName} (${room.roomType}): $${room.price}/night - ${room.provider} - ${room.rating}/5`
).join('\n')}

Provide your analysis and recommendation.`;

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt)
  ]);

  return {
    cheapestOption,
    analysis: response.content as string
  };
}

// Create the workflow graph
const workflow = new StateGraph<WorkflowState>({
  channels: {
    query: null,
    searchResults: null,
    cheapestOption: null,
    analysis: null,
    error: null
  }
});

// Add nodes
workflow.addNode("parseQuery", parseQuery);
workflow.addNode("searchHotels", searchHotels);
workflow.addNode("analyzeAndSelect", analyzeAndSelectCheapest);

// Add edges
workflow.addEdge(START, "parseQuery");
workflow.addConditionalEdges(
  "parseQuery",
  (state: WorkflowState) => {
    if (state.error) {
      return END;
    }
    return "searchHotels";
  }
);
workflow.addEdge("searchHotels", "analyzeAndSelect");
workflow.addEdge("analyzeAndSelect", END);

// Compile the workflow
export const hotelWorkflow = workflow.compile();

// Helper function to run the workflow
export async function findCheapestHotel(userQuery: string): Promise<WorkflowState> {
  const initialState: WorkflowState = {
    query: {} as HotelSearchQuery,
    searchResults: [],
    analysis: userQuery
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
      error: "Workflow execution failed"
    };
  }
} 