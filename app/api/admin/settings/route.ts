import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const settingsSchema = z.object({
  comments_require_approval: z.boolean(),
  replies_require_approval: z.boolean(),
});

/**
 * GET /api/admin/settings
 * Fetch admin settings.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('comments_require_approval, replies_require_approval')
      .eq('id', 'global')
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        comments_require_approval: data?.comments_require_approval ?? true,
        replies_require_approval: data?.replies_require_approval ?? true,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/settings
 * Update admin settings.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = settingsSchema.safeParse(body);
    if (!validation.success) {
      const details = validation.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return NextResponse.json({ error: 'Validation failed', details }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('app_settings')
      .upsert({
        id: 'global',
        comments_require_approval: validation.data.comments_require_approval,
        replies_require_approval: validation.data.replies_require_approval,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        comments_require_approval: data.comments_require_approval,
        replies_require_approval: data.replies_require_approval,
      },
      message: 'Settings updated',
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
