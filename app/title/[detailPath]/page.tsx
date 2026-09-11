"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import VideoPlayer, { AudioOption, StreamOption, SubtitleOption } from "@/components/VideoPlayer";
import PersonCard from "@/components/PersonCard";
import ScrollRow from "@/components/ScrollRow";
import BackButton from "@/components/BackButton";
import { PlayIcon } from "@/components/icons";
import { getPreferredAudioLang, getProgress, saveProgress, setPreferredAudioLang } from "@/lib/clientStorage";

type Dub = {
  subjectId: string;
  detailPath: string;
  label: string;
  lanCode: string;
  isOriginal: boolean;
  isSubOnly: boolean;
};

type PlayingContext = {
  subjectId: string;
  detailPath: string;
  season?: number;
  episode?: number;
};

export default function MovieBoxDetailPage() {
  const params = useParams<{ detailPath: string }>();
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectId") ?? "";
  const type = parseInt(searchParams.get("type") ?? "1", 10);

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [season, setSeason] = useState<any>(null);
  const [selectedDub, setSelectedDub] = useState<Dub | null>(null);
  const [resumeHint, setResumeHint] = useState<{ season?: number; episode?: number; position: number } | null>(
    null,
  );
  const [playingContext, setPlayingContext] = useState<PlayingContext | null>(null);
  const [playback, setPlayback] = useState<{
    streams: StreamOption[];
    subtitles: SubtitleOption[];
    startAt: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyEpisode, setBusyEpisode] = useState<number | null>(null);

  const familyId = data?.dubs?.find((d: Dub) => d.isOriginal)?.subjectId || subjectId;

  useEffect(() => {
    fetch(`/api/moviebox/details?detailPath=${params.detailPath}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message ?? String(e)));
  }, [params.detailPath]);

  // Pick which dub starts selected, once details (and therefore the dubs
  // list) are in. Priority: (1) if you already started watching *this*
  // title in a specific dub, resume in that one — continuity for an
  // in-progress title matters more here than a general preference: (2)
  // otherwise apply the global "preferred audio language" (set whenever you
  // pick a dub on any title, not just this one) if this title happens to
  // have a matching dub — preferring an actual dub over a subtitle-only
  // entry of the same language, since this is specifically an *audio*
  // preference; (3) otherwise fall back to Original Audio.
  useEffect(() => {
    if (!data) return;
    const fam = data.dubs?.find((d: Dub) => d.isOriginal)?.subjectId || subjectId;
    const saved = getProgress(fam);
    const originalDub = data.dubs?.find((d: Dub) => d.isOriginal);

    let matchedDub: Dub | undefined;
    if (saved?.subjectId) {
      matchedDub = data.dubs?.find((d: Dub) => d.subjectId === saved.subjectId);
    }
    if (!matchedDub) {
      const preferredLang = getPreferredAudioLang();
      if (preferredLang) {
        matchedDub =
          data.dubs?.find((d: Dub) => d.lanCode === preferredLang && !d.isSubOnly) ??
          data.dubs?.find((d: Dub) => d.lanCode === preferredLang);
      }
    }
    setSelectedDub(
      matchedDub ??
        originalDub ?? { subjectId, detailPath: params.detailPath, label: "Original Audio", lanCode: "", isOriginal: true, isSubOnly: false },
    );

    if (data.isSeries && data.seasons?.length) {
      const targetSeason = saved?.season
        ? data.seasons.find((s: any) => s.se === saved.season)
        : data.seasons[0];
      setSeason(targetSeason ?? data.seasons[0]);
    }
    if (saved) setResumeHint({ season: saved.season, episode: saved.episode, position: saved.position });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function episodesForSeason(s: any): number[] {
    const allEpStr = String(s?.allEp ?? "");
    const maxEp = s?.maxEp ?? 0;
    if (allEpStr) {
      return allEpStr
        .split(",")
        .map((e: string) => parseInt(e.trim(), 10))
        .filter((e: number) => e > 0);
    }
    if (maxEp > 0) return Array.from({ length: maxEp }, (_, i) => i + 1);
    return [];
  }

  function selectDub(dub: Dub) {
    setSelectedDub(dub);
    setPreferredAudioLang(dub.lanCode);
  }

  async function resolveStream(dub: Dub, seasonNum?: number, episodeNum?: number) {
    const qs = new URLSearchParams({ subjectId: dub.subjectId, detailPath: dub.detailPath, type: String(type) });
    if (seasonNum) qs.set("season", String(seasonNum));
    if (episodeNum) qs.set("episode", String(episodeNum));
    const res = await fetch(`/api/moviebox/stream?${qs.toString()}`);
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error ?? "Failed to resolve stream");
    return json;
  }

  async function play(ep?: number) {
    if (!selectedDub) return;
    setBusy(true);
    setBusyEpisode(ep ?? null);
    setError(null);
    try {
      const seasonNum = season?.se;
      const json = await resolveStream(selectedDub, seasonNum, ep);
      setPlayingContext({
        subjectId: selectedDub.subjectId,
        detailPath: selectedDub.detailPath,
        season: seasonNum,
        episode: ep,
      });
      const matchesSaved =
        resumeHint && resumeHint.season === seasonNum && resumeHint.episode === ep;
      setPlayback({
        streams: json.allStreams,
        subtitles: json.subtitles ?? [],
        startAt: matchesSaved ? resumeHint!.position : 0,
      });
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setBusy(false);
      setBusyEpisode(null);
    }
  }

  // Audio switch mid-playback: each dub is a separate MovieBox subject, so
  // this re-resolves a whole new stream for the same season/episode rather
  // than swapping a track — VideoPlayer preserves currentTime across the
  // resulting `streams` prop change on its own.
  async function handleSelectAudio(newSubjectId: string) {
    const newDub = data?.dubs?.find((d: Dub) => d.subjectId === newSubjectId);
    if (!newDub) return;
    selectDub(newDub);
    if (!playingContext) return;

    const json = await resolveStream(newDub, playingContext.season, playingContext.episode);
    setPlayingContext({ ...playingContext, subjectId: newDub.subjectId, detailPath: newDub.detailPath });
    setPlayback({ streams: json.allStreams, subtitles: json.subtitles ?? [], startAt: 0 });
  }

  function handleProgress(currentTime: number, duration: number) {
    if (!playingContext || !data) return;
    saveProgress({
      familyId,
      subjectId: playingContext.subjectId,
      detailPath: playingContext.detailPath,
      title: data.title,
      poster: data.poster,
      type,
      season: playingContext.season,
      episode: playingContext.episode,
      position: currentTime,
      duration,
    });
  }

  if (error && !data) {
    return (
      <div className="p-6">
        <BackButton className="mb-4" />
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div>
        <div className="relative h-[38vw] max-h-90 min-h-45 w-full animate-pulse overflow-hidden bg-surface">
          <BackButton className="absolute top-4 left-4 sm:top-6 sm:left-6" />
        </div>
        <div className="mx-auto -mt-12 max-w-5xl px-4 pb-16 sm:-mt-20 sm:px-6">
          <div className="flex animate-pulse gap-4 sm:gap-6">
            <div className="aspect-2/3 w-24 shrink-0 rounded-lg bg-surface sm:w-40" />
            <div className="min-w-0 flex-1 space-y-3 pt-8 sm:pt-16">
              <div className="h-7 w-2/3 rounded bg-surface" />
              <div className="h-4 w-1/3 rounded bg-surface" />
              <div className="h-9 w-32 rounded-md bg-surface" />
            </div>
          </div>
          <div className="mt-6 animate-pulse space-y-2">
            <div className="h-3.5 w-full rounded bg-surface" />
            <div className="h-3.5 w-5/6 rounded bg-surface" />
            <div className="h-3.5 w-2/3 rounded bg-surface" />
          </div>
        </div>
      </div>
    );
  }

  const audioOptions: AudioOption[] = (data.dubs ?? []).map((d: Dub) => ({ id: d.subjectId, label: d.label }));
  const hasMovieResume = !data.isSeries && resumeHint && resumeHint.position > 0;

  return (
    <div>
      <div className="relative h-[38vw] max-h-90 min-h-45 w-full overflow-hidden bg-surface">
        {(data.backdrop || data.poster) && (
          <img
            src={data.backdrop || data.poster}
            alt=""
            // Real backdrops are shot landscape and crop fine with a plain
            // object-cover. When one isn't available and this falls back to
            // the (portrait) poster instead, a hard landscape crop of it
            // looks broken — scaled up and blurred reads as an intentional
            // atmospheric background instead, the same trick album-art /
            // poster-only backdrops commonly use.
            className={`absolute inset-0 h-full w-full object-cover ${
              !data.backdrop ? "scale-125 blur-2xl" : ""
            }`}
            onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0")}
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/30 to-transparent" />
        <BackButton className="absolute top-4 left-4 sm:top-6 sm:left-6" />
      </div>

      <div className="mx-auto -mt-12 max-w-5xl px-4 pb-16 sm:-mt-20 sm:px-6">
        <div className="flex gap-4 sm:gap-6">
          {data.poster && (
            <img
              src={data.poster}
              alt=""
              className="aspect-2/3 w-24 shrink-0 rounded-lg object-cover shadow-2xl shadow-black/60 sm:w-40"
            />
          )}
          <div className="min-w-0 flex-1 pt-8 sm:pt-16">
            <h1 className="text-xl font-bold text-white drop-shadow sm:text-3xl">{data.title}</h1>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              {[
                data.releaseYear,
                data.rating && `★ ${data.rating}`,
                data.genre,
                data.country,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </p>

            {audioOptions.length > 1 && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium tracking-wide text-muted uppercase">Audio</p>
                <div className="flex flex-wrap gap-2">
                  {data.dubs.map((dub: Dub) => {
                    const active = dub.subjectId === selectedDub?.subjectId;
                    return (
                      <button
                        key={dub.subjectId}
                        onClick={() => selectDub(dub)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          active
                            ? "border-accent bg-accent/15 text-accent"
                            : "border-white/10 bg-surface text-white/70 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        {dub.label}
                        {dub.isSubOnly ? " (Sub)" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!data.isSeries && (
              <button
                disabled={busy}
                onClick={() => play()}
                className="mt-4 flex items-center gap-2 rounded-md bg-accent px-6 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-strong disabled:opacity-50"
              >
                {busy ? (
                  "Resolving…"
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4" /> {hasMovieResume ? "Resume" : "Play"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {data.desc && <p className="mt-6 max-w-2xl text-sm text-white/70">{data.desc}</p>}

        {data.stars?.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-white/80 uppercase">Cast</h2>
            <ScrollRow contentClassName="gap-4 pb-2">
              {data.stars.map((s: any, i: number) => (
                <PersonCard
                  key={`${s.staffId}-${i}`}
                  staffId={s.staffId}
                  detailPath={s.detailPath}
                  name={s.name}
                  avatarUrl={s.avatarUrl}
                  subtitle={s.character}
                />
              ))}
            </ScrollRow>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {data.isSeries && (
          <div className="mt-8">
            {resumeHint?.season && resumeHint.episode && (
              <button
                disabled={busy}
                onClick={() => play(resumeHint.episode)}
                className="mb-4 flex items-center gap-2 rounded-md bg-accent px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-strong disabled:opacity-50"
              >
                <PlayIcon className="h-4 w-4" /> Resume S{resumeHint.season} E{resumeHint.episode}
              </button>
            )}
            {data.seasons.length > 1 && (
              <select
                value={season?.se}
                onChange={(e) =>
                  setSeason(data.seasons.find((s: any) => s.se.toString() === e.target.value))
                }
                className="mb-4 block rounded-md border border-white/10 bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
              >
                {data.seasons.map((s: any) => (
                  <option key={s.se} value={s.se}>
                    Season {s.se}
                  </option>
                ))}
              </select>
            )}
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {episodesForSeason(season).map((ep) => (
                <button
                  key={ep}
                  disabled={busy}
                  onClick={() => play(ep)}
                  className="rounded-md border border-white/10 bg-surface py-3 text-sm font-medium transition-colors hover:border-accent hover:bg-white/10 disabled:opacity-50"
                >
                  {busy && busyEpisode === ep ? "…" : ep}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {playback && (
        <VideoPlayer
          streams={playback.streams}
          subtitles={playback.subtitles}
          audioOptions={audioOptions}
          currentAudioId={selectedDub?.subjectId}
          onSelectAudio={handleSelectAudio}
          startAt={playback.startAt}
          onProgress={handleProgress}
          onClose={() => setPlayback(null)}
        />
      )}
    </div>
  );
}
