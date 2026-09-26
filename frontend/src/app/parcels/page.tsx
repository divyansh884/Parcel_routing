'use client';
import { API_BASE_URL } from '@/config/api';

import { useState, useEffect } from 'react';
import { PackageSearch, Search, Trash2, X, Check, Eye, FileText, Upload, Save, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';

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
  additionalAttributes?: Record<string, any>;
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
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [viewingParcel, setViewingParcel] = useState<ParcelRecord | null>(null);
  const [generalEditMode, setGeneralEditMode] = useState(false);
  const [insuranceEditMode, setInsuranceEditMode] = useState(false);
  const [generalForm, setGeneralForm] = useState<any>({});
  const [insuranceForm, setInsuranceForm] = useState<any>({});
  
  // Cloudinary State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    const storedRole = sessionStorage.getItem('role');
    if (storedToken) {
      setToken(storedToken);
      setRole(storedRole);
      fetchParcels(storedToken);
      fetchFields(storedToken);
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchFields = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fields`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) setFields(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchParcels = async (authToken: string, searchQuery: string = '') => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/parcels?search=${encodeURIComponent(searchQuery)}`, {
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
    if (!token || !confirm('Are you sure you want to delete this parcel?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/parcels/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setParcels(parcels.filter(p => p._id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openModal = (parcel: ParcelRecord) => {
    setViewingParcel(parcel);
    setGeneralForm({
      id: parcel.parcelId || parcel._id,
      weightKg: parcel.weightKg,
      valueEur: parcel.valueEur,
      destinationCountry: parcel.destinationCountry,
      ...parcel.additionalAttributes
    });
    setInsuranceForm(parcel.insuranceDetails || {
      policyNumber: '', provider: '', coverageAmount: 0, documentUrl: ''
    });
    setGeneralEditMode(false);
    setInsuranceEditMode(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    setUploadProgress(10);
    
    try {
      const signRes = await fetch(`${API_BASE_URL}/api/cloudinary/sign`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!signRes.ok) throw new Error('Failed to get signature');
      const { signature, timestamp, apiKey, cloudName } = await signRes.json();
      
      setUploadProgress(40);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', 'parcel-insurance');

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('Cloudinary upload failed');
      const uploadData = await uploadRes.json();
      
      setUploadProgress(100);
      setInsuranceForm({ ...insuranceForm, documentUrl: uploadData.secure_url });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const saveGeneral = async () => {
    if (!token || !viewingParcel) return;
    try {
      const payload: any = {
        id: generalForm.id,
        weightKg: Number(generalForm.weightKg),
        valueEur: Number(generalForm.valueEur),
        destinationCountry: generalForm.destinationCountry,
        attributes: {}
      };
      
      fields.forEach(f => {
        if (!['weightKg', 'valueEur', 'destinationCountry'].includes(f.name)) {
          payload.attributes[f.name] = generalForm[f.name];
        }
      });

      const res = await fetch(`${API_BASE_URL}/api/parcels/${viewingParcel._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to update parcel');
      const updated = await res.json();
      setParcels(parcels.map(p => p._id === updated._id ? updated : p));
      setViewingParcel(updated);
      setGeneralEditMode(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const saveInsurance = async () => {
    if (!token || !viewingParcel) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/parcels/${viewingParcel._id}/insurance`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ insuranceDetails: insuranceForm })
      });

      if (!res.ok) throw new Error('Failed to save insurance');
      const updated = await res.json();
      setParcels(parcels.map(p => p._id === updated._id ? updated : p));
      setViewingParcel(updated);
      setInsuranceEditMode(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8 space-y-6 relative">

        {/* MODAL */}
        {viewingParcel && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white text-gray-900 rounded-xl p-6 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FileText className="mr-2 text-blue-600" />
                  Parcel Details
                </h2>
                <button onClick={() => setViewingParcel(null)} className="text-gray-500 hover:text-gray-800 p-1"><X className="w-6 h-6"/></button>
              </div>
              
              <div className="space-y-8">
                
                {/* General Details Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">General Information</h3>
                    {role === 'ADMIN' && !generalEditMode && (
                      <button onClick={() => setGeneralEditMode(true)} className="text-blue-600 text-sm font-medium hover:underline">Edit</button>
                    )}
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Render standard and dynamic fields */}
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Tracking ID</label>
                      <div className="mt-1 font-mono text-gray-900">{generalForm.id || viewingParcel._id}</div>
                    </div>

                    {fields.map(f => (
                      <div key={f.name}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase">{f.label}</label>
                        {generalEditMode ? (
                          f.type === 'enum' ? (
                            <select value={generalForm[f.name] || ''} onChange={e=>setGeneralForm({...generalForm, [f.name]: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                              <option value="">Select...</option>
                              {f.values?.map((v: string) => <option key={v} value={v}>{v}</option>)}
                            </select>
                          ) : f.type === 'boolean' ? (
                            <select value={String(generalForm[f.name])} onChange={e=>setGeneralForm({...generalForm, [f.name]: e.target.value === 'true'})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                              <option value="false">False</option>
                              <option value="true">True</option>
                            </select>
                          ) : f.type === 'number' ? (
                            <input type="number" value={generalForm[f.name] ?? ''} onChange={e=>setGeneralForm({...generalForm, [f.name]: Number(e.target.value)})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                          ) : f.type === 'date' ? (
                             <input type="date" value={generalForm[f.name] || ''} onChange={e=>setGeneralForm({...generalForm, [f.name]: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                          ) : (
                            <input type="text" value={generalForm[f.name] || ''} onChange={e=>setGeneralForm({...generalForm, [f.name]: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                          )
                        ) : (
                          <div className="mt-1 text-gray-900">{String(generalForm[f.name] ?? 'N/A')}</div>
                        )}
                      </div>
                    ))}

                    <div className="col-span-1 sm:col-span-2 mt-2 pt-2 border-t border-gray-100">
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Routing Outcome</label>
                      <div className="mt-1 flex items-center space-x-2">
                         <span className="font-bold text-gray-900">{viewingParcel.status}</span>
                         <span className="text-gray-500">→ {viewingParcel.department || viewingParcel.approvalType || 'N/A'}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{viewingParcel.reason}</div>
                    </div>
                  </div>
                  {generalEditMode && (
                    <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end space-x-2">
                      <button onClick={() => setGeneralEditMode(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                      <button onClick={saveGeneral} className="px-4 py-2 text-white bg-blue-600 rounded-md flex items-center hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" /> Save & Re-Evaluate
                      </button>
                    </div>
                  )}
                </div>

                {/* Insurance Details Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Insurance Context</h3>
                    {!insuranceEditMode && (role === 'ADMIN' || role === 'AUDITOR') && (
                      <button onClick={() => setInsuranceEditMode(true)} className="text-blue-600 text-sm font-medium hover:underline">Edit</button>
                    )}
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Policy Number</label>
                      {insuranceEditMode ? (
                        <input type="text" value={insuranceForm.policyNumber || ''} onChange={e=>setInsuranceForm({...insuranceForm, policyNumber: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:ring-blue-500" />
                      ) : (
                        <div className="mt-1 text-gray-900">{insuranceForm.policyNumber || 'N/A'}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Provider</label>
                      {insuranceEditMode ? (
                        <input type="text" value={insuranceForm.provider || ''} onChange={e=>setInsuranceForm({...insuranceForm, provider: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:ring-blue-500" />
                      ) : (
                        <div className="mt-1 text-gray-900">{insuranceForm.provider || 'N/A'}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Coverage (EUR)</label>
                      {insuranceEditMode ? (
                        <input type="number" value={insuranceForm.coverageAmount || 0} onChange={e=>setInsuranceForm({...insuranceForm, coverageAmount: Number(e.target.value)})} className="mt-1 block w-full p-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:ring-blue-500" />
                      ) : (
                        <div className="mt-1 text-gray-900">€{insuranceForm.coverageAmount || 0}</div>
                      )}
                    </div>
                    
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Document File</label>
                      
                      {insuranceEditMode ? (
                        <div className="mt-2 space-y-3">
                           {insuranceForm.documentUrl ? (
                             <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                                <a href={insuranceForm.documentUrl} target="_blank" rel="noreferrer" className="text-green-700 font-medium flex items-center hover:underline">
                                  <FileText className="w-4 h-4 mr-2" /> View Uploaded Document
                                </a>
                                <button type="button" onClick={() => setInsuranceForm({...insuranceForm, documentUrl: ''})} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4"/></button>
                             </div>
                           ) : (
                             <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                               <input type="file" onChange={handleFileUpload} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                               <div className="text-center">
                                 {uploading ? (
                                   <div className="space-y-2">
                                     <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                     <p className="text-sm text-gray-500">Uploading to Cloudinary... {uploadProgress}%</p>
                                   </div>
                                 ) : (
                                   <>
                                     <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                     <span className="text-blue-600 font-medium">Click to upload document</span>
                                   </>
                                 )}
                               </div>
                             </div>
                           )}
                           
                           <div className="flex items-center mt-2">
                             <div className="flex-grow border-t border-gray-300"></div>
                             <span className="px-3 text-gray-400 text-sm">OR PASTE URL</span>
                             <div className="flex-grow border-t border-gray-300"></div>
                           </div>
                           
                           <input type="text" placeholder="https://..." value={insuranceForm.documentUrl || ''} onChange={e=>setInsuranceForm({...insuranceForm, documentUrl: e.target.value})} className="w-full p-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:ring-blue-500" />
                        </div>
                      ) : (
                        <div className="mt-2">
                          {insuranceForm.documentUrl ? (
                            <a href={insuranceForm.documentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center">
                              <FileText className="w-4 h-4 mr-1" /> View Document
                            </a>
                          ) : (
                            <span className="text-gray-500 italic">No document uploaded</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {insuranceEditMode && (
                    <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end space-x-2">
                      <button onClick={() => setInsuranceEditMode(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                      <button onClick={saveInsurance} disabled={uploading} className="px-4 py-2 text-white bg-green-600 rounded-md disabled:opacity-50 hover:bg-green-700">Save Context</button>
                    </div>
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

        {/* Mobile View: Cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {parcels.map(p => (
            <div key={p._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col space-y-3 relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Parcel ID</div>
                  <div className="font-mono text-gray-900 font-medium text-sm">{p.parcelId || p._id.substring(0,8)}</div>
                </div>
                <span className={`px-2 py-1 inline-flex text-[10px] leading-5 font-bold uppercase rounded-full ${
                  p.status === 'ROUTED' ? 'bg-green-100 text-green-800' :
                  p.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {p.status}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-50">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Weight</div>
                  <div className="font-medium text-gray-800 text-sm">{p.weightKg} kg</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Value</div>
                  <div className="font-medium text-gray-800 text-sm">€{p.valueEur}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase">Country</div>
                  <div className="font-medium text-gray-800 text-sm">{p.destinationCountry}</div>
                </div>
              </div>
              
              <div>
                <div className="text-[10px] text-gray-400 uppercase">Department / Reason</div>
                <div className="text-sm text-gray-700 font-medium">{p.department || p.approvalType || 'N/A'}</div>
                <div className="text-xs text-gray-500 line-clamp-1">{p.reason}</div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button onClick={() => openModal(p)} className="text-blue-600 flex items-center text-sm font-medium hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg w-full justify-center">
                  <Eye className="w-4 h-4 mr-1"/> View Details
                </button>
                {role === 'ADMIN' && (
                  <button onClick={() => handleDelete(p._id)} className="text-red-600 flex-shrink-0 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-lg">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                )}
              </div>
            </div>
          ))}
          {parcels.length === 0 && !loading && (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
              <PackageSearch className="mx-auto h-10 w-10 text-gray-300 mb-2" />
              <p className="text-gray-500">No parcels found.</p>
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {p.parcelId || p._id.substring(0,8)}
                      </div>
                      <div className="text-xs text-gray-500">{p.destinationCountry}</div>
                    </td>

                    {/* Weight & Value */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{p.weightKg} kg</div>
                      <div className="text-xs text-gray-500">€{p.valueEur}</div>
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
                        <button onClick={() => openModal(p)} className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50" title="View Details">
                          <Eye className="w-5 h-5"/>
                        </button>
                        {role === 'ADMIN' && (
                          <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50" title="Delete">
                            <Trash2 className="w-5 h-5"/>
                          </button>
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
