import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch total count from WordPress
    const wpRes = await fetch('https://crossoverrd.com/wp-json/wp/v2/posts?per_page=1', {
      headers: { 'User-Agent': 'Mozilla/5.0 CrossoverMigration/1.0' },
      cache: 'no-store'
    });

    const wpTotal = parseInt(wpRes.headers.get('x-wp-total') || '73', 10);
    const wpPages = parseInt(wpRes.headers.get('x-wp-totalpages') || '8', 10);

    // 2. Fetch total count of migrated posts in Supabase
    const { count: supabaseTotal, error: countError } = await supabase
      .from('noticias')
      .select('id', { count: 'exact', head: true })
      .not('etiquetas', 'cs', '{"SYSTEM_SLIDE"}');

    // 3. Fetch latest migrated items
    const { data: ultimasMigradas } = await supabase
      .from('noticias')
      .select('id, titulo, slug, foto_portada, created_at, galeria_urls')
      .not('etiquetas', 'cs', '{"SYSTEM_SLIDE"}')
      .order('created_at', { ascending: false })
      .limit(8);

    return NextResponse.json({
      success: true,
      wpTotal,
      wpPages,
      supabaseTotal: supabaseTotal || 0,
      ultimasMigradas: ultimasMigradas || [],
    });
  } catch (error: any) {
    console.error('Error fetching migration status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
