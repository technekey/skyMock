import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Plane, Activity, Lock, LogOut, Calendar, Database, ShieldCheck, HelpCircle, Copy, Terminal, RefreshCcw } from 'lucide-react';

const API_PORT = 8000;
const API_BASE = `http://${window.location.hostname}:${API_PORT}`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const Navbar = ({ isLoggedIn, onLogout }: { isLoggedIn: boolean; onLogout: () => void }) => (
  <nav style={{ background: '#1a365d', padding: '0.75rem 2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
    <Link to="/" style={{ color: 'white', fontWeight: '800', fontSize: '1.2rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Plane size={24} color="#60a5fa" /> SKYMOCK AIRLINES
    </Link>
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
      <Link to="/" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.9rem' }}>Book Flight</Link>
      {isLoggedIn ? (
        <>
          <Link to="/admin" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.9rem' }}>Dashboard</Link>
          <button onClick={onLogout} style={{ background: 'transparent', border: '1px solid #475569', color: 'white', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <LogOut size={14} /> Logout
          </button>
        </>
      ) : (
        <Link to="/login" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Lock size={14} /> Admin
        </Link>
      )}
    </div>
  </nav>
);

const PublicBooking = () => {
  const [formData, setFormData] = useState({
    passenger_name: '', passenger_email: '', passenger_phone: '',
    source: '', destination: '', travel_date: new Date().toISOString().split('T')[0],
    cabin_class: 'Economy', meal_preference: 'Veg', luggage_kg: 20, services: [] as string[]
  });
  const [status, setStatus] = useState({ type: '', msg: '' });

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'info', msg: 'Processing reservation...' });
    try {
      const res = await axios.post(`${API_BASE}/book`, formData);
      setStatus({ type: 'success', msg: `Booking Confirmed! PNR: ${res.data.pnr}` });
    } catch (err) { setStatus({ type: 'error', msg: 'Booking failed.' }); }
  };

  return (
    <div style={{ background: '#f1f5f9', minHeight: 'calc(100vh - 60px)', padding: '3rem 1rem' }}>
      <div style={{ maxWidth: '600px', margin: 'auto', background: 'white', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#1e293b', textAlign: 'center' }}>Reservation System</h2>
        <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
            <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>FULL NAME
              <input type="text" placeholder="John Doe" required style={{ width: '100%', padding: '10px', marginTop: '5px' }} value={formData.passenger_name} onChange={e => setFormData({...formData, passenger_name: e.target.value})} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>EMAIL
              <input type="email" placeholder="john@example.com" required style={{ width: '100%', padding: '10px', marginTop: '5px' }} value={formData.passenger_email} onChange={e => setFormData({...formData, passenger_email: e.target.value})} />
            </label>
            <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>PHONE
              <input type="text" placeholder="+1-555..." required style={{ width: '100%', padding: '10px', marginTop: '5px' }} value={formData.passenger_phone} onChange={e => setFormData({...formData, passenger_phone: e.target.value})} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>FROM
              <input type="text" placeholder="London" required style={{ width: '100%', padding: '10px', marginTop: '5px' }} value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} />
            </label>
            <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>TO
              <input type="text" placeholder="New York" required style={{ width: '100%', padding: '10px', marginTop: '5px' }} value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>DEPARTURE
              <input type="date" style={{ width: '100%', padding: '10px', marginTop: '5px' }} value={formData.travel_date} onChange={e => setFormData({...formData, travel_date: e.target.value})} />
            </label>
            <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>CABIN CLASS
              <select style={{ width: '100%', padding: '10px', marginTop: '5px' }} value={formData.cabin_class} onChange={e => setFormData({...formData, cabin_class: e.target.value})}>
                <option>Economy</option><option>Premium Economy</option><option>Business</option><option>First</option>
              </select>
            </label>
          </div>
          <button type="submit" style={{ padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>CONFIRM RESERVATION</button>
        </form>
        {status.msg && <div style={{ marginTop: '20px', padding: '12px', borderRadius: '6px', background: status.type === 'success' ? '#f0fdf4' : '#fef2f2', color: status.type === 'success' ? '#166534' : '#991b1b' }}>{status.msg}</div>}
      </div>
    </div>
  );
};

const Login = ({ onLogin }: { onLogin: (token: string) => void }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append('username', user); params.append('password', pass);
      const res = await axios.post(`${API_BASE}/token`, params);
      onLogin(res.data.access_token); navigate('/admin');
    } catch (err) { setErr('Invalid credentials'); }
  };
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <form onSubmit={handleLogin} style={{ width: '350px', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Admin Access</h3>
        <input type="text" placeholder="Username" required style={{ width: '100%', padding: '10px', marginBottom: '15px' }} value={user} onChange={e => setUser(e.target.value)} />
        <input type="password" placeholder="Password" required style={{ width: '100%', padding: '10px', marginBottom: '15px' }} value={pass} onChange={e => setPass(e.target.value)} />
        {err && <p style={{ color: 'red', fontSize: '0.8rem' }}>{err}</p>}
        <button type="submit" style={{ width: '100%', padding: '10px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Login</button>
      </form>
    </div>
  );
};

const HelpSection = ({ token, authEnabled }: { token: string; authEnabled: boolean }) => {
  const authHeader = authEnabled ? ` -H "Authorization: Bearer ${token}"` : "";
  const pythonHeaders = authEnabled ? `headers = {"Authorization": "Bearer ${token}"}\n` : `headers = {}\n`;
  
  // Historical Fetch Examples
  const curlFetch = `curl -X GET "${API_BASE}/bookings?travel_date=${new Date().toISOString().split('T')[0]}"${authHeader}`;
  const pythonFetch = `import requests

url = "${API_BASE}/bookings"
${pythonHeaders}params = {"travel_date": "${new Date().toISOString().split('T')[0]}"}

response = requests.get(url, headers=headers, params=params)
print(response.json())`;

  // Real-time Stream Examples
  const streamUrl = `${API_BASE}/admin/bookings-stream${authEnabled ? `?token=${token}` : ""}`;
  const curlStream = `curl -N "${streamUrl}"`;
  const pythonStream = `import httpx

# Listening to the SSE stream indefinitely
with httpx.stream("GET", "${streamUrl}", timeout=None) as response:
    for line in response.iter_lines():
        if line.startswith("data: "):
            print(f"New Booking: {line[6:]}")`;

  const copyToClipboard = (text: string) => {
    const textArea = document.createElement("textarea"); textArea.value = text;
    document.body.appendChild(textArea); textArea.select();
    try { document.execCommand('copy'); alert("Copied!"); } catch (err) { alert("Error copying"); }
    document.body.removeChild(textArea);
  };

  return (
    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '2rem', maxWidth: '100%' }}>
      <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><HelpCircle size={18} /> API Documentation</h3>
      
      <div style={{ marginBottom: '1rem', padding: '10px', background: '#f1f5f9', borderRadius: '6px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: authEnabled ? '#10b981' : '#ef4444' }}>
          AUTH STATUS: {authEnabled ? 'ENABLED (TOKEN REQUIRED)' : 'DISABLED (PUBLIC)'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Section 1: Historical Data */}
        <div>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: '#1e3a8a' }}>1. Fetch Historical Data</h4>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b' }}>CURL</span><button onClick={() => copyToClipboard(curlFetch)} style={{ fontSize: '0.6rem', cursor: 'pointer' }}>Copy</button></div>
            <pre style={{ background: '#1e293b', color: '#cbd5e1', padding: '10px', borderRadius: '6px', fontSize: '0.7rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{curlFetch}</pre>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b' }}>PYTHON (Requests)</span><button onClick={() => copyToClipboard(pythonFetch)} style={{ fontSize: '0.6rem', cursor: 'pointer' }}>Copy</button></div>
            <pre style={{ background: '#1e293b', color: '#cbd5e1', padding: '10px', borderRadius: '6px', fontSize: '0.7rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{pythonFetch}</pre>
          </div>
        </div>

        {/* Section 2: Real-time Stream */}
        <div>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: '#1e3a8a' }}>2. Real-time JSON Stream</h4>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b' }}>CURL (Listen Indefinitely)</span><button onClick={() => copyToClipboard(curlStream)} style={{ fontSize: '0.6rem', cursor: 'pointer' }}>Copy</button></div>
            <pre style={{ background: '#1e293b', color: '#cbd5e1', padding: '10px', borderRadius: '6px', fontSize: '0.7rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{curlStream}</pre>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b' }}>PYTHON (Httpx Stream)</span><button onClick={() => copyToClipboard(pythonStream)} style={{ fontSize: '0.6rem', cursor: 'pointer' }}>Copy</button></div>
            <pre style={{ background: '#1e293b', color: '#cbd5e1', padding: '10px', borderRadius: '6px', fontSize: '0.7rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{pythonStream}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ updateToken }: { updateToken: (t: string) => void }) => {
  const [liveBookings, setLiveBookings] = useState<any[]>([]);
  const [genConfig, setGenConfig] = useState({ count: 10, target: new Date().toISOString().split('T')[0], mode: 'day' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(true);
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    axios.get(`${API_BASE}/admin/settings`).then(res => setAuthEnabled(res.data.auth_enabled));
    const sse = new EventSource(`${API_BASE}/admin/bookings-stream?token=${token}`);
    sse.onmessage = (e) => {
      if (e.data === ": keep-alive") return;
      try {
        const data = JSON.parse(e.data);
        setLiveBookings(prev => [data, ...prev].slice(0, 5));
      } catch (err) { console.error("Error parsing SSE", err); }
    };
    return () => sse.close();
  }, [token]);

  const toggleAuth = async () => {
    const newVal = !authEnabled;
    await axios.post(`${API_BASE}/admin/toggle-auth`, { enabled: newVal }, { headers: getAuthHeaders() });
    setAuthEnabled(newVal);
  };

  const regenerateToken = async () => {
    if (!window.confirm("This will invalidate ALL existing tokens. Continue?")) return;
    try {
      const res = await axios.post(`${API_BASE}/admin/rotate-token`, {}, { headers: getAuthHeaders() });
      updateToken(res.data.access_token);
      alert("New token generated. Old tokens revoked.");
    } catch (e: any) { 
      const msg = e.response?.data?.detail || e.message || "Unknown error";
      alert(`Revocation failed: ${msg}`);
      if (e.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  const generateMock = async () => {
    setIsGenerating(true);
    await axios.post(`${API_BASE}/admin/generate-mock?count=${genConfig.count}&target_date=${genConfig.target}&mode=${genConfig.mode}`, {}, { headers: getAuthHeaders() });
    setIsGenerating(false);
  };

  const copyToken = () => {
    const el = document.createElement('textarea'); el.value = token;
    document.body.appendChild(el); el.select(); document.execCommand('copy');
    document.body.removeChild(el); alert("Token copied!");
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '100vw', boxSizing: 'border-box' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
            <Activity color="#2563eb" /> <h1 style={{ margin: 0 }}>System Control Tower</h1>
          </div>
          <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #1e293b', maxWidth: '100%' }}>
            <h3 style={{ color: 'white', marginTop: 0 }}><Terminal size={18} /> Real-time Airline Data Lake Stream (JSON)</h3>
            <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', height: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
              {liveBookings.length === 0 && <p style={{ color: '#64748b' }}>Awaiting data stream...</p>}
              {liveBookings.map((b, i) => (
                <div key={i} style={{ marginBottom: '10px', padding: '10px', background: '#1e293b', borderLeft: '3px solid #10b981', maxWidth: '100%', boxSizing: 'border-box' }}>
                  <pre style={{ margin: 0, color: '#10b981', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxWidth: '100%' }}>{JSON.stringify(b, null, 2)}</pre>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
            <h3 style={{ marginTop: 0 }}><Database size={18} /> Industry Mock Generator</h3>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div><label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>COUNT</label><br/><input type="number" style={{ padding: '8px', width: '80px' }} value={genConfig.count} onChange={e => setGenConfig({...genConfig, count: parseInt(e.target.value)})} /></div>
              <div><label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>START DATE</label><br/><input type="date" style={{ padding: '8px' }} value={genConfig.target} onChange={e => setGenConfig({...genConfig, target: e.target.value})} /></div>
              <div><label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>RANGE</label><br/><select style={{ padding: '8px' }} value={genConfig.mode} onChange={e => setGenConfig({...genConfig, mode: e.target.value})}><option value="day">Specific Day</option><option value="week">Full Week</option></select></div>
              <button onClick={generateMock} disabled={isGenerating} style={{ padding: '9px 20px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{isGenerating ? 'GENERATING...' : 'EXECUTE GENERATION'}</button>
            </div>
          </div>
          <HelpSection token={token} authEnabled={authEnabled} />
        </div>
        <div>
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'sticky', top: '2rem' }}>
            <h4 style={{ marginTop: 0 }}><ShieldCheck size={18} /> API Governance</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '10px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Auth Tokens</span>
              <button onClick={toggleAuth} style={{ padding: '5px 15px', background: authEnabled ? '#10b981' : '#ef4444', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem' }}>{authEnabled ? 'ENABLED' : 'DISABLED'}</button>
            </div>
            <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', wordBreak: 'break-all' }}>
              <p style={{ fontWeight: 'bold', fontSize: '0.75rem', margin: '0 0 10px 0', color: '#64748b' }}>ACCESS TOKEN</p>
              <code style={{ fontSize: '0.7rem' }}>{token}</code>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button onClick={copyToken} style={{ flex: 1, padding: '8px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><Copy size={12}/> Copy</button>
                <button onClick={regenerateToken} style={{ flex: 1, padding: '8px', fontSize: '0.7rem', cursor: 'pointer', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><RefreshCcw size={12}/> Revoke & New</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const updateToken = (t: string) => { localStorage.setItem('token', t); setIsLoggedIn(true); };
  return (
    <Router>
      <div style={{ fontFamily: '"Inter", sans-serif' }}>
        <Navbar isLoggedIn={isLoggedIn} onLogout={() => { localStorage.removeItem('token'); setIsLoggedIn(false); }} />
        <Routes>
          <Route path="/" element={<PublicBooking />} />
          <Route path="/login" element={<Login onLogin={updateToken} />} />
          <Route path="/admin" element={isLoggedIn ? <AdminDashboard updateToken={updateToken} /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;
