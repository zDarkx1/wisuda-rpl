"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import Lightfall from "@/components/Lightfall";
import { DecorIcon } from "@/components/decor-icon";

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Password wajib diisi!');
      return;
    }

    setLoading(true);
    
    // Simulasi loading untuk UX
    setTimeout(async () => {
      try {
        // Get password from server-side environment
        const res = await fetch('/api/admin-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        
        const data = await res.json();
        
        if (data.valid) {
          localStorage.setItem('admin_authenticated', 'true');
          router.push('/admin');
        } else {
          setError('Password salah! Silakan coba lagi.');
          setPassword('');
        }
      } catch {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Full Screen Lightfall Background */}
      <div className="absolute inset-0 z-0">
        <Lightfall
          colors={["#A6C8FF", "#5227FF", "#FF9FFC"]}
          backgroundColor="#0A29FF"
          speed={0.5}
          streakCount={2}
          streakWidth={1}
          streakLength={1}
          glow={1}
          density={0.6}
          twinkle={1}
          zoom={3}
          backgroundGlow={0.5}
          opacity={1}
          mouseInteraction={true}
          mouseStrength={0.5}
          mouseRadius={1}
        />
      </div>
      
      {/* Glass overlay to ensure readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0" />

      {/* Main Content Container */}
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-6 py-12 md:px-8">
        <div
          className={cn(
            "relative flex w-full max-w-md flex-col justify-between p-6 md:p-8",
            "dark:bg-[radial-gradient(50%_80%_at_20%_0%,--theme(--color-foreground/.1),transparent)] bg-background/60"
          )}
        >
          {/* Decorative borders from auth-2 */}
          <div className="absolute -inset-y-6 -left-px w-px bg-border" />
          <div className="absolute -inset-y-6 -right-px w-px bg-border" />
          <div className="absolute -inset-x-6 -top-px h-px bg-border" />
          <div className="absolute -inset-x-6 -bottom-px h-px bg-border" />
          <DecorIcon position="top-left" />
          <DecorIcon position="bottom-right" />

          <div className="w-full max-w-md animate-in space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-1 text-center mb-6">
              <h1 className="font-bold text-2xl tracking-wide">
                Admin Login
              </h1>
              <p className="text-base text-muted-foreground">
                Masuk untuk mengelola daftar tamu wisuda.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password admin"
                  className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                />
              </div>
              
              {error && (
                <div className="bg-destructive/10 border border-destructive p-3 rounded-lg text-sm text-destructive">
                  ⚠️ {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
              >
                {loading ? 'Memverifikasi...' : 'Login'}
              </button>
            </form>
            
            <div className="mt-4 flex items-center justify-center">
              <a href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Kembali ke halaman utama
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
