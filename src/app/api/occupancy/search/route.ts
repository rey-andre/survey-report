import { NextRequest, NextResponse } from 'next/server';
import { searchOccupancies } from '@/lib/occupancy';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const results = searchOccupancies(q, 30);
  return NextResponse.json({ results });
}
