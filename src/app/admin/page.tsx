"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  getAllGuests, 
  deleteGuest, 
  getGuestStatistics, 
  addGuest,
  resetGuestAttendance, 
  type Guest,
  getUnattendedGuests 
} from '@/lib/supabase';
import { deletePhotoFromSpaces } from '@/lib/dospaces';
import { AppShell } from '@/components/app-shell';
import { gooeyToast } from 'goey-toast';

interface Statistics {
  total: number;
  attended: number;
  not_attended: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({ total: 0, attended: 0, not_attended: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'attended' | 'not_attended'>('all');
  
  // Form state
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('50 A');
  const [addingGuest, setAddingGuest] = useState(false);
  
  // Check authentication on mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/admin/login');
    }
    
    loadData();
  }, [router]);
  
  const loadData = async () => {
    try {
      const [guestData, stats] = await Promise.all([
        getAllGuests(),
        getGuestStatistics()
      ]);
      
      setGuests(guestData);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      gooeyToast.error('Nama tamu wajib diisi!');
      return;
    }
    
    setAddingGuest(true);
    
    try {
      await addGuest(newName, newClass);
      gooeyToast.success(`Tamu "${newName}" berhasil ditambahkan!`);
      setNewName('');
      loadData();
    } catch (error) {
      console.error('Add guest error:', error);
      gooeyToast.error('Gagal menambah tamu', { description: 'Silakan coba lagi.' });
    } finally {
      setAddingGuest(false);
    }
  };
  
  const handleDeletePhoto = async (guestId: string, photoUrl: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini? Status kehadiran akan di-reset.')) {
      return;
    }
    
    try {
      // Delete from DigitalOcean Spaces using Server Action
      const { deletePhotoFromSpacesServer } = await import('@/app/actions/spaces');
      await deletePhotoFromSpacesServer(photoUrl);
      
      // Reset attendance status in Supabase
      await resetGuestAttendance(guestId);
      
      gooeyToast.success('Foto berhasil dihapus', { description: 'Status kehadiran telah di-reset.' });
      loadData();
    } catch (error) {
      console.error('Delete photo error:', error);
      gooeyToast.error('Gagal menghapus foto', { description: 'Pastikan koneksi internet stabil.' });
    }
  };
  
  const handleDeleteGuest = async (guestId: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus tamu "${name}" selamanya?`)) {
      return;
    }
    
    try {
      await deleteGuest(guestId);
      gooeyToast.success(`Tamu "${name}" berhasil dihapus!`);
      loadData();
    } catch (error) {
      console.error('Delete guest error:', error);
      gooeyToast.error('Gagal menghapus tamu', { description: 'Silakan coba lagi.' });
    }
  };
  
  // Filter guests
  const filteredGuests = guests.filter(guest => {
    if (filterStatus === 'attended') return guest.has_attended;
    if (filterStatus === 'not_attended') return !guest.has_attended;
    return true;
  });
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Memuat dashboard...</div>
      </div>
    );
  }
  
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
            <p className="text-muted-foreground mt-1">Kelola buku tamu digital wisuda RPL</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('admin_authenticated');
              router.push('/admin/login');
            }}
            className="bg-destructive/10 text-destructive hover:bg-destructive/20 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Guests */}
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm font-medium">Total Terdaftar</span>
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="text-4xl font-bold">{statistics.total}</div>
          </div>
          
          {/* Attended */}
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm font-medium">Hadir</span>
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-4xl font-bold">{statistics.attended}</div>
          </div>
          
          {/* Not Attended */}
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm font-medium">Belum Hadir</span>
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-4xl font-bold">{statistics.not_attended}</div>
          </div>
        </div>
        
        {/* Add Guest Form */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 mb-8" id="tamu">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Tambah Tamu Baru
          </h2>
          
          <form onSubmit={handleAddGuest}>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama Lengkap Tamu"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={addingGuest}
              />
              
              <select
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
                className="flex h-10 w-full md:w-64 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={addingGuest}
              >
                <option value="50 A">50 A</option>
                <option value="50 B">50 B</option>
                <option value="51 A">51 A</option>
                <option value="51 B">51 B</option>
                <option value="51 C">51 C</option>
                <option value="52 A">52 A</option>
                <option value="52 B">52 B</option>
                <option value="52 C">52 C</option>
                <option value="Guru">Guru</option>
                <option value="VIP / Undangan">VIP / Undangan</option>
                <option value="Umum">Umum</option>
              </select>
              
              <button
                type="submit"
                disabled={addingGuest}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 whitespace-nowrap"
              >
                {addingGuest ? 'Menambah...' : 'Tambah Tamu'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6" id="kehadiran">
          {(['all', 'attended', 'not_attended'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 ${
                filterStatus === status
                  ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {status === 'all' && 'Semua Tamu'}
              {status === 'attended' && 'Sudah Hadir'}
              {status === 'not_attended' && 'Belum Hadir'}
            </button>
          ))}
        </div>
        
        {/* Guests Table */}
        <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="h-12 px-4 text-left align-middle font-medium">No</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Nama</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Kelas</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Waktu Check-in</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground h-24">
                      Tidak ada data tamu sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((guest, index) => (
                    <tr key={guest.id} className="transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">{index + 1}</td>
                      
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                            {guest.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{guest.name}</span>
                        </div>
                      </td>
                      
                      <td className="p-4 align-middle text-muted-foreground">{guest.class_group}</td>
                      
                      <td className="p-4 align-middle">
                        {guest.has_attended ? (
                          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-emerald-500/10 text-emerald-500">
                            Hadir
                          </div>
                        ) : (
                          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground">
                            Belum
                          </div>
                        )}
                      </td>
                      
                      <td className="p-4 align-middle text-muted-foreground">
                        {guest.attended_at ? (
                          new Date(guest.attended_at).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      
                      <td className="p-4 align-middle space-x-2">
                        {guest.has_attended && guest.photo_url && (
                          <>
                            <a
                              href={guest.photo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-primary hover:bg-primary/10 h-8 px-3"
                              title="Lihat Foto"
                            >
                              Lihat
                            </a>
                            <button
                              onClick={() => handleDeletePhoto(guest.id, guest.photo_url!)}
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-destructive hover:bg-destructive/10 h-8 px-3"
                              title="Hapus Foto & Reset Kehadiran"
                            >
                              Reset
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteGuest(guest.id, guest.name)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-orange-500 hover:bg-orange-500/10 h-8 px-3"
                          title="Hapus Data Tamu"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
