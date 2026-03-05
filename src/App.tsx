/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { User } from './types';
import Layout from './components/Layout';
import Home from './pages/Home';
import Candidates from './pages/Candidates';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import PostDetail from './pages/PostDetail';
import Login from './pages/Login';
import Messages from './pages/Messages';
import AdminDashboard from './pages/AdminDashboard';
import { Megaphone, X as CloseIcon } from 'lucide-react';

// Import Firebase Config yang sudah kita buat
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';

function GlobalNotification() {
  const [notification, setNotification] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Otomatis ditarik dari Firestore 'settings/general'
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
      if (doc.exists() && doc.data().notification) {
        setNotification(doc.data().notification);
        setVisible(true);
      } else {
        setVisible(false);
      }
    });
    return () => unsub();
  }, []);

  if (!visible || !notification) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-lg">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-4 border border-slate-700">
        <div className="bg-emerald-500 p-2 rounded-xl shrink-0">
          <Megaphone className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Pengumuman Global</p>
          <p className="text-sm text-slate-200 leading-relaxed">{notification}</p>
        </div>
        <button onClick={() => setVisible(false)} className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function NotificationHandler({ user }: { user: User }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Real-time listener untuk notifikasi di Firestore (Gantikan WebSocket)
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', user.id),
      orderBy('created_at', 'desc'),
      limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          // Hindari notifikasi lama saat baru load
          const isRecent = (new Date().getTime() - new Date(data.created_at).getTime()) < 10000;
          
          if (isRecent) {
            toast.info(data.actor_name, {
              description: data.content || 'Ada aktivitas baru',
              icon: <img src={data.actor_avatar} className="w-8 h-8 rounded-full object-cover" />,
              action: {
                label: 'Lihat',
                onClick: () => navigate(data.type === 'message' ? '/messages' : `/post/${data.post_id}`)
              },
            });
          }
        }
      });
    });

    return () => unsub();
  }, [user, navigate]);

  return null;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    // Sinkronisasi otomatis status login dengan Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Ambil data detail dari Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ ...(docSnap.data() as User), id: firebaseUser.uid });
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('userId');
    setUser(null);
    setShowLogoutConfirm(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <BrowserRouter>
      <NotificationHandler user={user} />
      <GlobalNotification />
      <Toaster position="top-right" richColors closeButton />
      <Layout user={user} onLogout={() => setShowLogoutConfirm(true)}>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/candidates" element={<Candidates user={user} />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/leaderboard" element={<Leaderboard user={user} />} />
          <Route path="/profile" element={<Profile user={user} onUpdateUser={setUser} />} />
          <Route path="/profile/:userId" element={<Profile user={user} onUpdateUser={setUser} />} />
          <Route path="/messages" element={<Messages user={user} />} />
          <Route path="/admin" element={<AdminDashboard user={user} />} />
          <Route path="/post/:postId" element={<PostDetail user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-2">Keluar Akun?</h2>
            <p className="text-sm text-slate-600 dark:text-neutral-300 mb-6">Anda yakin ingin keluar dari akun Anda?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-neutral-700 font-semibold">Batal</button>
              <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold">Keluar</button>
            </div>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}