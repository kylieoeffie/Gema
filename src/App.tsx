import React, { useMemo, useState, useRef, useEffect } from "react";
import { searchTracks } from "./lib/deezer";
import { threadsAPI, suggestionsAPI, authAPI } from "./lib/api";
import { AuthPage } from "./components/Auth";

const initialSuggestions: any[] = [];

const getUsername = (user?: any) => {
  if (user) return `@${user.username}`;

  const saved = localStorage.getItem('samewave_username');
  if (saved) return saved;

  const adjectives = ['Cool', 'Awesome', 'Epic', 'Chill', 'Smooth', 'Dreamy', 'Vibey', 'Fresh'];
  const nouns = ['Listener', 'Vibes', 'Music', 'Beat', 'Sound', 'Wave', 'Tune', 'Melody'];
  const username = `@${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 100)}`;

  localStorage.setItem('samewave_username', username);
  return username;
};

// ---------------------- App ----------------------
export default function SongMatchingPrototype() {
  const [tab, setTab] = useState("home");
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [activeThreadId, setActiveThreadId] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session and load data
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);

      // Check for existing user session
      const savedUserId = localStorage.getItem('samewave_user_id');
      if (savedUserId) {
        try {
          const result = await authAPI.me(savedUserId);
          setUser(result.user);
        } catch (error) {
          console.error('Failed to validate session:', error);
          localStorage.removeItem('samewave_user_id');
        }
      }

      // Load app data
      try {
        const [threadsData, suggestionsData] = await Promise.all([
          threadsAPI.getAll(),
          suggestionsAPI.getAll()
        ]);
        setThreads(threadsData);
        setSuggestions(suggestionsData);
      } catch (error) {
        console.error('Failed to load data from backend:', error);
        // Fallback to localStorage if backend is down
        const savedThreads = localStorage.getItem('samewave_threads');
        const savedSuggestions = localStorage.getItem('samewave_suggestions');

        if (savedThreads) {
          try {
            setThreads(JSON.parse(savedThreads));
          } catch (e) {
            console.error('Failed to parse saved threads:', e);
          }
        }

        if (savedSuggestions) {
          try {
            setSuggestions(JSON.parse(savedSuggestions));
          } catch (e) {
            console.error('Failed to parse saved suggestions:', e);
          }
        }
      }

      setIsLoading(false);
    };

    initializeApp();
  }, []);

  const openThread = (id: string) => {
    setActiveThreadId(id);
    setTab("thread");
  };

  const addThread = async (seedTrackId: string, tags: string[], trackData?: any) => {
    try {
      const newThread = await threadsAPI.create({
        seedTrackId,
        tags,
        createdBy: getUsername(user),
        trackData
      });

      setThreads((t) => [newThread, ...t]);
      setActiveThreadId(newThread.id);
      setShowNewThread(false);
      setTab("thread");
    } catch (error) {
      console.error('Failed to create thread:', error);
      // Fallback to local creation
      const newThread = {
        id: `thr_${Math.random().toString(36).slice(2, 7)}`,
        seedTrackId,
        tags,
        createdBy: getUsername(user),
        createdAt: Date.now(),
        trackData
      };
      setThreads((t) => [newThread, ...t]);
      setActiveThreadId(newThread.id);
      setShowNewThread(false);
      setTab("thread");
    }
  };

  const filteredTracks = useMemo(() => {
    return []; // No mock tracks, only search results
  }, [query]);

  // --- Deezer live search ---
  const onSearch = async function () {
    if (!query.trim()) { setResults([]); return; }
    const items = await searchTracks(query, 12);
    console.log(items);
    const mapped = items.map((t: any) => {
      const coverUrl = t.album?.images?.[1]?.url || t.album?.images?.[0]?.url;
      console.log("Main search - Track cover URL:", coverUrl, "for track:", t.name);
      return {
        id: t.id,
        title: t.name,
        artist: (t.artists || []).map((a: any) => a.name).join(", "),
        year: (t.album?.release_date || "").slice(0, 4) || "",
        mood: [],
        energy: "",
        previewUrl: t.preview_url || undefined,
        cover: coverUrl,
      };
    });
    setResults(mapped);
  }

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId),
    [threads, activeThreadId]
  );

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('samewave_user_id', userData.id);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('samewave_user_id');
    localStorage.removeItem('samewave_username');
  };

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <span className="text-lg font-black">SW</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">SameWave</span>
          </div>
          <div className="text-sm text-zinc-500">Loading...</div>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <AppShell tab={tab} setTab={setTab} user={user} onLogout={handleLogout}>
        {tab === "home" && (
          <HomeFeed
            query={query}
            setQuery={setQuery}
            tracks={results.length ? results : filteredTracks}
            threads={threads}
            openThread={openThread}
            onSearch={onSearch}
            allTracks={[...results, ...threads.map(t => t.trackData).filter(Boolean)]}
          />
        )}

        {tab === "search" && (
          <SearchPage
            query={query}
            setQuery={setQuery}
            tracks={results.length ? results : filteredTracks}
            openThread={openThread}
            threads={threads}
            onSearch={onSearch}
            onStartThread={addThread}
          />
        )}

        {tab === "thread" && activeThread && (
          <ThreadPage
            thread={activeThread}
            tracks={[...results, activeThread.trackData].filter(Boolean)}
            suggestions={suggestions.filter((s) => s.threadId === activeThread.id)}
            onBack={() => setTab("home")}
            onUpvote={async (sid: any) => {
              try {
                const updatedSuggestion = await suggestionsAPI.upvote(sid);
                setSuggestions((list) =>
                  list.map((s) => (s.id === sid ? updatedSuggestion : s))
                );
              } catch (error) {
                console.error('Failed to upvote suggestion:', error);
                // Fallback to local update
                setSuggestions((list) =>
                  list.map((s) => (s.id === sid ? { ...s, votes: s.votes + 1 } : s))
                );
              }
            }}
            onAddSuggestion={async (trackId: any, reason: any, tags: any, trackData?: any) => {
              try {
                const newSuggestion = await suggestionsAPI.create({
                  threadId: activeThread.id,
                  trackId,
                  reason,
                  tags,
                  createdBy: getUsername(user),
                  trackData
                });

                setSuggestions((list) => [newSuggestion, ...list]);

                // Add the track to results if it's not already there
                if (trackData && !results.find(t => t.id === trackId)) {
                  setResults(prev => [...prev, trackData]);
                }
              } catch (error) {
                console.error('Failed to create suggestion:', error);
                // Fallback to local creation
                const newSuggestion = {
                  id: `s_${Math.random().toString(36).slice(2, 7)}`,
                  threadId: activeThread.id,
                  trackId,
                  reason,
                  tags,
                  createdBy: getUsername(user),
                  createdAt: Date.now(),
                  votes: 0,
                  trackData
                };
                setSuggestions((list) => [newSuggestion, ...list]);

                if (trackData && !results.find(t => t.id === trackId)) {
                  setResults(prev => [...prev, trackData]);
                }
              }
            }}
          />
        )}

        {tab === "profile" && <ProfilePage user={user} threads={threads} suggestions={suggestions} openThread={openThread} />}
      </AppShell>

      {showNewThread && (
        <NewThreadModal
          onClose={() => setShowNewThread(false)}
          tracks={results}
          onCreate={addThread}
        />
      )}
    </div>
  );
}

