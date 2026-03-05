import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const initializeAppDatabase = async () => {
  const settingsRef = doc(db, 'settings', 'general');
  const settingsSnap = await getDoc(settingsRef);

  // Jika dokumen settings belum ada, buatkan otomatis
  if (!settingsSnap.exists()) {
    await setDoc(settingsRef, {
      appName: 'Pemilihan Agen Perubahan - PA Prabumulih',
      appSubtitle: 'Pengadilan Agama Prabumulih',
      appLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Logo_Mahkamah_Agung_RI.png/600px-Logo_Mahkamah_Agung_RI.png',
      status: 'not_started'
    });
    console.log('Database initialized automatically.');
  }
};