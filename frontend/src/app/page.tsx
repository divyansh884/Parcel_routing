'use client';
import { API_BASE_URL } from '@/config/api';

import { useState, useEffect } from 'react';
import { Package, Truck, AlertTriangle, CheckCircle, Search } from 'lucide-react';

type RoutingDecision = {
  status: string;
  department?: string;
  approvalType?: string;
  ruleId?: string;
  ruleVersion?: number;
  reason: string;
};

type ParcelField = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  values?: string[];
};

export default function Home() {
  const [fields, setFields] = useState<ParcelField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<RoutingDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
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
      if (res.ok) {
        const data = await res.json();
        setFields(data);
        
        // Initialize defaults
        const initial: Record<string, any> = {};
        data.forEach((f: ParcelField) => {
          if (f.type === 'boolean') initial[f.name] = false;
          else if (f.type === 'enum' && f.values?.length) initial[f.name] = f.values[0];
          else initial[f.name] = '';
        });
        setFormData(initial);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDecision(null);

    try {
      // Base fields that Zod requires directly
      const payload: any = {
        customerEmail: formData.customerEmail || undefined,
        weightKg: parseFloat(formData.weightKg || '0'),
        valueEur: parseFloat(formData.valueEur || '0'),
        destinationCountry: formData.destinationCountry || 'DE',
        attributes: {}
      };

      // Everything else goes to attributes
      fields.forEach(f => {
        if (!['weightKg', 'valueEur', 'destinationCountry'].includes(f.name)) {
          if (f.type === 'number') {
            payload.attributes[f.name] = parseFloat(formData[f.name] || '0');
          } else {
            payload.attributes[f.name] = formData[f.name];
          }
        }
      });

      const res = await fetch(`${API_BASE_URL}/api/parcels/route`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || 'Something went wrong while routing the parcel.');
      } else {
        setDecision(data);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Form Section */}
        <div className="bg-white p-5 sm:p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Route Parcel</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Email (Optional, for notifications)
              </label>
              <input
                type="email"
                value={formData.customerEmail || ''}
                onChange={e => handleFieldChange('customerEmail', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                placeholder="customer@example.com"
              />
            </div>
            
            {fields.map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {field.type === 'enum' ? (
                  <select
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  >
                    <option value="" disabled>Select...</option>
                    {field.values?.map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                ) : field.type === 'boolean' ? (
                  <select
                    required={field.required}
                    value={String(formData[field.name])}
                    onChange={e => handleFieldChange(field.name, e.target.value === 'true')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  >
                    <option value="false">False</option>
                    <option value="true">True</option>
                  </select>
                ) : field.type === 'date' ? (
                  <input
                    type="date"
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  />
                ) : field.type === 'number' ? (
                  <input
                    type="number"
                    step="0.01"
                    required={field.required}
                    value={formData[field.name] ?? ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  />
                ) : (
                  <input
                    type="text"
                    required={field.required}
                    value={formData[field.name] || ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  />
                )}
              </div>
            ))}

            <button 
              type="submit" 
              disabled={loading || fields.length === 0}
              className="w-full mt-4 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Evaluate Rules <ArrowRightIcon className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Result Section */}
        <div className="bg-gray-900 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-800 text-white flex flex-col justify-center">
          
          {!decision && !error && (
            <div className="text-center opacity-50">
              <Search className="w-12 h-12 mx-auto mb-4" />
              <p>Submit parcel details to see routing evaluation.</p>
            </div>
          )}

          {error && (
            <div className="text-center text-red-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="font-medium text-lg">{error}</p>
            </div>
          )}

          {decision && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center border-b border-gray-700 pb-6">
                {decision.status === 'ROUTED' && <Truck className="w-16 h-16 mx-auto text-green-500 mb-4" />}
                {decision.status === 'PENDING_APPROVAL' && <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />}
                {decision.status === 'REJECTED' && <XIcon className="w-16 h-16 mx-auto text-red-500 mb-4" />}
                
                <h2 className="text-3xl font-bold mb-2 tracking-tight">
                  {decision.status === 'ROUTED' && 'Routed Successfully'}
                  {decision.status === 'PENDING_APPROVAL' && 'Approval Required'}
                  {decision.status === 'REJECTED' && 'Rejected'}
                </h2>
                <p className="text-gray-400 text-lg">
                  {decision.status === 'ROUTED' && `Assigned to ${decision.department} department.`}
                  {decision.status === 'PENDING_APPROVAL' && `Flagged for ${decision.approvalType} review.`}
                  {decision.status === 'REJECTED' && 'This parcel cannot be processed.'}
                </p>
              </div>
              
              <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Evaluation Reason</h3>
                <p className="text-gray-100 font-mono text-sm leading-relaxed">{decision.reason}</p>
              </div>

              {decision.ruleId && (
                <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-800">
                  <span>Triggered by Rule: <span className="font-mono text-gray-400">{decision.ruleId}</span></span>
                  <span>Engine v{decision.ruleVersion}</span>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function ArrowRightIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function XIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
