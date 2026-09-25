'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield } from 'lucide-react';

type User = {
  _id: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function UsersPage() {
  const [token, setToken] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('OPERATOR');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    const storedRole = sessionStorage.getItem('role');
    
    if (storedToken && storedRole === 'ADMIN') {
      setToken(storedToken);
      fetchUsers(storedToken);
    } else {
      window.location.href = '/';
    }
  }, []);

  const fetchUsers = async (authToken: string) => {
    try {
      const res = await fetch('http://localhost:3001/api/auth/users', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('http://localhost:3001/api/auth/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create user');
      
      setSuccess(`User ${newEmail} created successfully!`);
      setNewEmail('');
      setNewPassword('');
      fetchUsers(token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading users...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* User List */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="mr-3 text-blue-600" />
              User Management
            </h1>
            <p className="text-gray-500 mt-2">
              View all system users and their roles.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-gray-400" />
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'AUDITOR' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create User Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-bold text-gray-900 flex items-center border-b pb-4 mb-4">
            <UserPlus className="mr-2 w-5 h-5 text-gray-500" />
            Add New User
          </h2>
          
          <form onSubmit={handleCreateUser} className="space-y-4">
            {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
            {success && <div className="text-sm text-green-600 bg-green-50 p-2 rounded">{success}</div>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" required
                value={newEmail} onChange={e => setNewEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" required minLength={6}
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select 
                value={newRole} onChange={e => setNewRole(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
              >
                <option value="OPERATOR">Operator (Routing)</option>
                <option value="AUDITOR">Auditor (Insurance)</option>
                <option value="ADMIN">Admin (Rule Management)</option>
              </select>
            </div>

            <button
              type="submit" disabled={creating}
              className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50 text-sm"
            >
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
