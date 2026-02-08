import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/departments/sync
 *
 * Sync departments and subjects based on existing teachers.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    createServiceClient();
    return NextResponse.json({
      message: 'Department sync is no longer required. Use the Departments/Subjects admin pages instead.',
      data: { departments: 0, subjects: 0 },
    });
  } catch (error) {
    console.error('Error in POST /api/admin/departments/sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
