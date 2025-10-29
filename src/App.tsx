import { useState, useEffect, useRef } from "react";
import { searchTracks } from "./lib/deezer";

const getUsername = () => {
  const saved = localStorage.getItem('samewave_username');
  if (saved) return saved;

  const adjectives = ['Cool', 'Awesome', 'Epic', 'Chill', 'Smooth', 'Dreamy', 'Vibey', 'Fresh'];
  const nouns = ['Listener', 'Vibes', 'Music', 'Beat', 'Sound', 'Wave', 'Tune', 'Melody'];
  const username = `@${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 100)}`;

  localStorage.setItem('samewave_username', username);
  return username;
};

export default function App() {
  const [tab, setTab] = useState("home");
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState("");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const savedThreads = localStorage.getItem('samewave_threads');
    const savedSuggestions = localStorage.getItem('samewave_suggestions');

    if (savedThreads) {
      try {
        setThreads(JSON.parse(savedThreads));
      } catch (error) {
        console.error('Failed to load threads:', error);
      }
    }

    if (savedSuggestions) {
      try {
        setSuggestions(JSON.parse(savedSuggestions));
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('samewave_threads', JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    localStorage.setItem('samewave_suggestions', JSON.stringify(suggestions));
  }, [suggestions]);

  const addThread = (seedTrackId: string, tags: string[], trackData?: any) => {
    const newThread = {
      id: `thr_${Math.random().toString(36).slice(2, 7)}`,
      seedTrackId,
      tags,
      createdBy: getUsername(),
      createdAt: Date.now(),
      trackData
    };
    setThreads((t) => [newThread, ...t]);
    setActiveThreadId(newThread.id);
    // Switch to thread view to see the new thread
    setTab("thread");
  };

  const openThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setTab("thread");
  };

  const onSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      const items = await searchTracks(query, 12);
      const mapped = items.map((t: any) => ({
        id: t.id,
        title: t.name,
        artist: (t.artists || []).map((a: any) => a.name).join(", "),
        year: (t.album?.release_date || "").slice(0, 4) || "",
        mood: [],
        energy: "",
        previewUrl: t.preview_url || undefined,
        cover: t.album?.images?.[1]?.url || t.album?.images?.[0]?.url,
      }));
      setResults(mapped);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-6xl px-4">
        <header className="sticky top-0 z-10 -mx-4 border-b border-zinc-200/60 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                <span className="text-xs font-black">SW</span>
              </div>
              <span className="text-lg font-semibold tracking-tight">SameWave</span>
              <span className="ml-2 text-xs text-zinc-500">prototype</span>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <button
                onClick={() => setTab("home")}
                className={
                  "rounded-xl px-3 py-2 text-sm font-medium " +
                  (tab === "home" ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800")
                }
              >
                Home
              </button>
              <button
                onClick={() => setTab("search")}
                className={
                  "rounded-xl px-3 py-2 text-sm font-medium " +
                  (tab === "search" ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800")
                }
              >
                Search
              </button>
            </div>
          </div>
        </header>

        <main className="py-6">
          {tab === "home" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
                <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Find songs like…</div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="type a song, artist, or mood"
                    className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <button onClick={onSearch} className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-zinc-900">
                    Search
                  </button>
                </div>
              </div>

              <section>
                <h2 className="mb-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">Your Threads</h2>
                {threads.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {threads.map((thread) => (
                      <button 
                        key={thread.id} 
                        onClick={() => openThread(thread.id)}
                        className="w-full rounded-2xl border border-zinc-200 p-4 shadow-sm dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Cover artKey={thread.trackData?.title} src={thread.trackData?.cover} />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {thread.trackData?.title || 'Unknown Track'} <span className="text-zinc-400">—</span> {thread.trackData?.artist || 'Unknown Artist'}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {thread.tags.map((tag: string) => (
                                <TagChip key={tag}>{tag}</TagChip>
                              ))}
                            </div>
                            <div className="mt-2 text-xs text-zinc-500">
                              Created {new Date(thread.createdAt).toLocaleDateString()} by {thread.createdBy}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-zinc-200 p-8 text-center shadow-sm dark:border-zinc-800">
                    <div className="text-sm text-zinc-500">No threads yet. Search for a song and start your first thread!</div>
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">Search Results</h2>
                {results.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {results.map((track) => (
                      <div key={track.id} className="rounded-2xl border border-zinc-200 p-4 shadow-sm dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                          <Cover artKey={track.title} src={track.cover} />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {track.title} <span className="text-zinc-400">—</span> {track.artist}
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">{track.year}</div>
                            <div className="mt-2"><MiniPlayer url={track.previewUrl} /></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-zinc-200 p-8 text-center shadow-sm dark:border-zinc-800">
                    <div className="text-sm text-zinc-500">Search for songs to see results here</div>
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === "search" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
                <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Find songs like…</div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="type a song, artist, or mood"
                    className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <button onClick={onSearch} className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-zinc-900">
                    Search
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.map((track) => (
                  <SearchResult key={track.id} track={track} threads={threads} onStartThread={addThread} />
                ))}
              </div>
            </div>
          )}

          {tab === "thread" && activeThreadId && (
            <ThreadView 
              thread={threads.find(t => t.id === activeThreadId)}
              suggestions={suggestions.filter(s => s.threadId === activeThreadId)}
              onBack={() => setTab("home")}
              onAddSuggestion={(trackId: string, reason: string, tags: string[], trackData?: any) => {
                setSuggestions(prev => [
                  {
                    id: `s_${Math.random().toString(36).slice(2, 7)}`,
                    threadId: activeThreadId,
                    trackId,
                    reason,
                    tags,
                    createdBy: getUsername(),
                    createdAt: Date.now(),
                    votes: 0,
                    trackData
                  },
                  ...prev
                ]);
              }}
              onUpvote={(suggestionId: string) => {
                setSuggestions(prev => 
                  prev.map(s => 
                    s.id === suggestionId 
                      ? { ...s, votes: s.votes + 1 }
                      : s
                  )
                );
              }}
            />
          )}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200/60 bg-white/90 p-2 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
            <button
              onClick={() => setTab("home")}
              className={
                "rounded-2xl px-3 py-2 text-xs font-semibold " +
                (tab === "home" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200")
              }
            >
              Home
            </button>
            <button
              onClick={() => setTab("search")}
              className={
                "rounded-2xl px-3 py-2 text-xs font-semibold " +
                (tab === "search" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200")
              }
            >
              Search
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
// UI Components
function Cover({ artKey, small, src }: { artKey?: string; small?: boolean; src?: string }) {
  const [imageError, setImageError] = useState(false);
  const hue = Math.abs(Array.from(artKey || 'default').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;
  const size = small ? "h-10 w-10 rounded-lg" : "h-14 w-14 rounded-xl";

  if (src && !imageError) {
    return (
      <img
        className={`${size} object-cover`}
        src={`https://images.weserv.nl/?url=${encodeURIComponent(src)}&w=300&h=300&fit=cover`}
        alt=""
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onError={() => {
          setImageError(true);
        }}
      />
    );
  }

  return (
    <div
      className={`${size} grid place-items-center text-xs font-bold text-zinc-900`}
      style={{ background: `hsl(${hue} 70% 82%)` }}
    >
      ♪
    </div>
  );
}

function MiniPlayer({ url }: { url?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress((a.currentTime / (a.duration || 30)) * 100);
    const onEnded = () => setPlaying(false);
    const onError = () => {
      setError(true);
      setPlaying(false);
    };

    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);

    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
    };
  }, []);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a || !url) return;

    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      try {
        setError(false);
        a.currentTime = 0;
        await a.play();
        setPlaying(true);
      } catch (err) {
        console.error('Audio play error:', err);
        setError(true);
        setPlaying(false);
      }
    }
  };

  if (!url) {
    return (
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-full border border-zinc-300 text-xs opacity-50 dark:border-zinc-700">
          ✕
        </div>
        <div className="text-xs text-zinc-400">No preview</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={error}
        className={`grid h-8 w-8 place-items-center rounded-full border text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 ${error
          ? 'border-red-300 text-red-500 cursor-not-allowed'
          : 'border-zinc-300 dark:border-zinc-700'
          }`}
      >
        {error ? "✕" : (playing ? "❚❚" : "▶")}
      </button>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full bg-emerald-400 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <audio ref={audioRef} src={url} preload="none" crossOrigin="anonymous" />
    </div>
  );
}

function SearchResult({ track, threads, onStartThread }: any) {
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [justCreated, setJustCreated] = useState(false);
  const existing = threads.find((t: any) => t.seedTrackId === track.id);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleStartThread = () => {
    if (selectedTags.length === 0) {
      setSelectedTags(["Chill"]);
    }
    onStartThread(track.id, selectedTags.length > 0 ? selectedTags : ["Chill"], track);
    setShowTagSelector(false);
    setSelectedTags([]);
    setJustCreated(true);
    // Reset success state after 3 seconds
    setTimeout(() => setJustCreated(false), 3000);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 p-4 shadow-sm dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <Cover artKey={track.title} src={track.cover} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {track.title} <span className="text-zinc-400">—</span> {track.artist}
          </div>
          <div className="mt-1 text-xs text-zinc-500">{track.year}</div>
          <div className="mt-2"><MiniPlayer url={track.previewUrl} /></div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {track.mood.map((m: string) => (
            <TagChip key={m}>{m}</TagChip>
          ))}
        </div>
        {existing || justCreated ? (
          <button className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900">
            {justCreated ? "✓ Thread Created!" : "Open thread"}
          </button>
        ) : (
          <button onClick={() => setShowTagSelector(true)} className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-zinc-900">
            Start thread
          </button>
        )}
      </div>

      {showTagSelector && (
        <div className="mt-3 rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">Select tags for this thread:</div>
          <div className="mb-3 flex flex-wrap gap-2">
            {["Chill", "Upbeat", "Dreamy", "Night", "Smooth", "High Energy"].map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={
                  "rounded-lg px-2 py-1 text-xs " +
                  (selectedTags.includes(tag)
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600")
                }
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowTagSelector(false)}
              className="rounded-lg px-3 py-1 text-xs text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleStartThread}
              className="rounded-lg bg-emerald-400 px-3 py-1 text-xs font-bold text-zinc-900"
            >
              Create Thread
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
      {children}
    </span>
  );
}

function ThreadView({ thread, suggestions, onBack, onAddSuggestion, onUpvote }: any) {
  if (!thread) {
    return (
      <div className="rounded-2xl border border-zinc-200 p-8 text-center shadow-sm dark:border-zinc-800">
        <div className="text-sm text-zinc-500">Thread not found</div>
        <button
          onClick={onBack}
          className="mt-4 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
        >
          Go Back
        </button>
      </div>
    );
  }

  const seed = thread.trackData;

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <span className="text-lg">←</span>
        Back to Home
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Thread Header */}
          <div className="rounded-2xl border border-zinc-200 p-6 shadow-sm dark:border-zinc-800">
            <div className="flex items-start gap-4">
              <Cover artKey={seed?.title} src={seed?.cover} />
              <div className="flex-1">
                <div className="text-xl font-bold">
                  {seed?.title || 'Unknown Track'} <span className="text-zinc-400">—</span> {seed?.artist || 'Unknown Artist'}
                </div>
                <div className="mt-1 text-sm text-zinc-500">{seed?.year} • by {thread.createdBy}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {thread.tags.map((tag: string) => (
                    <span key={tag} className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  <MiniPlayer url={seed?.previewUrl} />
                </div>
              </div>
            </div>
          </div>

          {/* Add Recommendation */}
          <RecommendationComposer onAdd={onAddSuggestion} />

          {/* Recommendations List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recommendations ({suggestions.length})</h3>
            {suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions
                  .slice()
                  .sort((a: any, b: any) => b.votes - a.votes)
                  .map((suggestion: any) => (
                    <RecommendationCard 
                      key={suggestion.id} 
                      suggestion={suggestion} 
                      onUpvote={() => onUpvote(suggestion.id)} 
                    />
                  ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 p-8 text-center shadow-sm dark:border-zinc-800">
                <div className="text-sm text-zinc-500">No recommendations yet. Be the first to add one!</div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 p-4 shadow-sm dark:border-zinc-800">
            <h4 className="text-sm font-semibold mb-3">Thread Info</h4>
            <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <div>Created: {new Date(thread.createdAt).toLocaleDateString()}</div>
              <div>Creator: {thread.createdBy}</div>
              <div>Recommendations: {suggestions.length}</div>
              <div>Total Votes: {suggestions.reduce((sum: number, s: any) => sum + s.votes, 0)}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RecommendationComposer({ onAdd }: any) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const searchForTracks = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const items = await searchTracks(searchQuery, 8);
      const mapped = items.map((t: any) => ({
        id: t.id,
        title: t.name,
        artist: (t.artists || []).map((a: any) => a.name).join(", "),
        year: (t.album?.release_date || "").slice(0, 4) || "",
        previewUrl: t.preview_url || undefined,
        cover: t.album?.images?.[1]?.url || t.album?.images?.[0]?.url,
      }));
      setSearchResults(mapped);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const selectTrack = (track: any) => {
    setSelectedTrack(track);
    setSearchQuery(`${track.title} — ${track.artist}`);
    setSearchResults([]);
  };

  const handleAdd = () => {
    if (!selectedTrack || !reason.trim()) return;
    
    onAdd(selectedTrack.id, reason, tags, selectedTrack);
    
    // Reset form
    setSearchQuery("");
    setSelectedTrack(null);
    setReason("");
    setTags([]);
    setSearchResults([]);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 p-6 shadow-sm dark:border-zinc-800">
      <h3 className="text-lg font-semibold mb-4">Add a Recommendation</h3>
      
      <div className="space-y-4">
        {/* Track Search */}
        <div className="relative">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Search for a song
          </label>
          <div className="relative">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchForTracks()}
              placeholder="Search for a song to recommend..."
              className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              onClick={searchForTracks}
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-400 px-3 py-1 text-xs font-bold text-zinc-900 hover:bg-emerald-300 disabled:opacity-50"
            >
              {isSearching ? "..." : "Search"}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-xl border border-zinc-300 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              {searchResults.map((track) => (
                <button
                  key={track.id}
                  onClick={() => selectTrack(track)}
                  className="flex w-full items-center gap-3 p-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <Cover artKey={track.title} src={track.cover} small />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{track.title}</div>
                    <div className="truncate text-xs text-zinc-500">{track.artist}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Why do you recommend this? *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Similar dreamy atmosphere, same producer, matching energy..."
            className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            rows={3}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Tags (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {["Similar Vibe", "Same Artist", "Same Genre", "Same Era", "Similar Energy", "Same Producer"].map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={
                  "rounded-lg px-3 py-1 text-xs font-medium " +
                  (tags.includes(tag)
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700")
                }
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedTrack(null);
              setReason("");
              setTags([]);
              setSearchResults([]);
            }}
            className="rounded-xl px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Clear
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedTrack || !reason.trim()}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Recommendation
          </button>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ suggestion, onUpvote }: any) {
  const track = suggestion.trackData;

  return (
    <div className="rounded-2xl border border-zinc-200 p-4 shadow-sm dark:border-zinc-800">
      <div className="flex items-start gap-4">
        <Cover artKey={track?.title} src={track?.cover} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">
                {track?.title || 'Unknown Track'} <span className="text-zinc-400">—</span> {track?.artist || 'Unknown Artist'}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                Recommended by {suggestion.createdBy} • {new Date(suggestion.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 ml-4">
              <button
                onClick={onUpvote}
                className="rounded-lg bg-emerald-100 hover:bg-emerald-200 p-2 text-emerald-700 dark:bg-emerald-900 dark:hover:bg-emerald-800 dark:text-emerald-300"
              >
                <span className="text-sm">▲</span>
              </button>
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{suggestion.votes}</span>
            </div>
          </div>
          
          <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
            {suggestion.reason}
          </div>
          
          {suggestion.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {suggestion.tags.map((tag: string) => (
                <TagChip key={tag}>{tag}</TagChip>
              ))}
            </div>
          )}
          
          {track?.previewUrl && (
            <div className="mt-3">
              <MiniPlayer url={track.previewUrl} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}