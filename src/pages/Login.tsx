import { User } from '../types';
import { useState, FormEvent, useEffect } from 'react';
import { Loader2, LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [branding, setBranding] = useState({ 
    name: 'Pemilihan Agen Perubahan - PA Prabumulih', 
    subtitle: 'Pengadilan Agama Prabumulih', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Logo_Mahkamah_Agung_RI.png/600px-Logo_Mahkamah_Agung_RI.png' 
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings/general');
        const data = await res.json();
        setBranding({
          name: data.appName || 'Pemilihan Agen Perubahan - PA Prabumulih',
          subtitle: data.appSubtitle || 'Pengadilan Agama Prabumulih',
          logo: data.appLogoUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Logo_Mahkamah_Agung_RI.png/600px-Logo_Mahkamah_Agung_RI.png'
        });
      } catch (err) {
        console.error('Failed to fetch settings', err);
      }
    };
    fetchSettings();
  }, []);

  const handleLoginSuccess = (user: User) => {
    localStorage.setItem('userId', user.id.toString());
    onLogin(user);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await res.json();

      if (res.ok) {
        handleLoginSuccess(data);
      } else {
        setError(data.error || 'Username atau password salah');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal login, periksa koneksi Anda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {branding.logo && (
          <div className="flex justify-center mb-4">
            <img src={branding.logo} alt="Logo" className="h-20 w-auto object-contain" />
          </div>
        )}
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          {branding.name}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {branding.subtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <h3 className="text-lg font-medium text-slate-900 text-center mb-4">Login ke Akun Anda</h3>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-username" className="block text-sm font-medium text-slate-700">Username</label>
              <input
                id="login-username"
                type="text"
                required
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                value={loginData.username}
                onChange={e => setLoginData({...loginData, username: e.target.value})}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">Password</label>
              <input
                id="login-password"
                type="password"
                required
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                value={loginData.password}
                onChange={e => setLoginData({...loginData, password: e.target.value})}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Masuk
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
