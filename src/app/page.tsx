"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import Lightfall from "@/components/Lightfall";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { AuthDivider } from "@/components/auth-divider";
import { DecorIcon } from "@/components/decor-icon";
import { gooeyToast } from 'goey-toast';
import { SearchIcon, CameraIcon, CheckCircleIcon, SettingsIcon } from "lucide-react";
import { supabase, getUnattendedGuests, updateGuestAttendance } from "@/lib/supabase";
import type { Guest } from "@/lib/supabase";

export default function GuestCheckInPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Camera states
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    loadGuests();
    return () => stopCamera();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadGuests = async () => {
    try {
      const data = await getUnattendedGuests();
      setGuests(data);
      setFilteredGuests(data);
      setDbError(null);
    } catch (error: any) {
      console.error("Error loading guests:", error);
      setDbError(error?.message || "Gagal memuat daftar tamu.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowDropdown(true);

    if (query.length > 0) {
      const filtered = guests.filter(
        (g) =>
          g.name.toLowerCase().includes(query.toLowerCase()) ||
          g.class_group.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredGuests(filtered);
    } else {
      setFilteredGuests(guests);
    }
  };

  const toggleGuestSelection = (guestId: string) => {
    setSelectedGuestIds((prev) =>
      prev.includes(guestId)
        ? prev.filter((id) => id !== guestId)
        : [...prev, guestId]
    );
  };

  const selectedGuests = guests.filter((g) => selectedGuestIds.includes(g.id));

  // Camera functions
  useEffect(() => {
    if (cameraActive && videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [cameraActive, videoStream]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      setVideoStream(stream);
      setCameraActive(true);
      setCameraError(null);
    } catch (err) {
      setCameraError(
        "Izin kamera ditolak. Mohon izinkan akses kamera di browser Anda."
      );
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) setCapturedBlob(blob);
      },
      "image/jpeg",
      0.9
    );

    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera();
  };

  const handleSubmit = async () => {
    if (selectedGuestIds.length === 0) return;
    if (!capturedImage) return;

    setSubmitting(true);

    try {
      // Upload image to DigitalOcean Spaces via Server Action
      const { uploadBase64ToSpaces } = await import('@/app/actions/spaces');
      
      let photoUrl = "";
      if (capturedImage) {
        // Since the same photo applies to all selected guests in a group check-in,
        // we upload it once using the first guest's ID for the filename
        photoUrl = await uploadBase64ToSpaces(capturedImage, selectedGuestIds[0]);
      }

      for (const guestId of selectedGuestIds) {
        await updateGuestAttendance(guestId, photoUrl);
      }

      setSubmitSuccess(true);

      setTimeout(() => {
        setSubmitSuccess(false);
        setSelectedGuestIds([]);
        setCapturedImage(null);
        setCapturedBlob(null);
        setSearchQuery("");
        loadGuests();
      }, 3000);
    } catch (error: any) {
      console.error("Submit error:", error);
      gooeyToast.error("Gagal submit kehadiran", {
        description: error?.message || "Silakan coba lagi."
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Success State
  if (submitSuccess) {
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
              "relative flex w-full max-w-sm flex-col items-center justify-center p-6 md:p-8",
              "dark:bg-[radial-gradient(50%_80%_at_20%_0%,--theme(--color-foreground/.1),transparent)]"
            )}
          >
            <div className="absolute -inset-y-6 -left-px w-px bg-border" />
            <div className="absolute -inset-y-6 -right-px w-px bg-border" />
            <div className="absolute -inset-x-6 -top-px h-px bg-border" />
            <div className="absolute -inset-x-6 -bottom-px h-px bg-border" />
            <DecorIcon position="top-left" />
            <DecorIcon position="bottom-right" />

            <div className="w-full max-w-sm animate-in space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircleIcon className="h-10 w-10 text-green-500" />
              </div>
              <h1 className="font-bold text-2xl tracking-wide">
                Terima Kasih!
              </h1>
              <p className="text-base text-muted-foreground">
                Kehadiran {selectedGuests.length} tamu berhasil dicatat.<br />
                Selamat menikmati acara wisuda!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Check-in Page
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
            <div className="flex flex-col space-y-1">
              <h1 className="font-bold text-2xl tracking-wide">
                Buku Tamu Digital 📖
              </h1>
              <p className="text-base text-muted-foreground">
                Wisuda RPL 2026 — Pilih nama Anda dan foto untuk check-in.
              </p>
            </div>

          {dbError && (
            <div className="bg-destructive/10 border border-destructive p-3 rounded-lg text-sm text-destructive mb-4">
              ⚠️ {dbError}
            </div>
          )}

          {/* Search & Select Section */}
          <div className="space-y-4">
            <div className="relative" ref={dropdownRef}>
              <InputGroup>
                <InputGroupInput
                  placeholder="Cari nama tamu..."
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  onFocus={() => setShowDropdown(true)}
                />
                <InputGroupAddon align="inline-start">
                  <SearchIcon />
                </InputGroupAddon>
              </InputGroup>

              {showDropdown && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border bg-popover shadow-lg">
                  {loading ? (
                    <p className="p-3 text-sm text-muted-foreground">Memuat...</p>
                  ) : filteredGuests.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">Tidak ditemukan.</p>
                  ) : (
                    filteredGuests.map((guest) => (
                      <button
                        key={guest.id}
                        type="button"
                        onClick={() => toggleGuestSelection(guest.id)}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-accent",
                          selectedGuestIds.includes(guest.id) && "bg-accent text-accent-foreground"
                        )}
                      >
                        <span className="font-medium">{guest.name}</span>
                        <span className="text-xs text-muted-foreground">{guest.class_group}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedGuests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedGuests.map((guest) => (
                  <span
                    key={guest.id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {guest.name}
                    <button
                      type="button"
                      onClick={() => toggleGuestSelection(guest.id)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <AuthDivider>FOTO KEHADIRAN</AuthDivider>

          {/* Camera Section */}
          <div className="space-y-3">
            {cameraError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {cameraError}
              </div>
            )}

            {!cameraActive && !capturedImage && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={startCamera}
              >
                <CameraIcon data-icon="inline-start" />
                Buka Kamera
              </Button>
            )}

            {cameraActive && (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-lg border bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-auto w-full scale-x-[-1]"
                  />
                </div>
                <Button
                  type="button"
                  className="w-full"
                  size="sm"
                  onClick={capturePhoto}
                >
                  <CameraIcon data-icon="inline-start" />
                  Ambil Foto
                </Button>
              </div>
            )}

            {capturedImage && (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-lg border">
                  <img src={capturedImage} alt="Foto kehadiran" className="h-auto w-full" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={retakePhoto}
                >
                  Foto Ulang
                </Button>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} style={{ display: "none" }} />

          <Button
            className="w-full"
            size="sm"
            type="button"
            disabled={submitting || selectedGuestIds.length === 0 || !capturedImage}
            onClick={handleSubmit}
          >
            {submitting ? (
              "Mengirim..."
            ) : (
              <>
                <CheckCircleIcon data-icon="inline-start" />
                Submit Kehadiran ({selectedGuestIds.length} tamu)
              </>
            )}
          </Button>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Wisuda RPL © 2026
            </p>
            <a
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
              href="/admin/login"
            >
              <SettingsIcon className="inline h-3 w-3 mr-1" />
              Admin
            </a>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
