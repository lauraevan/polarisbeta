import { useState } from "react";

export function LiteBrowser() {
  const [url, setUrl] = useState("https://duckduckgo.com");
  const [src, setSrc] = useState("https://duckduckgo.com");

  function go(e?: React.FormEvent) {
    e?.preventDefault();
    let u = url.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) {
      u = u.includes(" ") || !u.includes(".")
        ? `https://duckduckgo.com/?q=${encodeURIComponent(u)}`
        : `https://${u}`;
    }
    setUrl(u);
    setSrc(u);
  }

  return (
    <div className="flex h-[calc(100vh-49px)] flex-col">
      <form onSubmit={go} className="flex gap-2 border-b border-neutral-800 bg-neutral-950 px-3 py-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Search or enter URL"
          className="flex-1 rounded border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-600"
        />
        <button className="rounded bg-white px-3 py-1.5 text-sm font-bold text-black">Go</button>
      </form>
      <iframe
        src={src}
        title="Lite Browser"
        className="flex-1 w-full border-0 bg-white"
        sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
      />
      <div className="border-t border-neutral-800 bg-neutral-950 px-3 py-1 text-[10px] text-neutral-600">
        Direct frame — many sites block embedding. Switch to Heavy mode for the full proxy browser.
      </div>
    </div>
  );
}