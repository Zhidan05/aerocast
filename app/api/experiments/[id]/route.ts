import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    
    const supabase = createAdminClient();
    
    const [simRes, bucketsRes, samplesRes] = await Promise.all([
      supabase.from('simulations').select('*, accuracy_tests(*)').eq('id', id).single(),
      supabase.from('simulation_buckets').select('*').eq('simulation_id', id).order('bucket_order', { ascending: true }),
      supabase.from('simulation_samples').select('*').eq('simulation_id', id).order('iteration', { ascending: true })
    ]);

    if (simRes.error) return NextResponse.json({ error: simRes.error.message }, { status: 500 });
    
    return NextResponse.json({
      ...simRes.data,
      simulation_buckets: bucketsRes.data || [],
      simulation_samples: samplesRes.data || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing experiment ID' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    const { error } = await supabase
      .from('simulations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('DELETE Experiment Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE Experiment Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
