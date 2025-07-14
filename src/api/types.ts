export interface HotelSearchQuery {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

export interface HotelRoom {
  id: string;
  hotelName: string;
  roomType: string;
  price: number;
  currency: string;
  description: string;
  amenities: string[];
  provider: string;
  rating: number;
  location: string;
  availability: boolean;
}

export interface HotelSearchResult {
  provider: string;
  rooms: HotelRoom[];
  totalResults: number;
  searchQuery: HotelSearchQuery;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface WorkflowState {
  query: HotelSearchQuery;
  searchResults: HotelSearchResult[];
  cheapestOption?: HotelRoom;
  analysis: string;
  error?: string;
  conversationHistory: ChatMessage[];
  needsUserInput?: boolean;
  conversationComplete?: boolean;
} 