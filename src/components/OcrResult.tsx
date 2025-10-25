import { useState } from 'react';
import { Copy, Check, FileText, Clock, AlertCircle, Loader } from 'lucide-react';
import type { OcrResult as OcrResultType } from '../lib/supabase';

type OcrResultProps = {
  result: OcrResultType;
};

export function OcrResult({ result }: OcrResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.extracted_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    switch (result.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <Check className="w-4 h-4" />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <Loader className="w-4 h-4 animate-spin" />
            Processing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Failed
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {getStatusBadge()}
              {result.confidence > 0 && (
                <span className="text-sm text-gray-500">
                  {Math.round(result.confidence * 100)}% confidence
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {new Date(result.created_at).toLocaleDateString()} at{' '}
              {new Date(result.created_at).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {result.status === 'completed' && result.extracted_text && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium text-gray-700"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        )}
      </div>

      {result.status === 'completed' && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Extracted Text:</h4>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
              {result.extracted_text || 'No text detected in the image.'}
            </p>
          </div>
        </div>
      )}

      {result.status === 'failed' && result.error_message && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{result.error_message}</p>
        </div>
      )}

      <div className="mt-4">
        <img
          src={result.image_url}
          alt="OCR source"
          className="w-full max-h-48 object-contain bg-gray-100 rounded-lg"
        />
      </div>
    </div>
  );
}
