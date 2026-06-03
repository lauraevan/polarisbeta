import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Monitor,
  Plus,
  Trash2,
  Pencil,
  Maximize2,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
  Download,
  Shield,
  Wifi,
  Lock,
  Cpu,
  HardDrive,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/polaris/AppShell";

export const Route = createFileRoute("/remote")({
  head: () => ({
    meta: [
      { title: "Remote PC — Polaris One" },
      {
        name: "description",
        content:
          "Control your home computer from school. Polaris Remote PC is a custom RustDesk web client with saved devices, sessions, and a clean dark UI.",
      },
    ],
  }),
  component: RemotePage,
});

type Device = {
  id: string;
  rustdeskId: string; // numeric RustDesk ID like 123456789
  name: string;
  os?: "windows" | "mac" | "linux" | "other";
  notes?: string;
  lastUsed?: number;
};

const STORAGE_KEY = "polaris-remote-devices-v1";

function loadDevices(): Device[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Device[]) : [];
  } catch {
    return [];
  }
}
function saveDevices(d: Device[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    /* noop */
  }
}

function osBadge(os?: Device["os"]) {
  switch (os) {
    case "windows":
      return { label: "Windows", color: "from-sky-500 to-blue-700" };
    case "mac":
      return { label: "macOS", color: "from-zinc-400 to-zinc-700" };
    case "linux":
      return { label: "Linux", color: "from-amber-500 to-orange-700" };
    default:
      return { label: "Device", color: "from-emerald-500 to-teal-700" };
  }
}

