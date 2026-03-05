import { User } from '../types';
import { useState, FormEvent, useEffect } from 'react';
import { Loader2, LogIn } from 'lucide-react';
// Import Firebase konfigurasi
import { auth, db } from '../firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  // Kembali menggunakan 'username' agar simpel bagi pengguna
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
        const settingsRef = doc(db, 'settings', 'general');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          setBranding({
            name: data.appName || branding.name,
            subtitle: data.appSubtitle || branding.subtitle,
            logo: data.appLogoUrl || branding.logo
          });
        }
      } catch (err) {
        console.error('Gagal mengambil pengaturan:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TRIK OTOMATIS: Mengubah username menjadi format email agar Firebase Auth jalan
      const emailSimpel = `${loginData.username.toLowerCase()}@enything.com`;

      const userCredential = await signInWithEmailAndPassword(
        auth, 
        emailSimpel, 
        loginData.password
      );
      
      const firebaseUser = userCredential.user;

      // Ambil detail profil user dari Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        localStorage.setItem('userId', firebaseUser.uid);
        onLogin({ ...userData, id: firebaseUser.uid }); 
      } else {
        setError('Profil pengguna belum terdaftar di database.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Username atau Password salah');
      } else {
        setError('Gagal masuk, periksa koneksi internet Anda');
      }
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
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          <form onSubmit={handleLogin} className="space-y-6">
            <h3 className="text-lg font-medium text-slate-900 text-center mb-4">Masuk ke Sistem</h3>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-username" className="block text-sm font-medium text-slate-700">Username</label>
              <input
                id="login-username"
                type="text"
                placeholder="Masukkan username"
                required
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                value={loginData.username}
                onChange={e => setLoginData({...loginData, username: e.target.value})}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                required
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                value={loginData.password}
                onChange={e => setLoginData({...loginData, password: e.target.value})}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  MASUK SEKARANG
                </>
              )}
            </button>
          </form>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          &copy; 2026 Proyek Enything - PA Prabumulih
        </p>
      </div>
    </div>
  );
}