import { User } from '../types';
import { useState, FormEvent, useEffect } from 'react';
import { Loader2, LogIn, Settings } from 'lucide-react';
// Import Firebase konfigurasi
import { auth, db } from '../firebase'; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [error, setError] = useState('');
  const [branding, setBranding] = useState({ 
    name: 'Pemilihan Agen Perubahan - PA Prabumulih', 
    subtitle: 'Pengadilan Agama Prabumulih', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Logo_Mahkamah_Agung_RI.png/600px-Logo_Mahkamah_Agung_RI.png' 
  });

  // 1. FUNGSI AUTO-SETUP (Klik ini jika login gagal/baru pertama kali)
  const runAutoSetup = async () => {
    setSetupLoading(true);
    try {
      // Setup Branding di Firestore
      const settingsRef = doc(db, 'settings', 'general');
      await setDoc(settingsRef, {
        appName: 'E-Voting Agen Perubahan',
        appSubtitle: 'Pengadilan Agama Prabumulih',
        appLogoUrl: branding.logo,
        status: 'not_started'
      }, { merge: true });

      // Buat Akun Admin Default
      const adminUser = "admin";
      const adminPass = "password123";
      const adminEmail = `${adminUser}@enything.com`;

      try {
        const res = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
        await setDoc(doc(db, 'users', res.user.uid), {
          id: res.user.uid,
          username: adminUser,
          name: "Administrator Utama",
          role: "admin",
          status: "active"
        });
        alert(`SETUP BERHASIL!\n\nSilakan Login dengan:\nUsername: ${adminUser}\nPassword: ${adminPass}`);
      } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') alert("Sistem sudah siap. Silakan langsung login.");
        else throw e;
      }
    } catch (err: any) {
      alert("Gagal Setup: " + err.message + "\nPastikan Rules Firestore & Auth sudah diaktifkan di Console.");
    } finally {
      setSetupLoading(false);
    }
  };

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
      const emailSimpel = `${loginData.username.toLowerCase()}@enything.com`;
      const userCredential = await signInWithEmailAndPassword(auth, emailSimpel, loginData.password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        localStorage.setItem('userId', userCredential.user.uid);
        onLogin({ ...userData, id: userCredential.user.uid }); 
      } else {
        setError('Profil pengguna belum terdaftar di database.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Username atau Password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <img src={branding.logo} alt="Logo" className="h-20 w-auto object-contain" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">{branding.name}</h2>
        <p className="mt-2 text-center text-sm text-slate-600">{branding.subtitle}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2.5 px-3 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                value={loginData.username}
                onChange={e => setLoginData({...loginData, username: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2.5 px-3 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                value={loginData.password}
                onChange={e => setLoginData({...loginData, password: e.target.value})}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-4 h-4 mr-2" /> MASUK SEKARANG</>}
            </button>
          </form>

          {/* TOMBOL SETUP OTOMATIS */}
          <div className="mt-10 border-t border-slate-100 pt-6">
            <button
              onClick={runAutoSetup}
              disabled={setupLoading}
              className="flex items-center justify-center w-full text-[10px] text-slate-400 hover:text-emerald-600 transition-all uppercase tracking-[0.2em] font-black"
            >
              {setupLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Settings className="w-3 h-3 mr-2" />}
              Setup Database & Admin Otomatis
            </button>
          </div>
        </div>
        <p className="mt-8 text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          &copy; 2026 Enything - Pengadilan Agama Prabumulih
        </p>
      </div>
    </div>
  );
}