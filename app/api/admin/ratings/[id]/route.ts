import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { validate, uuidSchema } from '@/lib/utils/validation';

export const dynamic = 'force-dynamic';

const ALLOWED_TABLES = ['ratings', 'weekly_ratings'] as const;
type RatingsTable = (typeof ALLOWED_TABLES)[number];

const ratingUpdateSchema = z.object({
  stars: z.number().int().min(1).max(5),
});

function getTableFromRequest(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tableParam = searchParams.get('table');
  if (!tableParam || !ALLOWED_TABLES.includes(tableParam as RatingsTable)) {
    return null;
  }
  return tableParam as RatingsTable;
}

/**
 * PATCH /api/admin/ratings/[id]
 * Body: { stars }
 * Query: table=ratings|weekly_ratings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const table = getTableFromRequest(request);
    if (!table) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }

    const { id } = await params;
    const idValidation = validate(uuidSchema, id);
    if (!idValidation.success) {
      return NextResponse.json({ error: 'Invalid rating ID' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = ratingUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from(table)
      .update({ stars: parsed.data.stars })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating rating:', error);
      return NextResponse.json({ error: 'Failed to update rating' }, { status: 500 });
    }

    return NextResponse.json({ data, message: 'Rating updated' });
  } catch (error) {
    console.error('Error in PATCH /api/admin/ratings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/ratings/[id]
 * Query: table=ratings|weekly_ratings
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const table = getTableFromRequest(request);
    if (!table) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }

    const { id } = await params;
    const idValidation = validate(uuidSchema, id);
    if (!idValidation.success) {
      return NextResponse.json({ error: 'Invalid rating ID' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from(table).delete().eq('id', id);

    if (error) {
      console.error('Error deleting rating:', error);
      return NextResponse.json({ error: 'Failed to delete rating' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Rating deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/ratings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}