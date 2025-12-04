import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Task = {
  id: string;
  type: string;
  application_id: string;
  due_at: string;
  status: string;
};

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('tasks')
      .select('id, type, application_id, due_at, status')
      .gte('due_at', start.toISOString())
      .lte('due_at', end.toISOString())
      .neq('status', 'completed')
      .order('due_at', { ascending: true });

    if (error) {
      console.error(error);
      setTasks([]);
    } else {
      setTasks(data as Task[]);
    }

    setLoading(false);
  }

  async function markComplete(taskId: string) {
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) {
      console.error(error);
      return;
    }

    setTasks(prev => prev.filter(t => t.id !== taskId));
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tasks due today</h1>

      {loading ? (
        <p>Loading…</p>
      ) : tasks.length === 0 ? (
        <p>No tasks due today 🎉</p>
      ) : (
        <ul>
          {tasks.map(task => (
            <li key={task.id} className="mb-3 p-3 border rounded">
              <div>Type: {task.type}</div>
              <div>Application: {task.application_id}</div>
              <div>Due: {new Date(task.due_at).toLocaleString()}</div>
              <div>Status: {task.status}</div>

              <button
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded"
                onClick={() => markComplete(task.id)}
              >
                Mark Complete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
