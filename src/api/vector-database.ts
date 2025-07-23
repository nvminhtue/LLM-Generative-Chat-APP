import { HotelRoom } from './types';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

// Initialize the LLM for embeddings
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-001",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.1,
});

// Vector representation of a hotel room
interface HotelVector {
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
  embedding: number[];
  textRepresentation: string; // For similarity search
}

interface EmbeddingFile {
  csvHash: string;
  vectors: HotelVector[];
}

const CSV_PATH = path.join(process.cwd(), 'database', 'hotel-rooms.csv');
const EMBEDDINGS_PATH = path.join(process.cwd(), 'database', 'hotel-embeddings.json');

function hashFile(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

// In-memory vector database (in production, use a proper vector DB like Pinecone, Weaviate, etc.)
class HotelVectorDatabase {
  private vectors: HotelVector[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const csvHash = hashFile(CSV_PATH);

    // Try to load embeddings from file
    if (fs.existsSync(EMBEDDINGS_PATH)) {
      try {
        const file: EmbeddingFile = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, 'utf-8'));
        if (file.csvHash === csvHash) {
          this.vectors = file.vectors;
          this.isInitialized = true;
          console.log(`✅ Loaded ${this.vectors.length} hotel vectors from saved embeddings.`);
          return;
        } else {
          console.log('ℹ️ CSV changed, regenerating embeddings...');
        }
      } catch (e) {
        console.warn('⚠️ Failed to load embeddings, will regenerate.');
      }
    }

    // If not loaded, generate embeddings
    try {
      const csvData = fs.readFileSync(CSV_PATH, 'utf-8');
      const lines = csvData.split('\n').slice(1); // Skip header
      const hotelRooms: HotelRoom[] = lines
        .filter(line => line.trim())
        .map(line => {
          const [id, hotelName, roomType, price, currency, description, amenities, provider, rating, location, availability] = line.split(',');
          return {
            id,
            hotelName,
            roomType,
            price: parseFloat(price),
            currency,
            description,
            amenities: amenities.split(';'),
            provider,
            rating: parseFloat(rating),
            location,
            availability: availability === 'true'
          };
        });
      this.vectors = await this.convertToVectors(hotelRooms);
      // Save to file for future use
      const file: EmbeddingFile = { csvHash, vectors: this.vectors };
      fs.writeFileSync(EMBEDDINGS_PATH, JSON.stringify(file, null, 2));
      this.isInitialized = true;
      console.log(`✅ Generated and saved ${this.vectors.length} hotel vectors to embeddings file.`);
    } catch (error) {
      console.error('❌ Error initializing vector database:', error);
      throw error;
    }
  }

  // Convert hotel rooms to vectors with embeddings
  private async convertToVectors(hotelRooms: HotelRoom[]): Promise<HotelVector[]> {
    const vectors: HotelVector[] = [];

    for (const room of hotelRooms) {
      // Create text representation for embedding
      const textRepresentation = this.createTextRepresentation(room);
      
      // Generate embedding (simplified - in production use proper embedding model)
      const embedding = await this.generateEmbedding(textRepresentation);

      vectors.push({
        ...room,
        embedding,
        textRepresentation
      });
    }

    return vectors;
  }

  // Create text representation for embedding
  private createTextRepresentation(room: HotelRoom): string {
    return `${room.hotelName} ${room.roomType} ${room.description} ${room.amenities.join(' ')} ${room.location} ${room.provider} ${room.rating} stars ${room.price} ${room.currency}`.toLowerCase();
  }

  // Generate embedding using LLM (simplified approach)
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // In a real implementation, you'd use a proper embedding model
      // For now, we'll create a simple hash-based embedding
      const hash = this.simpleHash(text);
      const embedding = new Array(384).fill(0); // 384-dimensional vector
      
      // Distribute the hash across the embedding dimensions
      for (let i = 0; i < Math.min(hash.length, embedding.length); i++) {
        embedding[i] = (hash.charCodeAt(i) % 100) / 100; // Normalize to 0-1
      }
      
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return new Array(384).fill(0);
    }
  }

  // Simple hash function for demo purposes
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Calculate cosine similarity between two vectors
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Search for similar hotels based on query
  async search(query: string, limit: number = 5): Promise<HotelVector[]> {
    await this.initialize();

    // Generate embedding for the query
    const queryEmbedding = await this.generateEmbedding(query.toLowerCase());
    
    // Calculate similarities and sort
    const similarities = this.vectors.map(vector => ({
      vector,
      similarity: this.cosineSimilarity(queryEmbedding, vector.embedding)
    }));

    // Sort by similarity and return top results
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.vector);
  }

  // Search by specific criteria
  async searchByCriteria(criteria: {
    location?: string;
    maxPrice?: number;
    minRating?: number;
    amenities?: string[];
    roomType?: string;
  }): Promise<HotelVector[]> {
    await this.initialize();

    let filtered = this.vectors;

    if (criteria.location) {
      filtered = filtered.filter(v => 
        v.location.toLowerCase().includes(criteria.location!.toLowerCase())
      );
    }

    if (criteria.maxPrice) {
      filtered = filtered.filter(v => v.price <= criteria.maxPrice!);
    }

    if (criteria.minRating) {
      filtered = filtered.filter(v => v.rating >= criteria.minRating!);
    }

    if (criteria.amenities && criteria.amenities.length > 0) {
      filtered = filtered.filter(v => 
        criteria.amenities!.some(amenity => 
          v.amenities.some(a => a.toLowerCase().includes(amenity.toLowerCase()))
        )
      );
    }

    if (criteria.roomType) {
      filtered = filtered.filter(v => 
        v.roomType.toLowerCase().includes(criteria.roomType!.toLowerCase())
      );
    }

    return filtered;
  }

  // Get all vectors
  async getAllVectors(): Promise<HotelVector[]> {
    await this.initialize();
    return this.vectors;
  }

  // Get vector by ID
  async getVectorById(id: string): Promise<HotelVector | null> {
    await this.initialize();
    return this.vectors.find(v => v.id === id) || null;
  }
}

