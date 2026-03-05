import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Fungsi untuk mendaftarkan banyak akun sekaligus
 * Cukup masukkan array berisi nama-nama pegawai
 */
export const tambahAkunMassal = async (daftarNama: string[]) => {
  console.log("Memulai proses pendaftaran massal...");
  
  for (const nama of daftarNama) {
    try {
      // 1. Buat username otomatis (huruf kecil, tanpa spasi)
      const username = nama.toLowerCase().replace(/\s+/g, '');
      const emailOtomatis = `${username}@enything.com`;
      const passwordDefault = "123456"; // Password standar untuk awal

      // 2. Daftarkan ke Firebase Auth
      const res = await createUserWithEmailAndPassword(auth, emailOtomatis, passwordDefault);
      
      // 3. Simpan data profil lengkap ke Firestore
      await setDoc(doc(db, 'users', res.user.uid), {
        id: res.user.uid,
        username: username,
        name: nama,
        role: 'voter', // Default semua sebagai pemilih
        status: 'active',
        join_date: new Date().toISOString()
      });

      console.log(`✅ Berhasil membuat akun: ${username}`);
    } catch (error: any) {
      console.error(`❌ Gagal membuat akun untuk ${nama}:`, error.message);
    }
  }
  
  alert("Proses pendaftaran massal selesai! Silakan cek tab Authentication di Firebase.");
};