import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const runAutoSetup = async () => {
  console.log("Memulai Setup Otomatis...");
  
  try {
    // 1. Setup Branding & Pengaturan Awal
    const settingsRef = doc(db, 'settings', 'general');
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        appName: 'E-Voting Agen Perubahan',
        appSubtitle: 'Pengadilan Agama Prabumulih',
        appLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Logo_Mahkamah_Agung_RI.png/600px-Logo_Mahkamah_Agung_RI.png',
        status: 'not_started',
        notification: 'Selamat Datang di Aplikasi E-Voting Enything!'
      });
      console.log("✅ Branding berhasil disiapkan.");
    }

    // 2. Buat Akun Admin Utama secara otomatis
    const adminUsername = "admin";
    const adminEmail = `${adminUsername}@enything.com`;
    const adminPassword = "password123"; // Silakan ganti nanti

    try {
      const res = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      
      // Simpan profil admin ke Firestore
      await setDoc(doc(db, 'users', res.user.uid), {
        id: res.user.uid,
        username: adminUsername,
        name: "Administrator Utama",
        role: "admin",
        status: "active"
      });
      
      alert(`SETUP BERHASIL!\n\nUsername: ${adminUsername}\nPassword: ${adminPassword}\n\nSilakan login sekarang.`);
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-in-use') {
        alert("Sistem sudah pernah di-setup sebelumnya. Silakan langsung login.");
      } else {
        throw authError;
      }
    }
  } catch (error: any) {
    console.error("Setup Gagal:", error);
    alert("Setup Gagal: " + error.message);
  }
};