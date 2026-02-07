import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { validate, suggestionSchema } from '@/lib/utils/validation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/suggestions
 * Public list with optional filters.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const anonymousId = searchParams.get('anonymous_id');
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '50', 10) || 50, 100);

    const supabase = createClient();
    let query = supabase.from('suggestions').select('*').order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    query = query.limit(limit);

    const { data: suggestions, error } = await query;
    if (error) {
      console.error('Error fetching suggestions:', error);
      return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
    }

    const suggestionIds = (suggestions || []).map((s) => s.id);
    if (suggestionIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { data: votes, error: votesError } = await supabase
      .from('suggestion_votes')
      .select('suggestion_id, vote, anonymous_id')
      .in('suggestion_id', suggestionIds);

    if (votesError) {
      console.error('Error fetching suggestion votes:', votesError);
      return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 });
    }

    const voteMap = new Map<
      string,
      { up: number; down: number; viewer_vote: 'up' | 'down' | null }
    >();

    suggestionIds.forEach((id) => {
      voteMap.set(id, { up: 0, down: 0, viewer_vote: null });
    });

    (votes || []).forEach((vote) => {
      const entry = voteMap.get(vote.suggestion_id);
      if (!entry) return;
      if (vote.vote === 'up') entry.up += 1;
      if (vote.vote === 'down') entry.down += 1;
      if (anonymousId && vote.anonymous_id === anonymousId) {
        entry.viewer_vote = vote.vote as 'up' | 'down';
      }
    });

    const enriched = suggestions.map((suggestion) => {
      const counts = voteMap.get(suggestion.id) || { up: 0, down: 0, viewer_vote: null };
      return {
        ...suggestion,
        upvotes: counts.up,
        downvotes: counts.down,
        viewer_vote: counts.viewer_vote,
      };
    });

    return NextResponse.json({ data: enriched });
  } catch (error) {
    console.error('Error in GET /api/suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/suggestions
 * Public create endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validate(suggestionSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: suggestion, error } = await supabase
      .from('suggestions')
      .insert({
        type: validation.data.type,
        title: validation.data.title,
        description: validation.data.description,
        status: 'new',
        teacher_name: validation.data.teacher_name,
        department: validation.data.department,
        subject: validation.data.subject,
        level: validation.data.level,
        year_level: validation.data.year_level,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating suggestion:', error);
      return NextResponse.json({ error: 'Failed to submit suggestion' }, { status: 500 });
    }

    return NextResponse.json({ data: suggestion, message: 'Suggestion submitted' }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
