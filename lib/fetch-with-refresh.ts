import { useAuth } from '@/hooks/use-auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

export async function fetchWithRefresh(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authStore = useAuth.getState();
  const { accessToken, refreshToken, setAccessToken, logout } = authStore;

  // 토큰이 있으면 헤더에 추가 (기존 헤더 유지)
  if (accessToken) {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${accessToken}`);
    options.headers = headers;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, options);

    // 401 에러가 아니면 그대로 반환
    if (response.status !== 401) {
      return response;
    }

    // Refresh token이 없으면 로그아웃
    if (!refreshToken) {
      logout();
      throw new Error('No refresh token available');
    }

    // 이미 토큰 갱신 중이면 대기
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        // 새 토큰으로 재시도
        const newAccessToken = useAuth.getState().accessToken;
        const headers = new Headers(options.headers || {});
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        return fetch(`${API_BASE_URL}${url}`, { ...options, headers });
      });
    }

    isRefreshing = true;

    try {
      // Refresh token으로 새 access token 발급
      const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await refreshResponse.json();
      const newAccessToken = data.data?.accessToken || data.accessToken;

      if (!newAccessToken) {
        throw new Error('No access token in refresh response');
      }

      // 새 토큰 저장
      setAccessToken(newAccessToken);

      // 대기 중인 요청들 처리
      processQueue(null, newAccessToken);

      // 원래 요청 재시도
      const headers = new Headers(options.headers || {});
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      return fetch(`${API_BASE_URL}${url}`, { ...options, headers });
    } catch (error) {
      // Refresh 실패 시 로그아웃
      processQueue(error as Error, null);
      logout();
      throw error;
    } finally {
      isRefreshing = false;
    }
  } catch (error) {
    // 네트워크 에러 등
    throw error;
  }
}