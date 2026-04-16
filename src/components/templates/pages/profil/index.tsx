"use client";

import React, { useState } from "react";
import { useMe, useChangePassword, useLogout } from "@/services/authService";
import { showToast } from "@/libs/toast";
import LogoutIcon from "@/components/atoms/icons/LogoutIcon";
import EyeIcon from "@/components/atoms/icons/EyeIcon";
import EyeOffIcon from "@/components/atoms/icons/EyeOffIcon";
import XIcon from "@/components/atoms/icons/XIcon";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LABEL_DIVISI: Record<string, string> = {
  perencanaan_teknik: "Perencanaan Teknik",
  teknik_cabang: "Teknik Cabang",
  pengawasan_teknik: "Pengawasan Teknik",
};

const COLOR_DIVISI: Record<string, { bg: string; text: string }> = {
  perencanaan_teknik: { bg: "bg-blue-500/20", text: "text-blue-200" },
  teknik_cabang: { bg: "bg-amber-500/20", text: "text-amber-200" },
  pengawasan_teknik: { bg: "bg-emerald-500/20", text: "text-emerald-200" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const ProfilSkeleton: React.FC = () => (
  <div className="flex flex-col gap-4 animate-pulse pb-8">
    <div className="bg-[#1F2375] rounded-2xl px-6 py-8 flex flex-col items-center gap-3">
      <div className="w-20 h-20 rounded-full bg-white/20" />
      <div className="h-5 w-40 rounded-full bg-white/20" />
      <div className="h-4 w-28 rounded-full bg-white/20" />
    </div>
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
      <div className="h-4 w-32 rounded bg-neutral-200" />
      <div className="h-px bg-neutral-100" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-10 rounded-lg bg-neutral-100" />
      ))}
    </div>
  </div>
);

// ─── Ganti Password Modal ─────────────────────────────────────────────────────

interface GantiPasswordModalProps {
  onClose: () => void;
}

