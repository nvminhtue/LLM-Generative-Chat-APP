import { ragQuery, advancedSearch } from '../../../api/vector-database';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, searchType = 'simple', criteria } = body;

    if (!query && !criteria) {
      return NextResponse.json(
        { error: 'Query or criteria is required' },
        { status: 400 }
      );
    }

    let result;

    if (searchType === 'advanced' && criteria) {
      // Advanced search with specific criteria
      result = await advancedSearch(criteria);
    } else {
      // Simple RAG query
      result = await ragQuery(query);
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('RAG search error:', error);
    return NextResponse.json(
      { error: 'Failed to process search request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const location = searchParams.get('location');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const amenities = searchParams.get('amenities');
    const roomType = searchParams.get('roomType');

    if (!query && !location && !maxPrice && !minRating && !amenities && !roomType) {
      return NextResponse.json(
        { error: 'At least one search parameter is required' },
        { status: 400 }
      );
    }

    const criteria: any = {};
    if (query) criteria.query = query;
    if (location) criteria.location = location;
    if (maxPrice) criteria.maxPrice = parseFloat(maxPrice);
    if (minRating) criteria.minRating = parseFloat(minRating);
    if (amenities) criteria.amenities = amenities.split(',');
    if (roomType) criteria.roomType = roomType;

    const result = await advancedSearch(criteria);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('RAG search error:', error);
    return NextResponse.json(
      { error: 'Failed to process search request' },
      { status: 500 }
    );
  }
} 