import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  nickname: string
  preferredStyle: string
  gender: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (user: Partial<User>) => Promise<void>
  getAccessToken: () => string | null
  setAccessToken: (token: string) => void
  withdrawAccount: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        try {
          // stay-stylish 백엔드 로그인 API 호출
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            throw new Error("로그인에 실패했습니다");
          }

          const data = await response.json();
          
          // 백엔드 응답: { success, message, data: { user, accessToken, refreshToken } }
          set({ 
            user: data.user, 
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true 
          });
        } catch (error) {
          console.error("Login error:", error);
          throw error;
        }
      },
      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      updateUser: async (updatedUser) => {
        try {
          const token = get().accessToken;
          if (!token) {
            throw new Error("로그인이 필요합니다");
          }

          const response = await fetch("/api/auth/update-profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(updatedUser),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "프로필 업데이트에 실패했습니다");
          }

          const result = await response.json();
          
          set((state) => ({
            user: result,
          }));
        } catch (error) {
          console.error("Profile update error:", error);
          throw error;
        }
      },
      getAccessToken: () => get().accessToken,
      setAccessToken: (token: string) => set({ accessToken: token }),
      withdrawAccount: async () => {
        try {
          const token = get().accessToken;
          if (!token) {
            throw new Error("로그인이 필요합니다");
          }

          const response = await fetch("/api/v1/users/me", {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("회원탈퇴에 실패했습니다");
          }

          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        } catch (error) {
          console.error("Account withdrawal error:", error);
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)