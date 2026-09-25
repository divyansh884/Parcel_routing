'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, UploadCloud, FileText, Check } from 'lucide-react';

export default function AuditPage() {
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Approval Modal State
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [policyNumber, setPolicyNumber] = useState('');
  const [provider, setProvider] = useState('');
  const [coverageAmount, setCoverageAmount] = useState<number | ''>('');
  const [documentUrl, setDocumentUrl] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    
    if (storedToken && (role === 'AUDITOR' || role === 'ADMIN')) {
      setToken(storedToken);
      fetchPending(storedToken);
    } else {
      window.location.href = '/';
    }
  }, []);

  const fetchPending = async (authToken: string) => {
    try {
      const res = await fetch('http://localhost:3001/api/parcels/pending', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch pending parcels');
      
      const data = await res.json();
      setPending(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    setUploadProgress(10);
    
    try {
      // 1. Get Signature from backend
      const signRes = await fetch('http://localhost:3001/api/cloudinary/sign', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const signData = await signRes.json();
      if (!signRes.ok) throw new Error(signData.error?.message || 'Failed to get upload signature');

      setUploadProgress(40);

      // 2. Upload directly to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp.toString());
      formData.append('signature', signData.signature);
      formData.append('folder', signData.folder);

      const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      });

      setUploadProgress(90);

      const cloudData = await cloudinaryRes.json();
      if (!cloudinaryRes.ok) throw new Error(cloudData.error?.message || 'Cloudinary upload failed');

      setDocumentUrl(cloudData.secure_url);
      setUploadProgress(100);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !approvingId) return;
    
    try {
      const res = await fetch(`http://localhost:3001/api/parcels/decision/${approvingId}/approve`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          insuranceDetails: {
            policyNumber,
            provider,
            coverageAmount: Number(coverageAmount),
            documentUrl
          }
        })
      });
      
      if (!res.ok) throw new Error('Failed to approve');
      
      // Remove from list
      setPending(prev => prev.filter(p => p._id !== approvingId));
      setApprovingId(null);
      // Reset form
      setPolicyNumber('');
      setProvider('');
      setCoverageAmount('');
      setDocumentUrl('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading pending approvals...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6 relative">
        
        {/* APPROVAL MODAL */}
        {approvingId && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white text-gray-900 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="mr-2 text-blue-600" />
                Insurance Document
              </h2>
              <form onSubmit={handleApproveSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Policy Number</label>
                  <input required type="text" value={policyNumber} onChange={e=>setPolicyNumber(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Provider</label>
                  <input required type="text" value={provider} onChange={e=>setProvider(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Coverage Amount (€)</label>
                  <input required type="number" value={coverageAmount} onChange={e=>setCoverageAmount(Number(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signed Document (Optional)</label>
                  {documentUrl ? (
                    <div className="flex items-center justify-between text-green-600 text-sm font-medium bg-green-50 p-2 rounded">
                      <div className="flex items-center"><Check className="w-4 h-4 mr-1"/> Document Uploaded</div>
                      <button type="button" onClick={() => setDocumentUrl('')} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <input 
                          type="file" 
                          onChange={handleFileUpload} 
                          disabled={uploading}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 cursor-pointer"
                        />
                        {uploading && <div className="mt-2 text-xs text-blue-600">Uploading... {uploadProgress}%</div>}
                      </div>
                      <div className="text-xs text-gray-500 text-center">- OR -</div>
                      <input 
                        type="url" 
                        placeholder="Paste document URL manually" 
                        value={documentUrl} 
                        onChange={e => setDocumentUrl(e.target.value)} 
                        className="block w-full p-2 border border-gray-300 bg-white text-gray-900 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button type="button" onClick={() => setApprovingId(null)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md">Cancel</button>
                  <button type="submit" disabled={uploading} className="px-4 py-2 text-white bg-green-600 rounded-md disabled:opacity-50 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2"/>
                    Approve Parcel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ShieldCheck className="mr-3 text-green-600" />
            Audit Queue
          </h1>
          <p className="text-gray-500 mt-2">
            Review and approve parcels that require manual or insurance validation.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        )}

        {pending.length === 0 && !error ? (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
            <CheckCircle className="mx-auto w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">All Caught Up!</h3>
            <p className="text-gray-500">There are no parcels pending approval.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parcel ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pending.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.parcelId || item._id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {item.approvalType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setApprovingId(item._id)}
                        className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md transition-colors"
                      >
                        Start Approval
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
