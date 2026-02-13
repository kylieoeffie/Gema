// Deezer API integration
const DEEZER_API_BASE = 'https://api.deezer.com';

export async function searchTracks(query: string, limit = 12) {
  try {
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
      'https://cors-anywhere.herokuapp.com/'
    ];
    
    const deezerUrl = `${DEEZER_API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    
    for (const proxy of proxies) {
      try {
        const url = proxy + encodeURIComponent(deezerUrl);
        const response = await fetch(url);
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        return (data?.data || []).map((track: any) => ({
          id: track.id.toString(),
          name: track.title,
          artists: [{ name: track.artist.name }],
          album: {
            name: track.album.title,
            release_date: track.album.release_date || '',
            images: [
              { url: track.album.cover_xl || track.album.cover_big },
              { url: track.album.cover_big || track.album.cover_medium },
              { url: track.album.cover_medium || track.album.cover_small }
            ]
          },
          preview_url: track.preview,
          duration_ms: (track.duration || 0) * 1000,
          external_urls: {
            deezer: track.link
          }
        }));
      } catch (proxyError) {
        console.log(`Proxy ${proxy} failed:`, proxyError);
        continue;
      }
    }
    
    throw new Error('All CORS proxies failed');
  } catch (error) {
    console.error('Deezer search error:', error);
    
    try {
      const fallbackUrl = `${DEEZER_API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}&output=jsonp`;
      
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const callbackName = 'deezer_callback_' + Math.random().toString(36).substr(2, 9);
        
        (window as any)[callbackName] = (data: any) => {
          document.head.removeChild(script);
          delete (window as any)[callbackName];
          
          const tracks = (data?.data || []).map((track: any) => ({
            id: track.id.toString(),
            name: track.title,
            artists: [{ name: track.artist.name }],
            album: {
              name: track.album.title,
              release_date: track.album.release_date || '',
              images: [
                { url: track.album.cover_xl || track.album.cover_big },
                { url: track.album.cover_big || track.album.cover_medium },
                { url: track.album.cover_medium || track.album.cover_small }
              ]
            },
            preview_url: track.preview,
            duration_ms: (track.duration || 0) * 1000,
            external_urls: {
              deezer: track.link
            }
          }));
          
          resolve(tracks);
        };
        
        script.src = `${fallbackUrl}&callback=${callbackName}`;
        script.onerror = () => {
          document.head.removeChild(script);
          delete (window as any)[callbackName];
          reject(new Error('Failed to load Deezer API'));
        };
        
        document.head.appendChild(script);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if ((window as any)[callbackName]) {
            document.head.removeChild(script);
            delete (window as any)[callbackName];
            reject(new Error('Deezer API timeout'));
          }
        }, 10000);
      });
    } catch (fallbackError) {
      console.error('Deezer fallback error:', fallbackError);
      return [];
    }
  }
}

// Get track details by ID
export async function getTrack(trackId: string) {
  try {
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const deezerUrl = `${DEEZER_API_BASE}/track/${trackId}`;
    const url = proxyUrl + encodeURIComponent(deezerUrl);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`);
    }
    
    const track = await response.json();
    
    return {
      id: track.id.toString(),
      name: track.title,
      artists: [{ name: track.artist.name }],
      album: {
        name: track.album.title,
        release_date: track.album.release_date || '',
        images: [
          { url: track.album.cover_xl || track.album.cover_big },
          { url: track.album.cover_big || track.album.cover_medium },
          { url: track.album.cover_medium || track.album.cover_small }
        ]
      },
      preview_url: track.preview,
      duration_ms: (track.duration || 0) * 1000,
      external_urls: {
        deezer: track.link
      }
    };
  } catch (error) {
    console.error('Deezer get track error:', error);
    return null;
  }
}