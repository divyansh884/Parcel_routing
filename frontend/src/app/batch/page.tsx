'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, File, PlayCircle, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BatchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    if (storedToken) setToken(storedToken);
    else window.location.href = '/login';
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/json') {
      setFile(selected);
      setError(null);
    } else {
      setError('Please upload a valid JSON file.');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const text = await file.text();
      const parcels = JSON.parse(text);

      const res = await fetch('http://localhost:3001/api/batches', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-filename': file.name,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(parcels),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Upload failed');

      setBatchId(data.batchId);
      pollStatus(data.batchId);
    } catch (err: any) {
      setError(err.message || 'Failed to upload batch.');
    } finally {
      setUploading(false);
    }
  };

  const pollStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/batches/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        setStatus(data);

        if (['COMPLETED', 'FAILED', 'PARTIAL_FAILURE'].includes(data.status)) {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling status', err);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batch Processing</h1>
          <p className="text-gray-500 mt-2">Upload a JSON array of parcels to route them in bulk.</p>
        </div>

        {/* Upload Area */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Click to upload JSON file</h3>
            <p className="text-sm text-gray-500 mt-1">Maximum 100,000 records</p>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {file && (
            <div className="mt-6 flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center">
                <File className="w-6 h-6 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium text-blue-900">{file.name}</p>
                  <p className="text-xs text-blue-700">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button 
                onClick={handleUpload}
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                {uploading ? 'Uploading...' : 'Start Batch'}
              </button>
            </div>
          )}
        </div>

        {/* Progress Area */}
        {status && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
              Batch: {status.batchId}
              {status.status === 'PROCESSING' && <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full animate-pulse">PROCESSING</span>}
              {status.status === 'COMPLETED' && <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">COMPLETED</span>}
            </h3>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2 text-gray-600">
                  <span>Progress</span>
                  <span className="font-medium">{status.processedCount} / {status.totalCount} ({status.totalCount > 0 ? Math.round((status.processedCount / status.totalCount) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${status.totalCount > 0 ? (status.processedCount / status.totalCount) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-800">{status.totalCount}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-sm text-green-600 mb-1">Success</p>
                  <p className="text-2xl font-bold text-green-700">{status.successCount}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-sm text-red-600 mb-1">Failed</p>
                  <p className="text-2xl font-bold text-red-700">{status.failureCount}</p>
                </div>
              </div>
              
              {status.status === 'COMPLETED' && (
                <div className="p-4 bg-green-50 text-green-800 rounded-md flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Batch processing completed successfully!
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
