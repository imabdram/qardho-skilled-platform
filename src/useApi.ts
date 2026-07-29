import { useAuth } from '@clerk/react';

export function useApi() {
  const { getToken, isLoaded } = useAuth();
  
  const fetchAuth = async (url: string, options: RequestInit = {}) => {
    if (!isLoaded) throw new Error('Clerk is not loaded yet');
    
    let token: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      token = await getToken({ skipCache: attempt > 0 }).catch(() => null);
      if (token) break;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 250));
    }

    const headers = new Headers(options.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    return fetch(url, { ...options, headers });
  };
  
  return fetchAuth;
}
