import { useEffect, useMemo, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { ArrowRight, Globe2, RotateCcw, Search, Shield, Zap } from "lucide-react";
import { getProxyUrl, normalizeUrl, registerStaticProxies, type ProxyEngine } from "@/lib/proxy-utils";

const QUICK_LINKS = [
  "google.com",
  "youtube.com",
  "reddit.com",
  "now.gg",
  "roblox.com",
  "discord.com",
];

export function PolarisBrowser() {
  const search = useSearch({ strict: false }) as { engine?: ProxyEngine; url?: string };
  const [engine, setEngine] = useState<ProxyEngine>(search.engine === "scramjet" ? "scramjet" : "uv");
  const [query, setQuery] = useState(search.url ? normalizeUrl(search.url) : "google.com");
  const [target, setTarget] = useState(search.url ? normalizeUrl(search.url) : "https://www.google.com");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    registerStaticProxies().finally(() => setReady(true));
  }, []);

  const src = useMemo(() => (ready ? getProxyUrl(engine, target) : "about:blank"), [engine, ready, target]);

  function go(input = query) {
    const next = normalizeUrl(input);
    setQuery(input);
    setTarget(next);
  }

  return (
    <div className="flex h-screen min-h-0 flex-col px-3 pb-24 pt-3 sm:px-5 sm:pt-5">
      <div className="liquid-glass-themed flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl">
        <header className="flex flex-col gap-3 border-b border-white/10 p-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 pr-1">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10">
              <Globe2 className="h-5 w-5 text-white" />
            </div>
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-black text-white">Polaris Browser</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">PB</div>
            </div>
          </div>

          <form
            className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              go();
            }}
          >
            <Search className="h-4 w-4 shrink-0 text-white/45" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or enter a website"
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
            <button className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-black" type="submit">
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-black/25 p-1 text-xs font-bold">
            {(["uv", "scramjet"] as const).map((next) => (
              <button
                key={next}
                onClick={() => setEngine(next)}
                className={`rounded-xl px-3 py-2 ${engine === next ? "bg-white text-black" : "text-white/65 hover:bg-white/10"}`}
              >
                {next === "uv" ? "Ultraviolet" : "Scramjet"}
              </button>
            ))}
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
          <button onClick={() => setTarget((t) => t)} className="rounded-lg p-2 text-white/65 hover:bg-white/10 hover:text-white" title="Reload frame">
            <RotateCcw className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/55">
            {ready ? <Shield className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5 animate-pulse" />}
            {ready ? "Static proxies ready" : "Starting static proxies"}
          </div>
          {QUICK_LINKS.map((link) => (
            <button key={link} onClick={() => go(link)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70 hover:bg-white/10 hover:text-white">
              {link.replace(".com", "")}
            </button>
          ))}
        </div>

        {ready ? (
          <iframe
            key={`${engine}-${target}-${ready}`}
            title="Polaris Browser"
            src={src}
            className="min-h-0 flex-1 border-0 bg-black/40"
          />
        ) : (
          <div className="grid min-h-0 flex-1 place-items-center bg-black/35 text-center">
            <div className="space-y-2 px-6">
              <Zap className="mx-auto h-8 w-8 animate-pulse text-white" />
              <div className="text-sm font-bold text-white">Starting Polaris Browser</div>
              <div className="text-xs text-white/50">Registering static Ultraviolet and Scramjet workers…</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}