function RustDeskFrame({ device, onExit }: { device: Device; onExit: () => void }) {
  const [reloadKey, setReloadKey] = useState(0);
  // The official RustDesk web client. Passing the ID in the hash lets the
  // client auto-fill the connect field. Falls back gracefully if not honored.
  const src = useMemo(
    () => `https://web.rustdesk.com/#${encodeURIComponent(device.rustdeskId)}`,
    [device.rustdeskId],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 bg-black/40 px-4 py-2.5">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Devices
        </button>
        <div className="ml-2 flex min-w-0 items-center gap-2">
          <div
            className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${osBadge(device.os).color}`}
          >
            <Monitor className="h-4 w-4 text-black" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{device.name}</div>
            <div className="truncate text-[11px] text-white/55">
              ID {device.rustdeskId} · {osBadge(device.os).label}
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 sm:flex">
            <Wifi className="h-3 w-3" /> Live
          </span>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reconnect
          </button>
          <button
            onClick={() => {
              document.getElementById("rustdesk-frame")?.requestFullscreen?.();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
          >
            <Maximize2 className="h-3.5 w-3.5" /> Fullscreen
          </button>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
      <div className="relative flex-1 bg-black">
        <iframe
          id="rustdesk-frame"
          key={reloadKey}
          src={src}
          title={`RustDesk — ${device.name}`}
          className="absolute inset-0 h-full w-full border-0"
          allow="clipboard-read; clipboard-write; fullscreen; gamepad; microphone; camera; display-capture; autoplay"
          allowFullScreen
        />
      </div>
    </div>
  );
}

function DeviceForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Device;
  onCancel: () => void;
  onSave: (d: Device) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [rustdeskId, setRustdeskId] = useState(initial?.rustdeskId ?? "");
  const [os, setOs] = useState<Device["os"]>(initial?.os ?? "windows");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-md p-4">
      <div className="liquid-glass-strong w-full max-w-md rounded-3xl border border-white/10 p-6 text-white">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600">
            <Monitor className="h-5 w-5 text-black" />
          </div>
          <div>
            <div className="text-base font-bold">{initial ? "Edit device" : "Add a computer"}</div>
            <div className="text-[11px] text-white/55">Paste the RustDesk ID shown in your home app.</div>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/55">Friendly name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Home PC"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none focus:border-white/30"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/55">RustDesk ID</span>
            <input
              value={rustdeskId}
              onChange={(e) => setRustdeskId(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="123 456 789"
              inputMode="numeric"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono tracking-widest outline-none focus:border-white/30"
            />
          </label>
          <div>
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/55">Platform</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(["windows", "mac", "linux", "other"] as const).map((o) => (
                <button
                  key={o}
                  onClick={() => setOs(o)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-semibold capitalize ${
                    os === o
                      ? "border-white/30 bg-white text-black"
                      : "border-white/10 bg-black/30 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/55">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Desk in bedroom, RTX 4070"
              rows={2}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 outline-none focus:border-white/30"
            />
          </label>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            disabled={!name.trim() || rustdeskId.length < 6}
            onClick={() =>
              onSave({
                id: initial?.id ?? Math.random().toString(36).slice(2),
                name: name.trim(),
                rustdeskId,
                os,
                notes: notes.trim() || undefined,
                lastUsed: initial?.lastUsed,
              })
            }
            className="rounded-xl bg-gradient-to-r from-sky-400 to-indigo-500 px-4 py-2 text-sm font-bold text-black shadow-lg shadow-sky-500/20 disabled:opacity-40"
          >
            {initial ? "Save changes" : "Add device"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RemotePage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);

  useEffect(() => {
    setDevices(loadDevices());
  }, []);

  useEffect(() => {
    saveDevices(devices);
  }, [devices]);

  const active = useMemo(() => devices.find((d) => d.id === activeId) ?? null, [devices, activeId]);

  function upsert(d: Device) {
    setDevices((prev) => {
      const exists = prev.some((p) => p.id === d.id);
      return exists ? prev.map((p) => (p.id === d.id ? d : p)) : [d, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  }

  function connect(d: Device) {
    setDevices((prev) => prev.map((p) => (p.id === d.id ? { ...p, lastUsed: Date.now() } : p)));
    setActiveId(d.id);
  }

  function remove(id: string) {
    setDevices((prev) => prev.filter((p) => p.id !== id));
  }

  if (active) {
    return (
      <AppShell hideDock>
        <div className="flex h-[calc(100vh-32px)] flex-col text-white">
          <RustDeskFrame device={active} onExit={() => setActiveId(null)} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto h-full max-w-6xl overflow-y-auto px-4 pb-24 pt-6 text-white sm:px-8">
        {/* Hero */}
        <div className="liquid-glass-strong relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-50 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(56,189,248,0.6), transparent 70%)" }}
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 shadow-lg shadow-sky-500/30">
              <Monitor className="h-7 w-7 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-300">
                <Sparkles className="h-3 w-3" /> Polaris Remote PC
              </div>
              <h1 className="mt-1 text-2xl font-black sm:text-3xl">Your computer, anywhere.</h1>
              <p className="mt-2 max-w-xl text-sm text-white/65">
                A custom RustDesk client built into Polaris. Save your home machines, jump back in
                with one click, and stream your desktop end-to-end encrypted — no shady embeds.
              </p>
            </div>
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black hover:bg-white/90"
            >
              <Plus className="h-4 w-4" /> Add a computer
            </button>
          </div>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Lock, title: "End-to-end encrypted", body: "RustDesk relays don't see your screen — keys stay on your devices." },
              { icon: Cpu, title: "Low-latency streaming", body: "Hardware video codecs deliver smooth 60fps remote control." },
              { icon: HardDrive, title: "File transfer + clipboard", body: "Copy files and text both directions in the same session." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <f.icon className="h-4 w-4 text-sky-300" />
                <div className="mt-2 text-sm font-bold">{f.title}</div>
                <div className="mt-1 text-xs text-white/55">{f.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Devices */}
        <div className="mt-8 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">Your devices</div>
            <div className="text-xl font-black">Saved computers</div>
          </div>
          <a
            href="https://rustdesk.com/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
          >
            <Download className="h-3.5 w-3.5" /> Install RustDesk at home
          </a>
        </div>

        {devices.length === 0 ? (
          <div className="liquid-glass-themed mt-4 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 p-12 text-center">
            <Monitor className="h-10 w-10 text-white/40" />
            <div className="text-sm font-bold">No computers yet</div>
            <div className="max-w-sm text-xs text-white/55">
              Install the free RustDesk app on your home PC, copy its 9-digit ID, then add it here.
              Polaris will remember it forever.
            </div>
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="mt-2 flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black"
            >
              <Plus className="h-4 w-4" /> Add your first computer
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {devices.map((d) => {
              const badge = osBadge(d.os);
              return (
                <div
                  key={d.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:border-white/25 hover:bg-black/55"
                >
                  <div
                    className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${badge.color} opacity-20 blur-2xl transition group-hover:opacity-40`}
                  />
                  <div className="relative flex items-start gap-3">
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${badge.color}`}>
                      <Monitor className="h-5 w-5 text-black" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-base font-bold">{d.name}</div>
                      <div className="truncate font-mono text-[11px] text-white/50">ID {d.rustdeskId}</div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/65">
                      {badge.label}
                    </span>
                  </div>
                  {d.notes && (
                    <div className="relative mt-3 line-clamp-2 text-xs text-white/55">{d.notes}</div>
                  )}
                  <div className="relative mt-4 flex items-center gap-2">
                    <button
                      onClick={() => connect(d)}
                      className="flex-1 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-500 px-3 py-2 text-xs font-bold text-black shadow-lg shadow-sky-500/20 hover:opacity-95"
                    >
                      Connect
                    </button>
                    <button
                      onClick={() => {
                        setEditing(d);
                        setShowForm(true);
                      }}
                      className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(d.id)}
                      className="rounded-xl border border-white/10 bg-white/5 p-2 text-rose-300 hover:bg-rose-500/15"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {d.lastUsed && (
                    <div className="relative mt-2 text-[10px] text-white/40">
                      Last connected {new Date(d.lastUsed).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Setup */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-black/35 p-6">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">
            <Shield className="h-3 w-3" /> Quick setup
          </div>
          <h2 className="mt-1 text-lg font-black">3 steps to control your home PC</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { n: 1, t: "Install RustDesk", b: "Download the free RustDesk app on your home computer and launch it." },
              { n: 2, t: "Copy your ID", b: "The app shows a 9-digit ID and a password. Keep both handy." },
              { n: 3, t: "Add it here", b: "Tap “Add a computer”, paste the ID, then click Connect from anywhere." },
            ].map((s) => (
              <li key={s.n} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-white text-xs font-black text-black">
                  {s.n}
                </div>
                <div className="mt-3 text-sm font-bold">{s.t}</div>
                <div className="mt-1 text-xs text-white/55">{s.b}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {showForm && (
        <DeviceForm
          initial={editing ?? undefined}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={upsert}
        />
      )}
    </AppShell>
  );
}