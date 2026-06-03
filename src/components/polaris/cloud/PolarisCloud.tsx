import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  Cloud,
  CloudUpload,
  Download,
  File as FileIcon,
  FolderPlus,
  HardDrive,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  Search,
  Server,
  Trash2,
} from "lucide-react";

type Provider = "cine" | "custom";
type CloudFile = {
  name: string;
  fullPath: string;
  size: number | null;
  updatedAt: string | null;
  isFolder: boolean;
};

const BUCKET = "polaris-cloud";
const CUSTOM_KEY = "polaris-cloud-custom-endpoint";

type CustomConfig = { endpoint: string; token: string };

function loadCustom(): CustomConfig {
  if (typeof window === "undefined") return { endpoint: "", token: "" };
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? (JSON.parse(raw) as CustomConfig) : { endpoint: "", token: "" };
  } catch {
    return { endpoint: "", token: "" };
  }
}
function saveCustom(c: CustomConfig) {
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(c)); } catch { /* noop */ }
}

function fmtSize(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function PolarisCloud() {
  const { user, isSignedIn } = useAuth();
  const [provider, setProvider] = useState<Provider>("cine");
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folder, setFolder] = useState<string>(""); // sub-path under user root
  const [search, setSearch] = useState("");
  const [custom, setCustomState] = useState<CustomConfig>(() => loadCustom());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const userRoot = user?.id ?? "";
  const cinePath = useMemo(
    () => (folder ? `${userRoot}/${folder}` : userRoot),
    [userRoot, folder],
  );

  function setCustom(c: CustomConfig) {
    setCustomState(c);
    saveCustom(c);
  }

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      if (provider === "cine") {
        if (!isSignedIn) { setFiles([]); return; }
        const { data, error } = await supabase.storage.from(BUCKET).list(cinePath, {
          limit: 200,
          sortBy: { column: "name", order: "asc" },
        });
        if (error) throw error;
        setFiles(
          (data || []).map((f) => ({
            name: f.name,
            fullPath: `${cinePath}/${f.name}`,
            size: (f.metadata?.size as number | undefined) ?? null,
            updatedAt: f.updated_at ?? f.created_at ?? null,
            isFolder: !f.id,
          })),
        );
      } else {
        if (!custom.endpoint) { setFiles([]); return; }
        const res = await fetch(`${custom.endpoint.replace(/\/$/, "")}/list`, {
          headers: custom.token ? { Authorization: `Bearer ${custom.token}` } : undefined,
        });
        if (!res.ok) throw new Error(`Custom cloud responded ${res.status}`);
        const j = (await res.json()) as { files?: CloudFile[] };
        setFiles(j.files || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, cinePath, isSignedIn]);

  async function onUpload(fileList: FileList | null) {
    if (!fileList || !fileList.length) return;
    setError(null);
    setUploading(true);
    try {
      if (provider === "cine") {
        if (!isSignedIn) throw new Error("Sign in to upload to Polaris Cloud.");
        for (const f of Array.from(fileList)) {
          const target = `${cinePath}/${f.name}`;
          const { error } = await supabase.storage.from(BUCKET).upload(target, f, {
            cacheControl: "3600",
            upsert: true,
            contentType: f.type || undefined,
          });
          if (error) throw error;
        }
      } else {
        if (!custom.endpoint) throw new Error("Configure a custom cloud endpoint first.");
        for (const f of Array.from(fileList)) {
          const fd = new FormData();
          fd.append("file", f, f.name);
          const res = await fetch(`${custom.endpoint.replace(/\/$/, "")}/upload`, {
            method: "POST",
            headers: custom.token ? { Authorization: `Bearer ${custom.token}` } : undefined,
            body: fd,
          });
          if (!res.ok) throw new Error(`Upload failed (${res.status})`);
        }
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(f: CloudFile) {
    if (!confirm(`Delete ${f.name}?`)) return;
    setError(null);
    try {
      if (provider === "cine") {
        const { error } = await supabase.storage.from(BUCKET).remove([f.fullPath]);
        if (error) throw error;
      } else {
        const res = await fetch(`${custom.endpoint.replace(/\/$/, "")}/delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(custom.token ? { Authorization: `Bearer ${custom.token}` } : {}),
          },
          body: JSON.stringify({ path: f.fullPath }),
        });
        if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function onShare(f: CloudFile) {
    try {
      if (provider === "cine") {
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(f.fullPath, 60 * 60 * 24);
        if (error) throw error;
        await navigator.clipboard.writeText(data.signedUrl);
        alert("Signed link copied (valid 24h).");
      } else {
        const url = `${custom.endpoint.replace(/\/$/, "")}/file/${encodeURIComponent(f.fullPath)}`;
        await navigator.clipboard.writeText(url);
        alert("Link copied.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create link");
    }
  }

  async function onDownload(f: CloudFile) {
    try {
      if (provider === "cine") {
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(f.fullPath, 60 * 5);
        if (error) throw error;
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      } else {
        const url = `${custom.endpoint.replace(/\/$/, "")}/file/${encodeURIComponent(f.fullPath)}`;
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    }
  }

  const visible = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-full min-h-0 flex-col text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/40 to-indigo-600/30">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Polaris Cloud</h1>
              <p className="text-[11px] text-white/55">
                {provider === "cine" ? "Powered by Cine API" : "Your custom cloud"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
            <button
              onClick={() => setProvider("cine")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition ${
                provider === "cine" ? "bg-white/15 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              <HardDrive className="h-3 w-3" /> Polaris (Cine)
            </button>
            <button
              onClick={() => setProvider("custom")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition ${
                provider === "custom" ? "bg-white/15 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              <Server className="h-3 w-3" /> Custom
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-white/5 bg-black/20 px-4 py-2 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files…"
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pl-8 pr-3 text-xs placeholder:text-white/40 focus:border-white/30 focus:outline-none"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs hover:bg-white/[0.12]">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudUpload className="h-3.5 w-3.5" />}
            Upload
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                onUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <button
            onClick={() => {
              const name = prompt("New folder name");
              if (name) setFolder(folder ? `${folder}/${name}` : name);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs hover:bg-white/[0.10]"
          >
            <FolderPlus className="h-3.5 w-3.5" /> New folder
          </button>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs hover:bg-white/[0.10]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          {provider === "custom" && (
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs hover:bg-white/[0.10]"
            >
              <Server className="h-3.5 w-3.5" /> Endpoint
            </button>
          )}
        </div>

        {/* Breadcrumb */}
        {provider === "cine" && (
          <div className="mx-auto mt-2 flex max-w-6xl items-center gap-1 text-[11px] text-white/55">
            <button onClick={() => setFolder("")} className="hover:text-white">root</button>
            {folder.split("/").filter(Boolean).map((seg, i, arr) => (
              <span key={i} className="flex items-center gap-1">
                <span className="text-white/30">/</span>
                <button
                  onClick={() => setFolder(arr.slice(0, i + 1).join("/"))}
                  className="hover:text-white"
                >
                  {seg}
                </button>
              </span>
            ))}
          </div>
        )}

        {settingsOpen && provider === "custom" && (
          <div className="mx-auto mt-2 max-w-6xl rounded-xl border border-white/10 bg-black/40 p-3 backdrop-blur-xl">
            <div className="text-[11px] text-white/60">
              Point Polaris at any HTTP cloud that supports <code>GET /list</code>, <code>POST /upload</code>,
              <code> POST /delete</code>, and <code>GET /file/:path</code>.
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-[2fr_1fr]">
              <input
                value={custom.endpoint}
                onChange={(e) => setCustom({ ...custom, endpoint: e.target.value })}
                placeholder="https://my-cloud.example.com"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs placeholder:text-white/40 focus:border-white/30 focus:outline-none"
              />
              <input
                value={custom.token}
                onChange={(e) => setCustom({ ...custom, token: e.target.value })}
                placeholder="Bearer token (optional)"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs placeholder:text-white/40 focus:border-white/30 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {error && (
            <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          {provider === "cine" && !isSignedIn && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/70">
              Sign in to access your private Polaris Cloud storage.
            </div>
          )}

          {provider === "custom" && !custom.endpoint && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/70">
              Set a custom cloud endpoint above to get started.
            </div>
          )}

          {!loading && visible.length === 0 && ((provider === "cine" && isSignedIn) || (provider === "custom" && custom.endpoint)) && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/55">
              This folder is empty. Upload your first file.
            </div>
          )}

          {visible.length > 0 && (
            <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              {visible.map((f) => (
                <li
                  key={f.fullPath}
                  className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/[0.04]"
                >
                  <FileIcon className="h-4 w-4 text-white/50" />
                  <button
                    onClick={() => f.isFolder && setFolder(folder ? `${folder}/${f.name}` : f.name)}
                    className="flex-1 truncate text-left text-white/90 hover:underline"
                  >
                    {f.name}
                  </button>
                  <span className="hidden w-24 text-right text-[11px] text-white/45 sm:inline">
                    {fmtSize(f.size)}
                  </span>
                  <button
                    onClick={() => onDownload(f)}
                    title="Download"
                    className="rounded-md p-1.5 text-white/60 hover:bg-white/[0.08] hover:text-white"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onShare(f)}
                    title="Share link"
                    className="rounded-md p-1.5 text-white/60 hover:bg-white/[0.08] hover:text-white"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(f)}
                    title="Delete"
                    className="rounded-md p-1.5 text-red-300/80 hover:bg-red-500/15 hover:text-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}