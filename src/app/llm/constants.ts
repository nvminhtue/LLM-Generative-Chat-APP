export const NEWLINE = "$NEWLINE$";

export const QUICK_SEARCHES = [
  {
    label: "Paris Next Weekend",
    query: "Find a cheap hotel in Paris for next weekend"
  },
  {
    label: "Tokyo December", 
    query: "Hotel in Tokyo for 2 people, December 20-22"
  },
  {
    label: "London Budget",
    query: "Budget hotel in London for 1 night"
  },
  {
    label: "Orlando Family",
    query: "Family hotel in Orlando for 4 guests, 3 nights"
  }
];

export const DEFAULT_QUERY = "Find me a cheap hotel for tonight";

export const MESSAGES = {
  ERROR: "❌ Failed to process your hotel search request. Please try again.",
  LOADING: "Searching hotels...",
  STARTING: "Starting hotel search...",
  NO_READER: "No response reader available",
  FAILED_START: "Failed to start hotel search"
};

export const PLACEHOLDERS = {
  SEARCH: "e.g., 'Find a hotel in New York for December 25-27 for 2 guests'",
  FOLLOWUP: "Please provide the requested information..."
}; 