const GantiPasswordModal: React.FC<GantiPasswordModalProps> = ({ onClose }) => {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const { mutate, isPending } = useChangePassword();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      showToast.error("Konfirmasi password tidak cocok");
      return;
    }
    if (form.newPassword.length < 8) {
      showToast.error("Password baru minimal 8 karakter");
      return;
    }
    mutate(
      {
        input: { oldPassword: form.oldPassword, newPassword: form.newPassword },
      },
      {
        onSuccess: () => {
          showToast.success("Password berhasil diubah");
          onClose();
        },
        onError: (err) => {
          showToast.error(err.message ?? "Gagal mengubah password");
        },
      },
    );
  };

  const ToggleBtn = ({
    visible,
    onToggle,
  }: {
    visible: boolean;
    onToggle: () => void;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-grey"
    >
      {visible ? (
        <EyeOffIcon className="w-4 h-4" />
      ) : (
        <EyeIcon className="w-4 h-4" />
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-03">
            Ganti Password
          </h2>
          <button onClick={onClose} className="text-grey hover:text-neutral-03">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Password Lama */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-03">
              Password Lama
            </label>
            <div className="relative">
              <input
                name="oldPassword"
                type={show.old ? "text" : "password"}
                value={form.oldPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-neutral-200 text-sm text-neutral-03 outline-none focus:border-[#1F2375] transition-colors"
                placeholder="Masukkan password lama"
              />
              <ToggleBtn
                visible={show.old}
                onToggle={() => setShow((s) => ({ ...s, old: !s.old }))}
              />
            </div>
          </div>

          {/* Password Baru */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-03">
              Password Baru
            </label>
            <div className="relative">
              <input
                name="newPassword"
                type={show.new ? "text" : "password"}
                value={form.newPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-neutral-200 text-sm text-neutral-03 outline-none focus:border-[#1F2375] transition-colors"
                placeholder="Minimal 8 karakter"
              />
              <ToggleBtn
                visible={show.new}
                onToggle={() => setShow((s) => ({ ...s, new: !s.new }))}
              />
            </div>
          </div>

          {/* Konfirmasi Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-03">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <input
                name="confirmPassword"
                type={show.confirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-neutral-200 text-sm text-neutral-03 outline-none focus:border-[#1F2375] transition-colors"
                placeholder="Ulangi password baru"
              />
              <ToggleBtn
                visible={show.confirm}
                onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-grey hover:bg-neutral-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-[#1F2375] text-white text-sm font-medium hover:bg-[#1F2375]/90 transition-colors disabled:opacity-60"
            >
              {isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Logout Confirm Modal ─────────────────────────────────────────────────────

interface LogoutModalProps {
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}

const LogoutModal: React.FC<LogoutModalProps> = ({
  onConfirm,
  onClose,
  isPending,
}) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
    <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <LogoutIcon className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-base font-bold text-neutral-03">Keluar Akun</h2>
        <p className="text-sm text-grey">
          Apakah kamu yakin ingin keluar? Kamu perlu login ulang untuk mengakses
          aplikasi.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-grey hover:bg-neutral-50 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
        >
          {isPending ? "Keluar..." : "Ya, Keluar"}
        </button>
      </div>
    </div>
  </div>
);

// ─── Info Item ────────────────────────────────────────────────────────────────

const InfoItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-center gap-4">
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: "rgba(31,35,117,0.07)" }}
    >
      {icon}
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-xs text-grey">{label}</span>
      <span className="text-sm font-semibold text-neutral-03 truncate">
        {value}
      </span>
    </div>
  </div>
);

// ─── Main Template ────────────────────────────────────────────────────────────

const ProfilTemplate: React.FC = () => {
  const { data, isLoading } = useMe();
  const user = data?.me;

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { mutate: logoutMutate, isPending: logoutPending } = useLogout();

  if (isLoading) return <ProfilSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-grey">Gagal memuat profil.</p>
      </div>
    );
  }

  const initials = getInitials(user.namaLengkap);
  const divisiLabel = LABEL_DIVISI[user.divisi] ?? user.divisi;
  const divisiColor = COLOR_DIVISI[user.divisi] ?? {
    bg: "bg-white/15",
    text: "text-white/80",
  };

  return (
    <>
      <div className="flex flex-col gap-4 pb-8">
        {/* ── Hero Card ── */}
        <div className="relative bg-[#1F2375] rounded-2xl overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-10 -left-6 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute top-4 right-16 w-12 h-12 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative flex flex-col items-center gap-3 px-6 py-8">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>

            {/* Nama & NIP */}
            <div className="text-center">
              <h1 className="text-lg font-bold text-white">
                {user.namaLengkap}
              </h1>
              <p className="text-sm text-white/60 mt-0.5">NIP {user.nip}</p>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${divisiColor.bg} ${divisiColor.text}`}
              >
                {divisiLabel}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.isActive
                    ? "bg-emerald-400/20 text-emerald-200"
                    : "bg-red-400/20 text-red-200"
                }`}
              >
                {user.isActive ? "● Aktif" : "● Nonaktif"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Informasi Akun ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-bold text-neutral-03">
              Informasi Akun
            </h2>
          </div>
          <div className="px-5 py-4 flex flex-col gap-4">
            <InfoItem
              label="Nama Lengkap"
              value={user.namaLengkap}
              icon={
                <svg
                  className="w-5 h-5 text-[#1F2375]"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M10 10.4167C12.0711 10.4167 13.75 8.73782 13.75 6.66667C13.75 4.59551 12.0711 2.91667 10 2.91667C7.92893 2.91667 6.25 4.59551 6.25 6.66667C6.25 8.73782 7.92893 10.4167 10 10.4167Z"
                    className="fill-current"
                  />
                  <path
                    d="M3.33337 16.25C3.33337 13.4885 6.31821 11.25 10 11.25C13.6819 11.25 16.6667 13.4885 16.6667 16.25C16.6667 16.5952 16.3869 16.875 16.0417 16.875H3.95837C3.61319 16.875 3.33337 16.5952 3.33337 16.25Z"
                    className="fill-current"
                  />
                </svg>
              }
            />
            <div className="h-px bg-neutral-100" />
            <InfoItem
              label="NIP"
              value={user.nip}
              icon={
                <svg
                  className="w-5 h-5 text-[#1F2375]"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M16.667 3.33H3.333C2.417 3.33 1.667 4.08 1.667 5v10c0 .917.75 1.667 1.666 1.667h13.334C17.583 16.667 18.333 15.917 18.333 15V5c0-.917-.75-1.667-1.666-1.667zM7.5 5.833c1.233 0 2.083.85 2.083 2.083 0 1.234-.85 2.084-2.083 2.084-1.233 0-2.083-.85-2.083-2.084 0-1.233.85-2.083 2.083-2.083zm4.167 8.334H3.333v-.834c0-1.666 2.5-2.5 4.167-2.5 1.667 0 4.167.834 4.167 2.5v.834zm5-2.5h-3.334v-1.25h3.334v1.25zm0-2.5h-3.334V7.917h3.334v1.25zm0-2.5h-3.334V5.417h3.334v1.25z"
                    className="fill-current"
                  />
                </svg>
              }
            />
            <div className="h-px bg-neutral-100" />
            <InfoItem
              label="Email"
              value={user.email}
              icon={
                <svg
                  className="w-5 h-5 text-[#1F2375]"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M16.667 3.333H3.333C2.417 3.333 1.675 4.083 1.675 5L1.667 15c0 .917.75 1.667 1.666 1.667h13.334C17.583 16.667 18.333 15.917 18.333 15V5c0-.917-.75-1.667-1.666-1.667zm0 3.334L10 10.833 3.333 6.667V5L10 9.167 16.667 5v1.667z"
                    className="fill-current"
                  />
                </svg>
              }
            />
            <div className="h-px bg-neutral-100" />
            <InfoItem
              label="No. HP"
              value={user.noHp}
              icon={
                <svg
                  className="w-5 h-5 text-[#1F2375]"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M16.25 12.992c-.75 0-1.475-.117-2.15-.333-.217-.075-.458-.017-.625.15l-1.117 1.408c-2.066-.991-3.491-2.4-4.516-4.508l1.383-1.175c.167-.175.217-.417.15-.633C9.158 7.225 9.042 6.5 9.042 5.75c0-.333-.275-.608-.609-.608H5.975c-.333 0-.767.15-.767.608 0 5.783 4.759 10.508 10.417 10.508.417 0 .625-.425.625-.767V13.6c0-.333-.275-.608-.608-.608h.608z"
                    className="fill-current"
                  />
                </svg>
              }
            />
            <div className="h-px bg-neutral-100" />
            <InfoItem
              label="Divisi"
              value={divisiLabel}
              icon={
                <svg
                  className="w-5 h-5 text-[#1F2375]"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M1.667 17.5v-1.667c0-.884.351-1.732.976-2.357A3.333 3.333 0 015 12.5h3.333c.884 0 1.732.351 2.357.976A3.333 3.333 0 0111.667 15.833V17.5M13.333 12.5H15c.884 0 1.732.351 2.357.976A3.333 3.333 0 0118.333 15.833V17.5M10 5.833a3.333 3.333 0 11-6.667 0 3.333 3.333 0 016.667 0zm6.667 0a3.333 3.333 0 11-6.667 0"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            />
          </div>
        </div>

        {/* ── Keamanan ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-bold text-neutral-03">Keamanan</h2>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(31,35,117,0.07)" }}
              >
                <svg
                  className="w-5 h-5 text-[#1F2375]"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M10 2.5C7.93 2.5 5.833 4.167 5.833 6.667V7.5H4.167C3.25 7.5 2.5 8.25 2.5 9.167v7.5c0 .916.75 1.666 1.667 1.666h11.666c.917 0 1.667-.75 1.667-1.666v-7.5c0-.917-.75-1.667-1.667-1.667h-1.666v-.833C14.167 4.23 12.12 2.5 10 2.5zm.833 10.98V15c0 .46-.373.833-.833.833A.836.836 0 019.167 15v-1.52A1.664 1.664 0 018.333 12.083c0-.916.75-1.666 1.667-1.666s1.667.75 1.667 1.666c0 .534-.318 1.09-.834 1.397zm1.875-5.48H7.292V6.667C7.292 5.25 8.415 4.167 10 4.167c1.585 0 2.708 1.083 2.708 2.5V8z"
                    className="fill-current"
                  />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-neutral-03">
                  Ganti Password
                </p>
                <p className="text-xs text-grey mt-0.5">
                  Perbarui keamanan akun kamu
                </p>
              </div>
            </div>
            <svg className="w-4 h-4 text-grey" viewBox="0 0 20 20" fill="none">
              <path
                d="M7.5 5L12.5 10L7.5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* ── Logout ── */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl border-2 border-red-100 bg-red-50 hover:bg-red-100 active:bg-red-200 transition-colors"
        >
          <LogoutIcon className="w-4 h-4 text-red-500" />
          <span className="text-sm font-bold text-red-500">Keluar Akun</span>
        </button>
      </div>

      {/* ── Modals ── */}
      {showPasswordModal && (
        <GantiPasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
      {showLogoutModal && (
        <LogoutModal
          isPending={logoutPending}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={() => logoutMutate({})}
        />
      )}
    </>
  );
};

export default ProfilTemplate;
