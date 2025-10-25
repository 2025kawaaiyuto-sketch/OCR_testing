import { useState, useEffect } from 'react';
import { supabase, type OcrResult as OcrResultType } from '../lib/supabase';
import { OcrResult } from './OcrResult';
import { History, Loader, Trash2 } from 'lucide-react';

type OcrHistoryProps = {
  userId: string;
  refreshTrigger: number;
};

export function OcrHistory({ userId, refreshTrigger }: OcrHistoryProps) {
  const [results, setResults] = useState<OcrResultType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [userId, refreshTrigger]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ocr_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this result?')) return;

    try {
      const { error } = await supabase
        .from('ocr_results')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      setResults(results.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Error deleting result:', err);
      alert('Failed to delete result');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all results? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('ocr_results')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      setResults([]);
    } catch (err) {
      console.error('Error clearing history:', err);
      alert('Failed to clear history');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <History className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">No OCR history yet</h3>
        <p className="text-gray-500">Upload an image to start extracting text</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            OCR History ({results.length})
          </h2>
        </div>
        {results.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.id} className="relative group">
            <OcrResult result={result} />
            <button
              onClick={() => handleDelete(result.id)}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
