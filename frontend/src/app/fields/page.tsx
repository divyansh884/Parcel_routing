'use client';
import { API_BASE_URL } from '@/config/api';

import { useState, useEffect } from 'react';
import { Database, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import Navbar from '@/components/Navbar';

type ParcelField = {
  _id: string;
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'date';
  required: boolean;
  values?: string[];
  operators: string[];
  active: boolean;
};

export default function FieldsPage() {
  const [fields, setFields] = useState<ParcelField[]>([]);
  const [token, setToken] = useState<string>('');
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<ParcelField>>({
    name: '',
    label: '',
    type: 'string',
    required: false,
    values: []
  });
  const [enumValueStr, setEnumValueStr] = useState('');

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    if (storedToken && role === 'ADMIN') {
      setToken(storedToken);
      fetchFields(storedToken);
    } else {
      window.location.href = '/';
    }
  }, []);

  const fetchFields = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/fields`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) setFields(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData, 
        values: formData.type === 'enum' ? enumValueStr.split(',').map(s => s.trim()).filter(Boolean) : [] 
      };

      const res = await fetch(`${API_BASE_URL}/api/fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error?.message || 'Failed to save');
        return;
      }
      
      setShowModal(false);
      setFormData({ name: '', label: '', type: 'string', required: false, values: [] });
      setEnumValueStr('');
      fetchFields(token);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteField = async (id: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/fields/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchFields(token);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Database className="mr-3 text-blue-600" />
              Parcel Fields
            </h1>
            <p className="text-gray-500 mt-1">Dynamically configure fields for routing rules.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center font-medium shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" /> Add New Field
          </button>
        </div>

        {/* Mobile View */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {fields.map(field => (
            <div key={field._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-900">{field.label}</div>
                  <div className="font-mono text-xs text-gray-500 mt-1">{field.name}</div>
                </div>
                <button onClick={() => deleteField(field._id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <span className="text-xs text-gray-500 uppercase">Data Type</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-mono uppercase">
                  {field.type}
                </span>
              </div>
              
              {field.type === 'enum' && (
                <div className="pt-2 border-t border-gray-50">
                  <span className="text-xs text-gray-500 uppercase block mb-1">Options</span>
                  <div className="text-sm text-gray-700 break-words">{field.values?.join(', ')}</div>
                </div>
              )}
            </div>
          ))}
          {fields.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200">No fields configured.</div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-700">Internal Name</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Display Label</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Data Type</th>
                  <th className="px-6 py-3 font-semibold text-gray-700">Options (Enum)</th>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fields.map(field => (
                  <tr key={field._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{field.name}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{field.label}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-mono uppercase">
                        {field.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {field.type === 'enum' ? field.values?.join(', ') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* Cannot delete the base fields easily without breaking existing rules, but UI allows it for now */}
                      <button onClick={() => deleteField(field._id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No custom fields configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Add Parcel Field</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Name (e.g., fragile)</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value.replace(/\s+/g, '')})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Label (e.g., Is Fragile?)</label>
                <input 
                  type="text" 
                  required 
                  value={formData.label} 
                  onChange={e => setFormData({...formData, label: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value as any})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="enum">Enum (List of Options)</option>
                  <option value="date">Date</option>
                </select>
              </div>

              {formData.type === 'enum' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enum Values (comma separated)</label>
                  <input 
                    type="text" 
                    required 
                    value={enumValueStr} 
                    onChange={e => setEnumValueStr(e.target.value.toUpperCase())}
                    placeholder="GLASS, METAL, PLASTIC"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">Save Field</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
