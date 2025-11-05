"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface ErrorDetails {
    status?: number
    backendUrl?: string
    rawResponse?: string
}

interface DebugInfo {
    code?: string | null
    status?: number
    error?: string
    details?: ErrorDetails
}

interface ExchangeResponse {
    accessToken?: string
    refreshToken?: string
    isNewUser?: boolean
    error?: string
    details?: ErrorDetails
}

export default function OAuthCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { loginWithOAuth } = useAuth()
    const [error, setError] = useState<string>("")
    const [debugInfo, setDebugInfo] = useState<DebugInfo>({})

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code')

            console.log('[OAuth Callback] 페이지 로드됨')
            console.log('[OAuth Callback] URL 파라미터 code:', code)

            if (!code) {
                const msg = '인증 코드가 없습니다.'
                console.error('[OAuth Callback]', msg)
                setError(msg)
                setDebugInfo({ code: null })
                setTimeout(() => router.push('/login'), 2000)
                return
            }

            try {
                console.log('[OAuth Callback] 토큰 교환 시작...')
                setDebugInfo({ code })

                // 토큰 교환
                const exchangeResponse = await fetch('/api/auth/oauth/exchange', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code }),
                })

                console.log('[OAuth Callback] 교환 응답 상태:', exchangeResponse.status)

                const exchangeData: ExchangeResponse = await exchangeResponse.json()
                console.log('[OAuth Callback] 교환 응답 데이터:', exchangeData)

                if (!exchangeResponse.ok) {
                    const errorMsg = exchangeData.error || '토큰 교환에 실패했습니다.'
                    console.error('[OAuth Callback] 교환 실패:', errorMsg)
                    console.error('[OAuth Callback] 상세 정보:', exchangeData.details)

                    setDebugInfo({
                        code,
                        status: exchangeResponse.status,
                        error: errorMsg,
                        details: exchangeData.details
                    })

                    throw new Error(errorMsg)
                }

                console.log('[OAuth Callback] 토큰 교환 성공')
                console.log('[OAuth Callback] 받은 토큰:', {
                    accessToken: exchangeData.accessToken ? '있음' : '없음',
                    refreshToken: exchangeData.refreshToken ? '있음' : '없음',
                    isNewUser: exchangeData.isNewUser
                })

                if (!exchangeData.accessToken || !exchangeData.refreshToken) {
                    throw new Error('토큰이 없습니다')
                }

                // 사용자 정보 가져오기
                console.log('[OAuth Callback] 사용자 정보 조회 시작...')
                const userResponse = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${exchangeData.accessToken}`,
                    },
                })

                console.log('[OAuth Callback] 사용자 정보 응답 상태:', userResponse.status)

                if (!userResponse.ok) {
                    const userError = await userResponse.json().catch(() => ({}))
                    console.error('[OAuth Callback] 사용자 정보 조회 실패:', userError)
                    throw new Error('사용자 정보 조회 실패')
                }

                const userData = await userResponse.json()
                console.log('[OAuth Callback] 사용자 정보 조회 성공:', userData.email)

                // Zustand 스토어에 저장
                console.log('[OAuth Callback] Zustand 스토어에 저장 중...')
                loginWithOAuth(exchangeData.accessToken, exchangeData.refreshToken, userData)

                // URL 정리 (브라우저 히스토리에서 코드 제거)
                window.history.replaceState({}, document.title, window.location.pathname)

                // 신규 유저면 추가 정보 입력 페이지로, 아니면 홈으로
                if (exchangeData.isNewUser) {
                    console.log('[OAuth Callback] 신규 유저 → 추가 정보 입력 페이지로 이동')
                    router.push('/signup/additional')
                } else {
                    console.log('[OAuth Callback] 기존 유저 → 홈으로 이동')
                    router.push('/')
                }
            } catch (err) {
                console.error('[OAuth Callback] 예외 발생:', err)
                const errorMsg = err instanceof Error ? err.message : '로그인 처리 중 오류가 발생했습니다.'
                setError(errorMsg)
                setTimeout(() => router.push('/login'), 3000)
            }
        }

        handleCallback()
    }, [searchParams, router, loginWithOAuth])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="max-w-md w-full space-y-4">
                {error ? (
                    <div className="text-center space-y-4 bg-white rounded-lg shadow-lg p-6">
                        <div className="text-6xl">❌</div>
                        <h2 className="text-2xl font-bold text-red-600">로그인 실패</h2>
                        <p className="text-slate-600 text-sm">{error}</p>

                        {/* 디버그 정보 표시 */}
                        {debugInfo.details && (
                            <div className="bg-red-50 border border-red-200 rounded p-3 text-left text-xs">
                                <p className="font-semibold text-red-700 mb-2">🔍 디버그 정보:</p>
                                {debugInfo.status && (
                                    <p className="text-red-600 break-all">
                                        상태: {debugInfo.status}
                                    </p>
                                )}
                                {debugInfo.details.backendUrl && (
                                    <p className="text-red-600 break-all">
                                        URL: {debugInfo.details.backendUrl}
                                    </p>
                                )}
                                {debugInfo.details.rawResponse && (
                                    <p className="text-red-600 break-all mt-2">
                                        응답: {debugInfo.details.rawResponse.substring(0, 200)}
                                    </p>
                                )}
                            </div>
                        )}

                        <p className="text-sm text-slate-500">3초 후 로그인 페이지로 이동합니다...</p>
                    </div>
                ) : (
                    <div className="text-center space-y-4 bg-white rounded-lg shadow-lg p-6">
                        <div className="flex items-center justify-center">
                            <div className="flex gap-2">
                                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">로그인 처리 중...</h2>
                        <p className="text-slate-600 text-sm">잠시만 기다려주세요</p>
                    </div>
                )}

                {/* 브라우저 콘솔 확인 안내 */}
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center text-xs text-blue-700">
                    🛠️ 문제 해결: 브라우저 개발자 도구 (F12) → Console 탭에서 더 자세한 로그를 확인하세요
                </div>
            </div>
        </div>
    )
}