// Create singleton instance
export const hotelVectorDB = new HotelVectorDatabase();

// RAG query function
export async function ragQuery(userQuery: string): Promise<{
  query: string;
  results: HotelVector[];
  analysis: string;
}> {
  try {
    // Search for relevant hotels
    const searchResults = await hotelVectorDB.search(userQuery, 5);
    
    // Generate analysis using LLM
    const analysisPrompt = `You are a hotel recommendation expert. Analyze the search results and provide a helpful response to the user's query.

User Query: "${userQuery}"

Available Hotels:
${searchResults.map((hotel, index) => `
${index + 1}. ${hotel.hotelName} - ${hotel.roomType}
   Price: $${hotel.price} ${hotel.currency}
   Location: ${hotel.location}
   Rating: ${hotel.rating}/5
   Provider: ${hotel.provider}
   Amenities: ${hotel.amenities.join(', ')}
   Description: ${hotel.description}
`).join('\n')}

Provide a helpful analysis that:
1. Addresses the user's specific query
2. Highlights the best options based on their needs
3. Mentions key features like price, location, amenities
4. Gives a clear recommendation if appropriate

Keep the response conversational and helpful.`;

    const response = await llm.invoke([
      { role: 'user', content: analysisPrompt }
    ]);

    return {
      query: userQuery,
      results: searchResults,
      analysis: response.content as string
    };
  } catch (error) {
    console.error('Error in RAG query:', error);
    throw new Error('Failed to process RAG query');
  }
}

// Advanced search function
export async function advancedSearch(criteria: {
  query?: string;
  location?: string;
  maxPrice?: number;
  minRating?: number;
  amenities?: string[];
  roomType?: string;
}): Promise<{
  criteria: typeof criteria;
  results: HotelVector[];
  analysis: string;
}> {
  try {
    let results: HotelVector[] = [];

    if (criteria.query) {
      // Use vector search for semantic similarity
      results = await hotelVectorDB.search(criteria.query, 10);
    } else {
      // Use criteria-based filtering
      results = await hotelVectorDB.searchByCriteria(criteria);
    }

    // Apply additional filters if specified
    if (criteria.location) {
      results = results.filter(hotel => 
        hotel.location.toLowerCase().includes(criteria.location!.toLowerCase())
      );
    }

    if (criteria.maxPrice) {
      results = results.filter(hotel => hotel.price <= criteria.maxPrice!);
    }

    if (criteria.minRating) {
      results = results.filter(hotel => hotel.rating >= criteria.minRating!);
    }

    if (criteria.amenities && criteria.amenities.length > 0) {
      results = results.filter(hotel => 
        criteria.amenities!.some(amenity => 
          hotel.amenities.some(a => a.toLowerCase().includes(amenity.toLowerCase()))
        )
      );
    }

    if (criteria.roomType) {
      results = results.filter(hotel => 
        hotel.roomType.toLowerCase().includes(criteria.roomType!.toLowerCase())
      );
    }

    // Generate analysis
    const analysisPrompt = `Analyze these hotel search results based on the following criteria:

Search Criteria: ${JSON.stringify(criteria, null, 2)}

Found Hotels (${results.length}):
${results.map((hotel, index) => `
${index + 1}. ${hotel.hotelName} - ${hotel.roomType}
   Price: $${hotel.price} ${hotel.currency}
   Location: ${hotel.location}
   Rating: ${hotel.rating}/5
   Provider: ${hotel.provider}
   Amenities: ${hotel.amenities.join(', ')}
`).join('\n')}

Provide a comprehensive analysis that:
1. Summarizes the search results
2. Highlights the best options based on the criteria
3. Provides price range and value analysis
4. Mentions any notable features or considerations
5. Gives clear recommendations if appropriate`;

    const response = await llm.invoke([
      { role: 'user', content: analysisPrompt }
    ]);

    return {
      criteria,
      results,
      analysis: response.content as string
    };
  } catch (error) {
    console.error('Error in advanced search:', error);
    throw new Error('Failed to process advanced search');
  }
} 