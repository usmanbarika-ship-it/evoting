export type ElectionStatus = 'not_started' | 'in_progress' | 'closed';

export interface User {
  id: string; // Diubah ke string untuk mencocokkan Firebase Auth UID
  username: string;
  name: string;
  avatar: string;
  email?: string;
  status?: 'active' | 'suspended' | 'pending';
  cover_url?: string;
  bio?: string;
  location?: string;
  join_date?: string;
  role: 'admin' | 'candidate' | 'voter';
  is_verified?: boolean; // Menggunakan boolean lebih standar untuk Firestore
}

export interface Candidate {
  id: string; // String ID dari Firestore
  user_id: string;
  vision: string;
  mission: string;
  innovation_program?: string;
  image_url?: string;
  name: string;
  avatar: string;
  username: string;
  vote_count: number;
}

// Interface baru untuk merekam jejak voting (Audit Trail)
export interface Vote {
  id: string; // UID pemilih agar satu user hanya satu suara
  candidate_id: string;
  voted_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  audio_url?: string | null;
  created_at: any; // Menggunakan any atau Timestamp Firestore untuk sinkronisasi waktu server
  name: string;
  avatar: string;
  username: string;
  likes_count: number;
  comments_count: number;
}

// ... Interface lainnya tetap sama, namun pastikan ID bertipe string