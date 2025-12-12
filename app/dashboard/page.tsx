"use client";
import { useState, useEffect } from "react";
import { Users, Key, LogOut, Plus, Copy, CheckCheck } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: number;
  created_at: string;
}

interface ApiKey {
  id: number;
  key_name: string;
  api_key: string;
  is_active: number;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "keys">("keys");
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "client",
  });

  const [newKey, setNewKey] = useState({
    keyName: "",
    expiresInDays: 0,
  });

  const fetchCurrentUser = async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      setCurrentUser(data.user);
      if (data.user.role === "admin") {
        fetchUsers();
      }
    }
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
  };

  const fetchApiKeys = async () => {
    const res = await fetch("/api/api-keys");
    if (res.ok) {
      const data = await res.json();
      setApiKeys(data.apiKeys);
    }
  };

  const createUser = async () => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (res.ok) {
      setNewUser({ username: "", email: "", password: "", role: "client" });
      setShowNewUserForm(false);
      fetchUsers();
    }
  };

  const createApiKey = async () => {
    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newKey),
    });
    if (res.ok) {
      setNewKey({ keyName: "", expiresInDays: 0 });
      setShowNewKeyForm(false);
      fetchApiKeys();
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchApiKeys();
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Socket.IO Dashboard</h1>
                <p className="text-sm text-slate-400">
                  {currentUser.username} ({currentUser.role})
                </p>
              </div>
            </div>
            <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-6">
          <button onClick={() => setActiveTab("keys")} className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === "keys" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
            <Key className="w-5 h-5 inline mr-2" />
            API Keys
          </button>
          {currentUser.role === "admin" && (
            <button onClick={() => setActiveTab("users")} className={`px-6 py-3 rounded-lg font-semibold transition-colors ${activeTab === "users" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
              <Users className="w-5 h-5 inline mr-2" />
              Manage Users
            </button>
          )}
        </div>

        {activeTab === "keys" && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Your API Keys</h2>
              <button onClick={() => setShowNewKeyForm(!showNewKeyForm)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Key
              </button>
            </div>

            {showNewKeyForm && (
              <div className="mb-6 p-4 bg-slate-700 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Key name" value={newKey.keyName} onChange={(e) => setNewKey({ ...newKey, keyName: e.target.value })} className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white" />
                  <input type="number" placeholder="Expires in days (0 = never)" value={newKey.expiresInDays} onChange={(e) => setNewKey({ ...newKey, expiresInDays: parseInt(e.target.value) })} className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={createApiKey} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
                    Create
                  </button>
                  <button onClick={() => setShowNewKeyForm(false)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div key={key.id} className="p-4 bg-slate-700 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{key.key_name}</h3>
                      <p className="text-sm text-slate-400">Created: {new Date(key.created_at).toLocaleDateString()}</p>
                      {key.last_used_at && <p className="text-sm text-slate-400">Last used: {new Date(key.last_used_at).toLocaleString()}</p>}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${key.is_active ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>{key.is_active ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <code className="flex-1 px-3 py-2 bg-slate-900 text-green-400 rounded text-sm font-mono">{key.api_key}</code>
                    <button onClick={() => copyToClipboard(key.api_key)} className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded">
                      {copiedKey === key.api_key ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "users" && currentUser.role === "admin" && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Manage Users</h2>
              <button onClick={() => setShowNewUserForm(!showNewUserForm)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New User
              </button>
            </div>

            {showNewUserForm && (
              <div className="mb-6 p-4 bg-slate-700 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white" />
                  <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white" />
                  <input type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white" />
                  <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white">
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={createUser} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
                    Create User
                  </button>
                  <button onClick={() => setShowNewUserForm(false)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="p-4 bg-slate-700 rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{user.username}</h3>
                    <p className="text-sm text-slate-400">{user.email}</p>
                    <p className="text-xs text-slate-500 mt-1">Created: {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === "admin" ? "bg-purple-900 text-purple-300" : "bg-blue-900 text-blue-300"}`}>{user.role}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.is_active ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>{user.is_active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
