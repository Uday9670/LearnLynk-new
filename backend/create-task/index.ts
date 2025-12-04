import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { application_id, task_type, due_at } = await req.json();

    if (!application_id || !task_type || !due_at) {
      return new Response(JSON.stringify({ error: 'application_id, task_type, due_at required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const allowed = ['call', 'email', 'review'];
    if (!allowed.includes(task_type)) {
      return new Response(JSON.stringify({ error: 'invalid task_type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const due = new Date(due_at);
    if (Number.isNaN(due.getTime())) {
      return new Response(JSON.stringify({ error: 'invalid due_at' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (due < new Date()) {
      return new Response(JSON.stringify({ error: 'due_at must be a future timestamp' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: appData, error: appErr } = await supabase
      .from('applications')
      .select('tenant_id')
      .eq('id', application_id)
      .single();

    if (appErr || !appData) {
      return new Response(JSON.stringify({ error: 'application not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const insertPayload = {
      application_id,
      type: task_type,
      due_at: due.toISOString(),
      tenant_id: appData.tenant_id
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error) {
      console.error('insert error', error);
      return new Response(JSON.stringify({ error: 'internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, task_id: data.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
