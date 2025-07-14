import { HotelSearchQuery, HotelSearchResult, HotelRoom } from './types';

// Mock hotel providers - In production, replace with real APIs
class BookingComProvider {
  async searchHotels(query: HotelSearchQuery): Promise<HotelSearchResult> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockRooms: HotelRoom[] = [
      {
        id: 'booking-1',
        hotelName: 'Grand Plaza Hotel',
        roomType: 'Standard Room',
        price: 120,
        currency: 'USD',
        description: 'Comfortable room with city view',
        amenities: ['Free WiFi', 'Air Conditioning', 'Mini Bar'],
        provider: 'Booking.com',
        rating: 4.2,
        location: query.destination,
        availability: true
      },
      {
        id: 'booking-2',
        hotelName: 'Luxury Resort & Spa',
        roomType: 'Deluxe Suite',
        price: 280,
        currency: 'USD',
        description: 'Luxurious suite with ocean view',
        amenities: ['Free WiFi', 'Spa Access', 'Ocean View', 'Balcony'],
        provider: 'Booking.com',
        rating: 4.8,
        location: query.destination,
        availability: true
      }
    ];

    return {
      provider: 'Booking.com',
      rooms: mockRooms,
      totalResults: mockRooms.length,
      searchQuery: query
    };
  }
}

class ExpediaProvider {
  async searchHotels(query: HotelSearchQuery): Promise<HotelSearchResult> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const mockRooms: HotelRoom[] = [
      {
        id: 'expedia-1',
        hotelName: 'Business Inn',
        roomType: 'Executive Room',
        price: 95,
        currency: 'USD',
        description: 'Modern room perfect for business travelers',
        amenities: ['Free WiFi', 'Business Center', 'Gym'],
        provider: 'Expedia',
        rating: 4.0,
        location: query.destination,
        availability: true
      },
      {
        id: 'expedia-2',
        hotelName: 'Boutique Hotel Downtown',
        roomType: 'Premium Room',
        price: 150,
        currency: 'USD',
        description: 'Stylish room in the heart of downtown',
        amenities: ['Free WiFi', 'Rooftop Bar', 'Concierge'],
        provider: 'Expedia',
        rating: 4.5,
        location: query.destination,
        availability: true
      }
    ];

    return {
      provider: 'Expedia',
      rooms: mockRooms,
      totalResults: mockRooms.length,
      searchQuery: query
    };
  }
}

class HotelsComProvider {
  async searchHotels(query: HotelSearchQuery): Promise<HotelSearchResult> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockRooms: HotelRoom[] = [
      {
        id: 'hotels-1',
        hotelName: 'Budget Stay',
        roomType: 'Economy Room',
        price: 75,
        currency: 'USD',
        description: 'Clean and affordable accommodation',
        amenities: ['Free WiFi', 'Parking'],
        provider: 'Hotels.com',
        rating: 3.8,
        location: query.destination,
        availability: true
      },
      {
        id: 'hotels-2',
        hotelName: 'Family Resort',
        roomType: 'Family Suite',
        price: 200,
        currency: 'USD',
        description: 'Spacious suite perfect for families',
        amenities: ['Free WiFi', 'Pool', 'Kids Club', 'Restaurant'],
        provider: 'Hotels.com',
        rating: 4.3,
        location: query.destination,
        availability: true
      }
    ];

    return {
      provider: 'Hotels.com',
      rooms: mockRooms,
      totalResults: mockRooms.length,
      searchQuery: query
    };
  }
}

export const hotelProviders = {
  booking: new BookingComProvider(),
  expedia: new ExpediaProvider(),
  hotelscom: new HotelsComProvider()
};

export async function searchAllProviders(query: HotelSearchQuery): Promise<HotelSearchResult[]> {
  try {
    const results = await Promise.all([
      hotelProviders.booking.searchHotels(query),
      hotelProviders.expedia.searchHotels(query),
      hotelProviders.hotelscom.searchHotels(query)
    ]);
    
    return results;
  } catch (error) {
    console.error('Error searching hotel providers:', error);
    throw new Error('Failed to search hotel providers');
  }
} 