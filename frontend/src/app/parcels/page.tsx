'use client';

import { useState, useEffect } from 'react';
import { PackageSearch, Search, Edit2, Trash2, X, Check, Eye, FileText } from 'lucide-react';

type ParcelRecord = {
  _id: string;
  parcelId: string;
  weightKg: number;
  valueEur: number;
  destinationCountry: string;
  status: string;
  department?: string;
  approvalType?: string;
  reason: string;
  ruleVersion?: number;
  createdAt: string;
  insuranceDetails?: {
    policyNumber: string;
    provider: string;
    coverageAmount: number;
    documentUrl?: string;
  };
};

export default function ParcelsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  
  const [parcels, setParcels] = useState<ParcelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Parcel Edit State (Admin Only)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ParcelRecord>>({});

  // Insurance Modal State
  const [viewingInsuranceId, setViewingInsuranceId] = useState<string | null>(null);
  const [insuranceForm, setInsuranceForm] = useState<any>({});
  const [insuranceEditMode, setInsuranceEditMode] = useState(false);
  
  // Cloudinary Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    const storedRole = sessionStorage.getItem('role');
    if (storedToken) {
      setToken(storedToken);
      setRole(storedRole);
      fetchParcels(storedToken);
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchParcels = async (authToken: string, searchQuery: string = '') => {
    setLoading(true);
    try {
      const url = new URL('http://localhost:3001/api/parcels');
      if (searchQuery) url.searchParams.append('search', searchQuery);
      
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch parcels');
      const data = await res.json();
      setParcels(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) fetchParcels(token, search);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this parcel record?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/parcels/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete parcel');
      setParcels(parcels.filter(p => p._id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startEdit = (parcel: ParcelRecord) => {
    setEditingId(parcel._id);
    setEditForm({
      parcelId: parcel.parcelId,
      weightKg: parcel.weightKg,
      valueEur: parcel.valueEur,
      destinationCountry: parcel.destinationCountry
    });
  };

  const saveEdit = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/parcels/${editingId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          id: editForm.parcelId,
          weightKg: Number(editForm.weightKg),
          valueEur: Number(editForm.valueEur),
          destinationCountry: editForm.destinationCountry
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to update');
      }
      
      const updatedDecision = await res.json();
      setParcels(parcels.map(p => p._id === editingId ? { ...p, ...updatedDecision } : p));
      setEditingId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openInsuranceModal = (parcel: ParcelRecord) => {
    setViewingInsuranceId(parcel._id);
    setInsuranceForm(parcel.insuranceDetails || {
      policyNumber: '',
      provider: '',
      coverageAmount: 0,
      documentUrl: ''
    });
    setInsuranceEditMode(false);
  };

  const saveInsuranceEdit = async () => {
    if (!token || !viewingInsuranceId) return;
    try {
      const res = await fetch(`http://localhost:3001/api/parcels/${viewingInsuranceId}/insurance`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ insuranceDetails: insuranceForm })
      });
      
      if (!res.ok) throw new Error('Failed to update insurance');
      
      const updatedDecision = await res.json();
      setParcels(parcels.map(p => p._id === viewingInsuranceId ? { ...p, insuranceDetails: updatedDecision.insuranceDetails } : p));
      setInsuranceEditMode(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    setUploadProgress(10);
    
    try {
      const signRes = await fetch('http://localhost:3001/api/cloudinary/sign', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const signData = await signRes.json();
      if (!signRes.ok) throw new Error(signData.error?.message || 'Failed to get upload signature');

      setUploadProgress(40);

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

      setInsuranceForm({ ...insuranceForm, documentUrl: cloudData.secure_url });
      setUploadProgress(100);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  if (loading && parcels.length === 0) return <div className="p-12 text-center text-gray-500">Loading parcels...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6 relative">

        {/* INSURANCE MODAL */}
        {viewingInsuranceId && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white text-gray-900 rounded-xl p-6 max-w-md w-full shadow-2xl overflow-y-auto max-h-screen">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FileText className="mr-2 text-blue-600" />
                  Insurance Details
                </h2>
                <button onClick={() => setViewingInsuranceId(null)} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Policy Number</label>
                  {insuranceEditMode ? (
                    <input type="text" value={insuranceForm.policyNumber || ''} onChange={e=>setInsuranceForm({...insuranceForm, policyNumber: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                  ) : (
                    <div className="mt-1 p-2 bg-gray-50 rounded-md text-gray-900">{insuranceForm.policyNumber || 'N/A'}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Provider</label>
                  {insuranceEditMode ? (
                    <input type="text" value={insuranceForm.provider || ''} onChange={e=>setInsuranceForm({...insuranceForm, provider: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                  ) : (
                    <div className="mt-1 p-2 bg-gray-50 rounded-md text-gray-900">{insuranceForm.provider || 'N/A'}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Coverage Amount (€)</label>
                  {insuranceEditMode ? (
                    <input type="number" value={insuranceForm.coverageAmount || ''} onChange={e=>setInsuranceForm({...insuranceForm, coverageAmount: Number(e.target.value)})} className="mt-1 block w-full p-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                  ) : (
                    <div className="mt-1 p-2 bg-gray-50 rounded-md text-gray-900">€{insuranceForm.coverageAmount || 0}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signed Document</label>
                  {insuranceEditMode ? (
                    <div className="space-y-3">
                      {insuranceForm.documentUrl && (
                        <div className="flex items-center justify-between text-green-600 text-sm font-medium bg-green-50 p-2 rounded">
                          <div className="flex items-center"><Check className="w-4 h-4 mr-1"/> Document Attached</div>
                          <button type="button" onClick={() => setInsuranceForm({...insuranceForm, documentUrl: ''})} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                        </div>
                      )}
                      
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
                        value={insuranceForm.documentUrl || ''} 
                        onChange={e=>setInsuranceForm({...insuranceForm, documentUrl: e.target.value})} 
                        className="mt-1 block w-full p-2 border border-gray-300 bg-white text-gray-900 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                  ) : insuranceForm.documentUrl ? (
                    <a href={insuranceForm.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                      View Attached Document
                    </a>
                  ) : (
                    <div className="text-gray-500 text-sm">No document uploaded.</div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                  {(role === 'ADMIN' || role === 'AUDITOR') && !insuranceEditMode && (
                    <button type="button" onClick={() => setInsuranceEditMode(true)} className="px-4 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">Edit Details</button>
                  )}
                  {insuranceEditMode && (
                    <>
                      <button type="button" onClick={() => setInsuranceEditMode(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md">Cancel</button>
                      <button type="button" onClick={saveInsuranceEdit} disabled={uploading} className="px-4 py-2 text-white bg-green-600 rounded-md disabled:opacity-50">Save Changes</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <PackageSearch className="mr-3 text-blue-600" />
              Parcel Directory
            </h1>
            <p className="text-gray-500 mt-2">
              View and search all evaluated parcels.
            </p>
          </div>
          
          <form onSubmit={handleSearchSubmit} className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search ID, Dept, Country..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium">
              Filter
            </button>
          </form>
        </div>

        {error && <div className="text-red-500 bg-red-50 p-4 rounded">{error}</div>}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID / Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight / Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status / Dept</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {parcels.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    
                    {/* ID & Country */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === p._id ? (
                        <div className="text-sm font-medium text-gray-900 bg-gray-100 p-1 rounded inline-block mb-1 cursor-not-allowed select-none">
                          {p.parcelId || p._id.substring(0,8)}
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {p.parcelId || p._id.substring(0,8)}
                        </div>
                      )}
                      
                      {editingId === p._id ? (
                        <input className="border p-1 w-16 text-xs block" maxLength={2} value={editForm.destinationCountry} onChange={e => setEditForm({...editForm, destinationCountry: e.target.value})} />
                      ) : (
                        <div className="text-xs text-gray-500">{p.destinationCountry}</div>
                      )}
                    </td>

                    {/* Weight & Value */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === p._id ? (
                        <div className="space-y-1">
                          <input type="number" className="border p-1 w-20 text-xs" value={editForm.weightKg} onChange={e => setEditForm({...editForm, weightKg: Number(e.target.value)})} /> kg
                          <br/>
                          <input type="number" className="border p-1 w-20 text-xs" value={editForm.valueEur} onChange={e => setEditForm({...editForm, valueEur: Number(e.target.value)})} /> €
                        </div>
                      ) : (
                        <>
                          <div className="text-sm text-gray-900">{p.weightKg} kg</div>
                          <div className="text-xs text-gray-500">€{p.valueEur}</div>
                        </>
                      )}
                    </td>

                    {/* Status & Dept */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        p.status === 'ROUTED' ? 'bg-green-100 text-green-800' :
                        p.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {p.status}
                      </span>
                      <div className="text-xs text-gray-500 mt-1 font-bold">
                        {p.department || p.approvalType || 'N/A'} (v{p.ruleVersion})
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600 max-w-xs truncate" title={p.reason}>{p.reason}</div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {p.insuranceDetails && (
                          <button onClick={() => openInsuranceModal(p)} className="text-purple-600 hover:text-purple-900 p-2 rounded-full hover:bg-purple-50" title="View Insurance">
                            <Eye className="w-4 h-4"/>
                          </button>
                        )}
                        {role === 'ADMIN' && (
                          editingId === p._id ? (
                            <>
                              <button onClick={saveEdit} className="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-full"><Check className="w-4 h-4"/></button>
                              <button onClick={() => setEditingId(null)} className="text-gray-600 hover:text-gray-900 bg-gray-100 p-2 rounded-full"><X className="w-4 h-4"/></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(p)} className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50"><Edit2 className="w-4 h-4"/></button>
                              <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
                            </>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {parcels.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No parcels found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
