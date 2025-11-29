import { NextRequest, NextResponse } from 'next/server';
import { getPublicEvents } from '@/lib/api/events/public';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const location = searchParams.get('location') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const priceMin = searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : undefined;
    const priceMax = searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : undefined;
    const tags = searchParams.get('tags')?.split(',') || undefined;
    const sortBy = searchParams.get('sortBy') || 'startDate';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

    const result = await getPublicEvents({
      page,
      limit,
      search,
      categoryId,
      location,
      startDate,
      endDate,
      priceMin,
      priceMax,
      tags,
      sortBy,
      sortOrder
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: '1.0.0'
      }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch events';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
