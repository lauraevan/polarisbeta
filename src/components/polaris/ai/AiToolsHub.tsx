import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { MessageSquare, Users, Image as ImageIcon, Wand2 } from "lucide-react";
import { PolarisAI } from "./PolarisAI";
import { MultiModelAI } from "./MultiModelAI";
import { ImageGen } from "./ImageGen";
import { AiMatch } from "./AiMatch";

type TabId = "chat" | "multi" | "image" | "match";

const TABS: { id: TabId; label: string; icon: typeof MessageSquare; desc: string }[] = [
  { id: "chat",  label: "Chat",        icon: MessageSquare, desc: "Polaris AI assistant" },
  { id: "multi", label: "Multi-Model", icon: Users,         desc: "Two AIs collaborate" },
  { id: "image", label: "Image Gen",   icon: ImageIcon,     desc: "Prompt → image" },
  { id: "match", label: "Match Maker", icon: Wand2,         desc: "Movies, shows, anime" },
];

function isTab(v: unknown): v is TabId {
  return v === "chat" || v === "multi" || v === "image" || v === "match";
}

export function AiToolsHub() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tab?: string };
  const initial: TabId = isTab(search.tab) ? search.tab : "chat";
  const [tab, setTab] = useState<TabId>(initial);

  useEffect(() => {
    if (isTab(search.tab) && search.tab !== tab) setTab(search.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.tab]);

  function pick(id: TabId) {
    setTab(id);
    navigate({ to: "/ai", search: { tab: id } as never, replace: true });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Sub-tab nav */}
      <div className="liquid-glass-themed sticky top-0 z-10 px-3 py-2 sm:px-4">
        <div className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto scrollbar-none">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => pick(t.id)}
                title={t.desc}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                  active ? "text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {active && (
                  <span
                    className="pointer-events-none absolute inset-0 rounded-xl"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(var(--polaris-accent)/0.25), rgba(var(--polaris-accent)/0.08))",
                      boxShadow: "inset 0 0 0 1px rgba(var(--polaris-accent)/0.5)",
                    }}
                  />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "chat"  && <PolarisAI />}
        {tab === "multi" && <MultiModelAI />}
        {tab === "image" && <div className="py-6"><ImageGen /></div>}
        {tab === "match" && <div className="py-6"><AiMatch /></div>}
      </div>
    </div>
  );
}