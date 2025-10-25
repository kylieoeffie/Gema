const API_BASE = import.meta.env.VITE_API_BASE ;
const access_token = `Bearer ${localStorage.getItem("spotify_access_token")}`;

export async function searchTracks(q: string, limit = 12) {
  console.log(import.meta.env);
  const res = await fetch(
    `${API_BASE}/search?q=${encodeURIComponent(q)}&type=track&limit=${limit}&market=IT` , {
      headers: {
        Authorization: access_token,
      },
    }
  );
  const data = await res.json();
  return (data?.tracks?.items ?? []) as any[];
}
