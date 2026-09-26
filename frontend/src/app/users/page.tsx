'use client';
import { API_BASE_URL } from '@/config/api';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Trash2, Edit2, X, Check } from 'lucide-react';
import Navbar from '@/components/Navbar';

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
  
  // Create User State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('OPERATOR');
  const [creating, setCreating] = useState(false);
  
  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    const storedRole = sessionStorage.getItem('role');
    
    if (storedToken && storedRole === 'ADMIN') {
      setToken(storedToken);
      fetchUsers(storedToken);
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchUsers = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      setUsers(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create user');
      
      setSuccess(`User ${newEmail} created successfully.`);
      setNewEmail('');
      setNewPassword('');
      setNewRole('OPERATOR');
      fetchUsers(token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingUser) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ email: editEmail, password: editPassword, role: editRole })
      });
      
      if (!res.ok) throw new Error('Failed to update user');
      const updatedUser = await res.json();
      
      setUsers(users.map(u => u._id === editingUser._id ? { ...u, email: updatedUser.email, role: updatedUser.role } : u));
      setSuccess(`User updated successfully.`);
      setEditingUser(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to delete user');
      setUsers(users.filter(u => u._id !== id));
      setSuccess('User deleted successfully.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPassword('');
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading users...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        
        {/* Modals for Edit */}
        {editingUser && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white text-gray-900 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <Edit2 className="w-5 h-5 mr-2 text-blue-600" />
                  Edit User
                </h2>
                <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input required type="email" value={editEmail} onChange={e=>setEditEmail(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></label>
                  <input type="password" value={editPassword} onChange={e=>setEditPassword(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select value={editRole} onChange={e=>setEditRole(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md">
                    <option value="OPERATOR">OPERATOR</option>
                    <option value="AUDITOR">AUDITOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div className="flex justify-end pt-4">
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User List */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="mr-3 text-blue-600" />
              User Management
            </h1>
            <p className="text-gray-500 mt-2">
              View, edit, and delete system users.
            </p>
          </div>

          {(error || success) && (
            <div className={`p-4 rounded-md ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {error || success}
            </div>
          )}

          <div className="space-y-4 md:hidden">
            {users.map((user) => (
              <div key={user._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center text-sm font-medium text-gray-900 break-all">
                    <Shield className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                    {user.email}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 text-xs">Role</span>
                  <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'AUDITOR' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 text-xs">Created</span>
                  <span className="text-gray-900 text-xs">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button onClick={() => startEdit(user)} className="text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center text-sm">
                    <Edit2 className="w-4 h-4 mr-1"/> Edit
                  </button>
                  <button onClick={() => handleDelete(user._id)} className="text-red-600 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-lg flex items-center text-sm">
                    <Trash2 className="w-4 h-4 mr-1"/> Delete
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200">No users found.</div>
            )}
          </div>

          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button onClick={() => startEdit(user)} className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50">
                          <Edit2 className="w-4 h-4"/>
                        </button>
                        <button onClick={() => handleDelete(user._id)} className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Create User Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <UserPlus className="mr-2 text-blue-600 w-6 h-6" />
              New User
            </h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="employee@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input 
                  type="password" 
                  required 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">System Role</label>
                <select 
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="OPERATOR">OPERATOR (Submit Parcels)</option>
                  <option value="AUDITOR">AUDITOR (Review Insurance)</option>
                  <option value="ADMIN">ADMIN (Manage Rules & Users)</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={creating}
                className="w-full mt-4 bg-gray-900 text-white font-medium py-2 px-4 rounded-md hover:bg-gray-800 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
