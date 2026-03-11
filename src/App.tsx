import React, { useState, useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  User,
  signInAnonymously,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  updateDoc,
  serverTimestamp,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { Student, ExamSession, Question } from './types';
import { STUDENTS_DATA } from './data/students';
import { QUESTIONS_DATA } from './data/questions';
import { LogIn, LogOut, Shield, AlertTriangle, Clock, CheckCircle, User as UserIcon, Monitor, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- COMPONENTS ---

const LoginPage = ({ onLogin }: { onLogin: (type: 'student' | 'admin', data: any) => Promise<void> }) => {
  const [nisn, setNisn] = useState('');
  const [name, setName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Login attempt:', { name: name.trim(), nisn: nisn.trim(), isAdmin });

    try {
      if (isAdmin) {
        if (name.trim() === 'admin' && password === 'fade 1234') {
          await onLogin('admin', { name: 'Admin Fadlan' });
        } else {
          setError('Kredensial Admin salah');
        }
      } else {
        const searchName = name.trim().toLowerCase();
        const searchNisn = nisn.trim();
        
        const student = STUDENTS_DATA.find(s => 
          s.nisn.trim() === searchNisn && 
          s.name.trim().toLowerCase() === searchName
        );

        if (student) {
          console.log('Student found:', student.name);
          await onLogin('student', student);
        } else {
          console.log('Student not found for:', { searchName, searchNisn });
          setError('Nama atau NISN tidak terdaftar. Pastikan nama sesuai dengan daftar (Huruf Besar/Kecil tidak masalah).');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(`Terjadi kesalahan: ${err.message || 'Gagal masuk ke sistem'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 w-full max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-emerald-500/10 p-4 rounded-2xl">
            <Shield className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold text-center mb-2 leading-tight">MID SEMESTER X TJKT 3 Axioo Class Program tahun 2026</h1>
        <p className="text-gray-500 text-center mb-8 text-sm">Silakan login untuk memulai ujian</p>

        <div className="flex mb-6 bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setIsAdmin(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isAdmin ? 'bg-white shadow-sm' : 'text-gray-500'}`}
          >
            Siswa
          </button>
          <button 
            onClick={() => setIsAdmin(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isAdmin ? 'bg-white shadow-sm' : 'text-gray-500'}`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Nama Lengkap</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              placeholder="Masukkan nama sesuai daftar"
              required
            />
          </div>

          {!isAdmin ? (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">NISN</label>
              <input 
                type="text" 
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Masukkan 10 digit NISN"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : (
              <>
                <LogIn className="w-4 h-4" />
                Masuk ke Sistem
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const InstructionsPage = ({ student, onStart }: { student: any, onStart: () => Promise<void> }) => {
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      await onStart();
    } catch (error) {
      console.error('Failed to start exam:', error);
      alert('Gagal memulai ujian. Pastikan koneksi internet stabil dan fitur Anonymous Auth sudah aktif di Firebase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 w-full max-w-2xl"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-emerald-500/10 p-3 rounded-xl">
            <UserIcon className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Halo, {student.name}</h2>
            <p className="text-gray-500 text-sm">NISN: {student.nisn}</p>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Ujian Hari Ini: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <h3 className="font-semibold text-lg">Petunjuk Ujian:</h3>
          <ul className="space-y-3 text-gray-600 text-sm">
            <li className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
              <p>Waktu pengerjaan adalah <strong>60 menit</strong> sejak tombol mulai diklik.</p>
            </li>
            <li className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
              <p>Terdapat <strong>40 soal</strong> pilihan ganda dengan 5 opsi jawaban.</p>
            </li>
            <li className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold shrink-0">!</div>
              <p className="text-red-600 font-medium">Dilarang mengganti tab, keluar dari halaman, atau menggunakan fitur pencarian layar.</p>
            </li>
            <li className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
              <p>Pelanggaran ke-1 akan muncul <strong>peringatan</strong>. Pelanggaran ke-2 dan seterusnya akan <strong>dicatat</strong>.</p>
            </li>
            <li className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold shrink-0">4</div>
              <p>Mencapai <strong>5 kali pelanggaran</strong> akan menyebabkan ujian <strong>berhenti otomatis</strong> dan skor terkirim.</p>
            </li>
            <li className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0">5</div>
              <p>Setelah selesai, <strong>screenshot hasil skornya</strong> dan upload ke <strong>LMS</strong>.</p>
            </li>
          </ul>
        </div>

        <button 
          onClick={handleStart}
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
        >
          {loading ? 'Menyiapkan Ujian...' : 'Mulai Ujian Sekarang'}
        </button>
      </motion.div>
    </div>
  );
};

const ExamPage = ({ student, session, onComplete }: { student: any, session: ExamSession, onComplete: (score: number, violations: number) => void }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [violations, setViolations] = useState(session.violations || 0);
  const [showWarning, setShowWarning] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  // Anti-cheat logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isTerminated) {
        handleViolation();
      }
    };

    const handleBlur = () => {
      if (!isTerminated) {
        handleViolation();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [violations, isTerminated]);

  const handleViolation = useCallback(() => {
    const newViolations = violations + 1;
    setViolations(newViolations);
    
    // Update Firebase
    updateDoc(doc(db, 'sessions', session.id), {
      violations: newViolations,
      lastActive: new Date().toISOString()
    });

    if (newViolations === 1) {
      setShowWarning(true);
    } else if (newViolations >= 5) {
      terminateExam();
    }
  }, [violations, session.id]);

  const terminateExam = () => {
    setIsTerminated(true);
    handleSubmit();
  };

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionIndex: number, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const calculateScore = () => {
    let correct = 0;
    QUESTIONS_DATA.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / QUESTIONS_DATA.length) * 100);
  };

  const handleSubmit = async () => {
    const finalScore = calculateScore();
    await updateDoc(doc(db, 'sessions', session.id), {
      score: finalScore,
      status: isTerminated ? 'terminated' : 'completed',
      endTime: new Date().toISOString(),
      answers: answers
    });
    onComplete(finalScore, violations);
  };

  const currentQuestion = QUESTIONS_DATA[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Header */}
      <header className="bg-white border-bottom border-black/5 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-lg">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-sm">Ujian TJKT 2026</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{student.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold text-red-600">{violations} Pelanggaran</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 px-4 py-1.5 rounded-full">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-mono font-bold text-gray-700">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Area */}
        <div className="lg:col-span-3 space-y-6">
          <motion.div 
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-black/5"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
                Soal {currentQuestionIndex + 1} dari {QUESTIONS_DATA.length}
              </span>
              <span className="text-[10px] text-gray-400 uppercase font-medium tracking-widest">
                Kategori: {currentQuestion.category}
              </span>
            </div>

            <h2 className="text-lg font-medium text-gray-800 mb-8 leading-relaxed">
              {currentQuestion.text}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(currentQuestionIndex, idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 group ${
                    answers[currentQuestionIndex] === idx 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    answers[currentQuestionIndex] === idx 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-gray-100 text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-500'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-sm">{option}</span>
                </button>
              ))}
            </div>
          </motion.div>

          <div className="flex justify-between items-center">
            <button 
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-white disabled:opacity-30 transition-all"
            >
              Sebelumnya
            </button>
            <button 
              onClick={() => {
                if (currentQuestionIndex === QUESTIONS_DATA.length - 1) {
                  setShowFinishConfirm(true);
                } else {
                  setCurrentQuestionIndex(prev => prev + 1);
                }
              }}
              className="px-8 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10"
            >
              {currentQuestionIndex === QUESTIONS_DATA.length - 1 ? 'Selesai Ujian' : 'Selanjutnya'}
            </button>
          </div>
        </div>

        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 sticky top-24">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Navigasi Soal</h3>
            <div className="grid grid-cols-5 gap-2">
              {QUESTIONS_DATA.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`aspect-square rounded-lg text-[10px] font-bold transition-all flex items-center justify-center ${
                    currentQuestionIndex === idx 
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-200' 
                    : answers[idx] !== undefined 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Warning Modal */}
      <AnimatePresence>
        {showWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-3xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Peringatan!</h3>
              <p className="text-gray-500 text-sm mb-6">
                Anda terdeteksi meninggalkan halaman ujian. Ini adalah peringatan pertama. Pelanggaran selanjutnya akan dicatat oleh sistem.
              </p>
              <button 
                onClick={() => setShowWarning(false)}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-black transition-all"
              >
                Saya Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Finish Confirmation Modal */}
      <AnimatePresence>
        {showFinishConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-3xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Akhiri Ujian?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Pastikan semua jawaban telah terisi dengan benar. Anda tidak dapat kembali setelah mengakhiri ujian.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleSubmit()}
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                >
                  Ya, Selesai
                </button>
                <button 
                  onClick={() => setShowFinishConfirm(false)}
                  className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'sessions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamSession));
      setSessions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const stats = {
    total: sessions.length,
    active: sessions.filter(s => s.status === 'active').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    terminated: sessions.filter(s => s.status === 'terminated').length,
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-white border-b border-black/5 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gray-900 p-2 rounded-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-semibold">Panel Admin Fadlan</h1>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Peserta', value: stats.total, color: 'bg-blue-500' },
            { label: 'Sedang Ujian', value: stats.active, color: 'bg-emerald-500' },
            { label: 'Selesai', value: stats.completed, color: 'bg-gray-500' },
            { label: 'Pelanggaran Berat', value: stats.terminated, color: 'bg-red-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <div className={`h-1 w-8 ${stat.color} mt-4 rounded-full`} />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold">Daftar Aktivitas Siswa</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Siswa</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pelanggaran</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Skor</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Waktu Mulai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map(session => (
                  <tr key={session.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm text-gray-900">{session.studentName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${
                        session.status === 'active' ? 'bg-emerald-100 text-emerald-600' :
                        session.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${session.violations >= 3 ? 'bg-red-500' : session.violations > 0 ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                        <span className="text-sm font-medium">{session.violations}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">{session.score !== undefined ? session.score : '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(session.startTime).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm italic">Belum ada aktivitas ujian</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

const ResultPage = ({ score, violations, onLogout }: { score: number, violations: number, onLogout: () => void }) => {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-12 rounded-[40px] shadow-sm border border-black/5 w-full max-w-md text-center"
      >
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle className="w-12 h-12 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ujian Selesai</h1>
        <p className="text-gray-500 mb-10">Terima kasih telah mengikuti ujian dengan jujur.</p>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Skor Akhir</p>
            <p className="text-3xl font-bold text-gray-900">{score}</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pelanggaran</p>
            <p className="text-3xl font-bold text-red-600">{violations}</p>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all"
        >
          Keluar dari Sistem
        </button>
      </motion.div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [view, setView] = useState<'login' | 'instructions' | 'exam' | 'admin' | 'result'>('login');
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [finalResult, setFinalResult] = useState<{ score: number, violations: number } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        signInAnonymously(auth).catch((error) => {
          console.error('Anonymous sign-in failed:', error);
          // If admin-restricted-operation, it means Anonymous Auth is disabled in Firebase Console
          if (error.code === 'auth/admin-restricted-operation') {
            console.warn('Anonymous Authentication is disabled in Firebase Console. Please enable it to allow student sessions.');
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (type: 'student' | 'admin', data: any) => {
    setUser({ ...data, type });
    if (type === 'admin') {
      setView('admin');
    } else {
      try {
        // Check for existing session
        const q = query(collection(db, 'sessions'), where('studentId', '==', data.nisn), where('status', '==', 'active'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setSession({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ExamSession);
          setView('exam');
        } else {
          setView('instructions');
        }
      } catch (error) {
        console.error('Firestore error during login:', error);
        // Fallback to instructions even if session check fails, to allow student to enter
        setView('instructions');
      }
    }
  };

  const startExam = async () => {
    if (!user) return;
    
    // Ensure user is authenticated (anonymously) before writing to Firestore
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error('Auth failed during startExam:', error);
        throw new Error('Authentication failed. Please enable Anonymous Auth in Firebase Console.');
      }
    }

    try {
      const newSession = {
        studentId: user.nisn,
        studentName: user.name,
        startTime: new Date().toISOString(),
        violations: 0,
        status: 'active' as const,
        lastActive: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'sessions'), newSession);
      setSession({ id: docRef.id, ...newSession });
      setView('exam');
    } catch (error) {
      console.error('Error starting exam:', error);
      throw error;
    }
  };

  const handleExamComplete = (score: number, violations: number) => {
    setFinalResult({ score, violations });
    setView('result');
  };

  const handleLogout = () => {
    setUser(null);
    setSession(null);
    setFinalResult(null);
    setView('login');
  };

  return (
    <div className="font-sans text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">
      <AnimatePresence mode="wait">
        {view === 'login' && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginPage onLogin={handleLogin} />
          </motion.div>
        )}
        {view === 'instructions' && (
          <motion.div key="instructions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <InstructionsPage student={user} onStart={startExam} />
          </motion.div>
        )}
        {view === 'exam' && session && (
          <motion.div key="exam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ExamPage student={user} session={session} onComplete={handleExamComplete} />
          </motion.div>
        )}
        {view === 'admin' && (
          <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminDashboard onLogout={handleLogout} />
          </motion.div>
        )}
        {view === 'result' && finalResult && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResultPage score={finalResult.score} violations={finalResult.violations} onLogout={handleLogout} />
          </motion.div>
        )}
      </AnimatePresence>
      
      <footer className="py-8 text-center text-gray-400 text-[10px] uppercase tracking-[0.2em] font-medium">
        &copy; 2026 Fadlan Akbar, S.Pd., Gr.
      </footer>
    </div>
  );
}
