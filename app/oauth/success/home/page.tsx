"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function OAuthSuccessPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string>("")

    useEffect(() => {
        const handleCallback = async () => {
            // URL에서 일회용 코드 추출
            const code = searchParams.get('code')

            if (!code) {
                setError('인증 코드가 없습니다.')
                setTimeout(() => router.push('/login'), 2000)
                return
            }

            try {
                console.log('[OAuth Success] 일회용 코드 수신:', code)

                // 백엔드에 일회용 코드 전송하여 토큰 교환
                const response = await fetch('/api/auth/oauth/exchange', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code }),
                })

                console.log('[OAuth Success] 교환 API 응답 상태:', response.status)

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(errorData.error || '토큰 교환에 실패했습니다.')
                }

                const data = await response.json()
                console.log('[OAuth Success] 토큰 교환 성공, isNewUser:', data.isNewUser)

                // 사용자 정보 가져오기
                const userResponse = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${data.accessToken}`,
                    },
                })

                if (!userResponse.ok) {
                    throw new Error('사용자 정보 조회 실패')
                }

                const userData = await userResponse.json()
                console.log('[OAuth Success] 사용자 정보 조회 성공:', userData.email)

                // Zustand 스토어에 저장
                useAuth.setState({
                    user: userData,
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    isAuthenticated: true,
                })

                // URL 정리 (브라우저 히스토리에서 코드 제거)
                window.history.replaceState({}, document.title, '/')

                // 신규 유저면 추가 정보 입력 페이지로, 아니면 홈으로
                if (data.isNewUser) {
                    console.log('[OAuth Success] 신규 유저 → 추가 정보 입력 페이지로 이동')
                    router.push('/signup/additional')
                } else {
                    console.log('[OAuth Success] 기존 유저 → 홈으로 이동')
                    router.push('/')
                }
            } catch (err) {
                console.error('[OAuth Success] 오류 발생:', err)
                setError(err instanceof Error ? err.message : '로그인 처리 중 오류가 발생했습니다.')
                setTimeout(() => router.push('/login'), 3000)
            }
        }

        handleCallback()
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="text-center space-y-4">
                {error ? (
                    <>
                        <div className="text-6xl">❌</div>
                        <h2 className="text-2xl font-bold text-red-600">로그인 실패</h2>
                        <p className="text-slate-600">{error}</p>
                        <p className="text-sm text-slate-500">3초 후 로그인 페이지로 이동합니다...</p>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-center">
                            <div className="flex gap-2">
                                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">🎉 Google 로그인 성공!</h2>
                        <p className="text-slate-600">잠시만 기다려주세요...</p>
                    </>
                )}
            </div>
        </div>
    )
}