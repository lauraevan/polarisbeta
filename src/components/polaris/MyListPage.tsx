import { Trash2, Play, Film, Tv2, Gamepad2 } from "lucide-react";
import { useMyList } from "@/lib/mylist-context";
import { IMG } from "@/lib/tmdb";
import { Link } from "@tanstack/react-router";

export function MyListPage() {
  const { list, remove, games, removeGame } = useMyList();

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">My List</h1>
        <p className="mt-1 text-xs text-white/55">
          Your saved movies, shows and games — synced across Polaris.
        </p>
      </header>

      <Section title="Movies & Shows" icon={<Film className="h-4 w-4" />} count={list.length}>
        {list.length === 0 ? (
          <Empty hint="Tap “Add to My List” inside any movie or show." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {list.map((i) => (
              <div key={`${i.kind}-${i.id}`} className="liquid-glass group relative overflow-hidden rounded-xl">
                <Link to="/media" className="block">
                  {i.poster_path ? (
                    <img src={IMG(i.poster_path, "w300")} alt="" className="aspect-[2/3] w-full object-cover" />
                  ) : (
                    <div className="aspect-[2/3] w-full p-2 text-xs text-white/60">{i.title || i.name}</div>
                  )}
                  <div className="flex items-center gap-1 truncate px-2 py-1.5 text-[11px] font-medium text-white/90">
                    {i.kind === "tv" ? <Tv2 className="h-3 w-3 text-white/50" /> : <Film className="h-3 w-3 text-white/50" />}
                    <span className="truncate">{i.title || i.name}</span>
                  </div>
                </Link>
                <button
                  onClick={() => remove(i.kind, i.id)}
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white/80 opacity-0 transition group-hover:opacity-100 hover:text-white"
                  aria-label="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Games" icon={<Gamepad2 className="h-4 w-4" />} count={games.length}>
        {games.length === 0 ? (
          <Empty hint="Hit the bookmark on any game tile to save it here." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {games.map((g) => (
              <div key={g.id} className="liquid-glass group relative overflow-hidden rounded-xl">
                {g.cover ? (
                  <img src={g.cover} alt="" className="aspect-[2/3] w-full object-cover" />
                ) : (
                  <div className="aspect-[2/3] w-full bg-gradient-to-br from-stone-900 to-stone-950 p-2 text-xs text-white/60">
                    {g.title}
                  </div>
                )}
                <div className="truncate px-2 py-1.5 text-[11px] font-medium text-white/90">{g.title}</div>
                {g.launchUrl && (
                  <a
                    href={g.launchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-9 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white/80 opacity-0 transition group-hover:opacity-100 hover:text-white"
                    aria-label="Play"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  onClick={() => removeGame(g.id)}
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white/80 opacity-0 transition group-hover:opacity-100 hover:text-white"
                  aria-label="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center gap-2 text-white">
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-white/45">({count})</span>
      </div>
      {children}
    </section>
  );
}

function Empty({ hint }: { hint: string }) {
  return (
    <div className="liquid-glass-ghost rounded-2xl p-8 text-center text-xs text-white/55">
      Nothing saved yet. {hint}
    </div>
  );
}