// ---------------------- Layout ----------------------
function AppShell({
  children,
  tab,
  setTab,
  user,
  onLogout
}: {
  children: React.ReactNode;
  tab: string;
  setTab: (t: string) => void;
  user: any;
  onLogout: () => void;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <header className="sticky top-0 z-10 -mx-4 border-b border-zinc-200/60 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-lg font-semibold tracking-tight">SameWave</span>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <TopButton active={tab === "home"} onClick={() => setTab("home")}>Home</TopButton>
            <TopButton active={tab === "search"} onClick={() => setTab("search")}>Search</TopButton>
            <TopButton active={tab === "profile"} onClick={() => setTab("profile")}>Profile</TopButton>

            {/* User Menu */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <img
                src={user.avatar}
                alt={user.username}
                className="h-8 w-8 rounded-full"
              />
              <span className="text-sm font-medium">@{user.username}</span>
              <button
                onClick={onLogout}
                className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200/60 bg-white/90 p-2 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2">
          <TabButton label="Home" active={tab === "home"} onClick={() => setTab("home")} />
          <TabButton label="Search" active={tab === "search"} onClick={() => setTab("search")} />
          <TabButton label="Profile" active={tab === "profile"} onClick={() => setTab("profile")} />
        </div>
      </nav>
    </div>
  );
}

function TopButton({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-xl px-3 py-2 text-sm font-medium " +
        (active ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800")
      }
    >
      {children}
    </button>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-2xl px-3 py-2 text-xs font-semibold " +
        (active ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200")
      }
    >
      {label}
    </button>
  );
}

function Logo() {
  return (
    <div className="grid h-7 w-7 place-items-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
      <span className="text-xs font-black">SW</span>
    </div>
  );
}

// ---------------------- Pages ----------------------
function HomeFeed({
  query,
  setQuery,
  tracks,
  threads,
  openThread,
  onSearch,
  allTracks
}: any) {
  return (
    <div className="space-y-6">
      <HeroSearch query={query} setQuery={setQuery} onSearch={onSearch} />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">Trending Threads</h2>
        {threads.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {threads.map((thr: any) => (
              <ThreadPreviewCard key={thr.id} thr={thr} tracks={allTracks} onOpen={() => openThread(thr.id)} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 p-8 text-center shadow-sm dark:border-zinc-800">
            <div className="text-sm text-zinc-500">No threads yet. Search for a song and start the first thread!</div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">Fresh Matches</h2>
        {tracks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {tracks.slice(0, 3).map((t: any) => (
              <SongCard key={t.id} track={t} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 p-8 text-center shadow-sm dark:border-zinc-800">
            <div className="text-sm text-zinc-500">Search for songs to see matches here</div>
          </div>
        )}
      </section>
    </div>
  );
}

function SearchPage({ query, setQuery, tracks, openThread, threads, onSearch, onStartThread }: any) {
  return (
    <div className="space-y-6">
      <HeroSearch query={query} setQuery={setQuery} onSearch={onSearch} />

      <div className="flex items-center gap-2">
        <FilterChip>Chill</FilterChip>
        <FilterChip>Upbeat</FilterChip>
        <FilterChip>2000s</FilterChip>
        <FilterChip>Low Energy</FilterChip>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tracks.map((t: any) => (
          <SearchResult key={t.id} track={t} threads={threads} openThread={openThread} onStartThread={onStartThread} />
        ))}
      </div>
    </div>
  );
}

function ProfilePage({ user, threads, suggestions, openThread }: any) {
  const userThreads = threads.filter((t: any) => t.createdBy === `@${user.username}`);
  const userSuggestions = suggestions.filter((s: any) => s.createdBy === `@${user.username}`);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <img
          src={user.avatar}
          alt={user.username}
          className="h-16 w-16 rounded-2xl"
        />
        <div>
          <div className="text-lg font-semibold">{user.username}</div>
          <div className="text-sm text-zinc-500">@{user.username} • Joined {new Date(user.createdAt).getFullYear()}</div>
          <div className="text-xs text-zinc-400">{user.email}</div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Threads Created" value={userThreads.length} />
        <StatCard label="Suggestions Made" value={userSuggestions.length} />
      </div>

      {userThreads.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 mb-3">Your Threads</h3>
          <div className="space-y-2">
            {userThreads.slice(0, 5).map((thread: any) => (
              <button
                key={thread.id}
                onClick={() => openThread(thread.id)}
                className="w-full rounded-xl border border-zinc-200 p-3 text-left hover:bg-zinc-50 hover:shadow-sm transition-all dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <Cover artKey={thread.trackData?.title} src={thread.trackData?.cover} small />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {thread.trackData?.title || 'Unknown Track'}
                      {thread.trackData?.artist && (
                        <span className="text-zinc-400"> — {thread.trackData.artist}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-xs text-zinc-500">{new Date(thread.createdAt).toLocaleDateString()}</div>
                      <div className="flex gap-1">
                        {thread.tags.map((tag: string) => (
                          <TagChip key={tag}>{tag}</TagChip>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-400">→</div>
                </div>
              </button>
            ))}

            {userThreads.length > 5 && (
              <div className="text-center pt-2">
                <div className="text-xs text-zinc-500">
                  Showing 5 of {userThreads.length} threads
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-4 shadow-sm dark:border-zinc-800">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}

// ---------------------- Thread Page ----------------------
function ThreadPage({ thread, tracks, suggestions, onUpvote, onAddSuggestion, onBack }: any) {
  const seed = tracks.find((t: any) => t.id === thread.seedTrackId) || thread.trackData;

  if (!seed) {
    return (
      <div className="rounded-2xl border border-zinc-200 p-8 text-center shadow-sm dark:border-zinc-800">
        <div className="text-sm text-zinc-500">Thread track not found</div>
        <button
          onClick={onBack}
          className="mt-4 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <span className="text-lg">←</span>
        Back to Home
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="flex items-start justify-between rounded-2xl border border-zinc-200 p-4 shadow-sm dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <Cover artKey={seed?.title} src={seed?.cover} />
              <div>
                <div className="text-lg font-semibold">
                  {seed?.title} <span className="text-zinc-400">—</span> {seed?.artist}
                </div>
                <div className="text-xs text-zinc-500">{seed?.year} • by {thread.createdBy}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {thread.tags.map((t: string) => (
                    <TagChip key={t}>{t}</TagChip>
                  ))}
                </div>
                <div className="mt-3"><MiniPlayer url={seed?.previewUrl} id={seed?.id || ""} /></div>
              </div>
            </div>
            <button className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-zinc-900">Follow thread</button>
          </div>

          <Composer onAdd={onAddSuggestion} />

          <div className="space-y-3">
            {suggestions
              .slice()
              .sort((a: any, b: any) => b.votes - a.votes)
              .map((s: any) => (
                <SuggestionCard key={s.id} s={s} track={tracks.find((t: any) => t.id === s.trackId) || s.trackData} onUpvote={() => onUpvote(s.id)} />
              ))}
          </div>
        </div>

        <aside className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Related</h3>
          {tracks.map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 text-sm shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
              <Cover artKey={t.title} src={t.cover} small />
              <div className="truncate">
                <div className="truncate font-medium">{t.title}</div>
                <div className="truncate text-xs text-zinc-500">{t.artist}</div>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function Composer({ onAdd }: any) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const toggleTag = (t: string) => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

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
        mood: [],
        energy: "",
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

  const add = () => {
    if (!selectedTrack) return;
    onAdd(selectedTrack.id, reason, tags, selectedTrack);
    setSearchQuery("");
    setSelectedTrack(null);
    setReason("");
    setTags([]);
    setSearchResults([]);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 p-4 shadow-sm dark:border-zinc-800">
      <div className="mb-2 text-sm font-semibold">Add a suggestion</div>
      <div className="grid gap-3 md:grid-cols-[1fr_240px]">
        <div className="relative">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchForTracks()}
            placeholder="Search for a song..."
            className="w-full rounded-xl border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            onClick={searchForTracks}
            disabled={isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-400 px-2 py-1 text-xs font-bold text-zinc-900 hover:bg-emerald-300 disabled:opacity-50"
          >
            {isSearching ? "..." : "Search"}
          </button>

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
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="reason (e.g., same dreamy pads)"
          className="w-full rounded-xl border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Chill", "Upbeat", "Night", "Dreamy", "Low", "High"].map((t) => (
          <button
            key={t}
            onClick={() => toggleTag(t)}
            className={
              "rounded-xl px-3 py-1 text-xs " +
              (tags.includes(t)
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200")
            }
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={() => {
            setSearchQuery("");
            setSelectedTrack(null);
            setReason("");
            setTags([]);
            setSearchResults([]);
          }}
          className="rounded-xl px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          onClick={add}
          disabled={!selectedTrack}
          className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-zinc-900 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function SuggestionCard({ s, track, onUpvote }: any) {
  if (!track) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200 p-4 shadow-sm dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 rounded-xl bg-zinc-200 dark:bg-zinc-800"></div>
          <div>
            <div className="text-sm font-semibold text-zinc-500">Track not found</div>
            <div className="text-xs text-zinc-500">by {s.createdBy}</div>
            <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{s.reason}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {s.tags.map((t: string) => (
                <TagChip key={t}>{t}</TagChip>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onUpvote}
            className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
          >
            ▲ Upvote
          </button>
          <div className="text-xs text-zinc-500">{s.votes}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200 p-4 shadow-sm dark:border-zinc-800">
      <div className="flex items-start gap-3">
        <Cover artKey={track.title} src={track.cover} />
        <div>
          <div className="text-sm font-semibold">{track.title} <span className="text-zinc-400">—</span> {track.artist}</div>
          <div className="text-xs text-zinc-500">by {s.createdBy}</div>
          <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{s.reason}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {s.tags.map((t: string) => (
              <TagChip key={t}>{t}</TagChip>
            ))}
          </div>
          <div className="mt-2"><MiniPlayer url={track.previewUrl} id={track.id} /></div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onUpvote}
          className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
        >
          ▲ Upvote
        </button>
        <div className="text-xs text-zinc-500">{s.votes}</div>
      </div>
    </div>
  );
}

// ---------------------- Bits ----------------------
function HeroSearch({ query, setQuery, onSearch }: any) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
      <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Find songs like…</div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="type a song, artist, or mood"
          className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button onClick={onSearch} className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-zinc-900">Search</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
        <span>Try:</span>
        {" "}
        {[
          "daft punk",
          "billie eilish",
          "the weeknd",
          "taylor swift",
          "ed sheeran",
        ].map((k) => (
          <button key={k} onClick={() => setQuery(k)} className="rounded-full bg-zinc-100 px-2 py-1 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThreadPreviewCard({ thr, tracks, onOpen }: any) {
  const seed = tracks.find((t: any) => t.id === thr.seedTrackId) || thr.trackData;

  if (!seed) {
    return (
      <button
        onClick={onOpen}
        className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 p-3 text-left shadow-sm transition hover:shadow-md dark:border-zinc-800"
      >
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-zinc-200 dark:bg-zinc-800"></div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-zinc-500">
              Track not found
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {thr.tags.map((t: string) => (
                <TagChip key={t}>{t}</TagChip>
              ))}
            </div>
            <div className="mt-2 text-xs text-zinc-500">by {thr.createdBy}</div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onOpen}
      className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 p-3 text-left shadow-sm transition hover:shadow-md dark:border-zinc-800"
    >
      <div className="flex items-center gap-3">
        <Cover artKey={seed.title} src={seed.cover} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {seed.title} <span className="text-zinc-400">—</span> {seed.artist}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {thr.tags.map((t: string) => (
              <TagChip key={t}>{t}</TagChip>
            ))}
          </div>
          <div className="mt-2 text-xs text-zinc-500">by {thr.createdBy}</div>
        </div>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <MiniPlayer url={seed.previewUrl} id={seed.id} />
        <span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">▲ 0</span>
      </div>
    </button>
  );
}

function SearchResult({ track, threads, openThread, onStartThread }: any) {
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const existing = threads.find((t: any) => t.seedTrackId === track.id);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleStartThread = () => {
    if (selectedTags.length === 0) {
      setSelectedTags(["Chill"]); // Default tag
    }
    onStartThread(track.id, selectedTags.length > 0 ? selectedTags : ["Chill"], track);
    setShowTagSelector(false);
    setSelectedTags([]);
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
          <div className="mt-2"><MiniPlayer url={track.previewUrl} id={track.id} /></div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {track.mood.map((m: string) => (
            <TagChip key={m}>{m}</TagChip>
          ))}
        </div>
        {existing ? (
          <button onClick={() => openThread(existing.id)} className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900">
            Open thread
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

function SongCard({ track }: any) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-4 shadow-sm dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <Cover artKey={track.title} src={track.cover} />
        <div>
          <div className="text-sm font-semibold">{track.title}</div>
          <div className="text-xs text-zinc-500">{track.artist}</div>
          <div className="mt-2"><MiniPlayer url={track.previewUrl} id={track.id} /></div>
        </div>
      </div>
    </div>
  );
}

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
          console.log("Image failed to load (likely CORS):", src);
          setImageError(true);
        }}
        onLoad={() => {
          console.log("Image loaded successfully:", src);
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

function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
      {children}
    </span>
  );
}

function FilterChip({ children }: { children: React.ReactNode }) {
  return (
    <button className="rounded-xl bg-zinc-100 px-3 py-1 text-xs font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
      {children}
    </button>
  );
}

function MiniPlayer({ url }: { url?: string; id?: string }) {
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

function NewThreadModal({ onClose, tracks, onCreate }: any) {
  const [pick, setPick] = useState<string>(tracks[0]?.id ?? "");
  const [tags, setTags] = useState<string[]>(["Chill"]);
  const toggleTag = (t: string) => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">Start a new thread</div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">✕</button>
        </div>

        <label className="text-xs text-zinc-500">Seed track</label>
        <select value={pick} onChange={(e) => setPick(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          {tracks.map((t: any) => (
            <option key={t.id} value={t.id}>
              {t.title} — {t.artist}
            </option>
          ))}
        </select>

        <div className="mt-3 text-xs text-zinc-500">Tags</div>
        <div className="mt-1 flex flex-wrap gap-2">
          {["Chill", "Dreamy", "Night", "Upbeat"].map((t) => (
            <button
              key={t}
              onClick={() => toggleTag(t)}
              className={
                "rounded-xl px-3 py-1 text-xs " +
                (tags.includes(t)
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200")
              }
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
          <button onClick={() => onCreate(pick, tags)} className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-zinc-900">Create</button>
        </div>
      </div>
    </div>
  );
}