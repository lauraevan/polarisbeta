import { useState, useEffect } from "react";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { MediaKind } from "@/lib/tmdb";

type RatingRow = {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  username: string | null;
  created_at: string;
};

export function CommunityRatings({ kind, tmdbId }: { kind: MediaKind; tmdbId: number }) {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<RatingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState<number>(0);
  const [myComment, setMyComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    setLoading(true);
    const { data } = await supabase
      .from("movie_ratings")
      .select("id,user_id,rating,comment,username,created_at")
      .eq("kind", kind)
      .eq("tmdb_id", tmdbId)
      .order("created_at", { ascending: false })
      .limit(50);
    const list = (data ?? []) as RatingRow[];
    setRows(list);
    if (user) {
      const mine = list.find((r) => r.user_id === user.id);
      if (mine) {
        setMyRating(mine.rating);
        setMyComment(mine.comment ?? "");
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, tmdbId, user?.id]);

  async function submit() {
    if (!user || !myRating) return;
    setSubmitting(true);
    await supabase.from("movie_ratings").upsert(
      {
        user_id: user.id,
        kind,
        tmdb_id: tmdbId,
        rating: myRating,
        comment: myComment.trim() || null,
        username: profile?.username ?? profile?.display_name ?? "Anonymous",
      },
      { onConflict: "user_id,kind,tmdb_id" },
    );
    setSubmitting(false);
    refresh();
  }

  const avg = rows.length
    ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1)
    : null;

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">
          Community Rating
        </h3>
        {avg && (
          <div className="flex items-center gap-1 text-sm font-semibold text-white">
            <Star className="h-4 w-4 fill-[rgb(var(--polaris-accent))] text-[rgb(var(--polaris-accent))]" />
            {avg} <span className="text-white/50">/ 10</span>
            <span className="ml-2 text-[11px] font-normal text-white/45">
              ({rows.length} {rows.length === 1 ? "vote" : "votes"})
            </span>
          </div>
        )}
      </div>

      {user ? (
        <div className="liquid-glass rounded-xl p-3">
          <div className="mb-2 flex items-center gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setMyRating(n)}
                className="rounded p-0.5 transition hover:scale-110"
                aria-label={`Rate ${n}`}
              >
                <Star
                  className={`h-4 w-4 ${
                    n <= myRating
                      ? "fill-[rgb(var(--polaris-accent))] text-[rgb(var(--polaris-accent))]"
                      : "text-white/30"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-xs text-white/55">
              {myRating ? `${myRating}/10` : "Pick a rating"}
            </span>
          </div>
          <textarea
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            placeholder="Optional review…"
            rows={2}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={submit}
              disabled={!myRating || submitting}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
              style={{ background: "rgb(var(--polaris-accent))" }}
            >
              {submitting ? "Saving…" : "Submit rating"}
            </button>
          </div>
        </div>
      ) : (
        <div className="liquid-glass rounded-xl p-3 text-xs text-white/55">
          Sign in to rate this {kind === "movie" ? "movie" : "show"}.
        </div>
      )}

      {loading ? (
        <div className="mt-3 flex justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-white/40" />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-3 text-center text-xs text-white/40">
          No community ratings yet — be the first!
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {rows.slice(0, 8).map((r) => (
            <div key={r.id} className="liquid-glass-ghost rounded-lg p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  {r.username ?? "Anonymous"}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-white/70">
                  <Star className="h-3 w-3 fill-[rgb(var(--polaris-accent))] text-[rgb(var(--polaris-accent))]" />
                  {r.rating}/10
                </span>
              </div>
              {r.comment && (
                <p className="mt-1 flex items-start gap-1 text-[11px] text-white/70">
                  <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-white/40" />
                  {r.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}