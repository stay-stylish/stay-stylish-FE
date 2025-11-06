"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function OAuthSuccessHomePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { loginWithOAuth } = useAuth()

    const isProcessing = useRef(false)

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        // 이미 처리 중이면 리턴
        if (isProcessing.current) {
            console.log('[OAuth Success Home] 이미 처리 중 - 중복 실행 방지')
            return
        }

        const handleOAuthLogin = async () => {
            // 처리 시작 표시
            isProcessing.current = true

            try {
                const code = searchParams.get('code')

                console.log('[OAuth Success Home] ===== 시작 =====')
                console.log('[OAuth Success Home] 코드:', code)

                if (!code) {
                    throw new Error('인증 코드가 없습니다')
                }

                // 1단계: 코드로 토큰 교환
                console.log('[OAuth Success Home] 토큰 교환 시작...')
                const exchangeResponse = await fetch('/api/auth/oauth/exchange', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code }),
                })

                console.log('[OAuth Success Home] 응답 상태:', exchangeResponse.status)

                if (!exchangeResponse.ok) {
                    const errorData = await exchangeResponse.json().catch(() => ({}))
                    console.error('[OAuth Success Home] 교환 실패:', errorData)
                    throw new Error(
                        errorData.error || '토큰 교환에 실패했습니다'
                    )
                }

                const exchangeData = await exchangeResponse.json()
                console.log('[OAuth Success Home] 교환 성공!')

                const { accessToken, refreshToken } = exchangeData

                if (!accessToken || !refreshToken) {
                    throw new Error('토큰이 없습니다')
                }

                // 2단계: 사용자 정보 조회
                console.log('[OAuth Success Home] 사용자 정보 조회 중...')
                const userResponse = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                })

                console.log('[OAuth Success Home] 사용자 정보 상태:', userResponse.status)

                if (!userResponse.ok) {
                    const userError = await userResponse.json().catch(() => ({}))
                    throw new Error(userError.error || '사용자 정보 조회 실패')
                }

                const userData = await userResponse.json()
                console.log('[OAuth Success Home] 사용자 정보 성공:', userData.email)

                // 3단계: 스토어에 저장
                console.log('[OAuth Success Home] 스토어 저장 중...')
                loginWithOAuth(accessToken, refreshToken, userData)

                console.log('[OAuth Success Home] 완료! 홈으로 이동')
                console.log('[OAuth Success Home] ===== 성공 =====')

                setStatus('success')
                setMessage('로그인되었습니다!')

                // 2초 후 홈으로 이동
                setTimeout(() => {
                    router.push('/')
                }, 2000)

            } catch (err) {
                console.error('[OAuth Success Home] 예외:', err)

                setStatus('error')
                setMessage(
                    err instanceof Error
                        ? err.message
                        : '로그인 처리 중 오류가 발생했습니다'
                )

                // 3초 후 로그인 페이지로
                setTimeout(() => {
                    router.push('/login')
                }, 3000)
            }
        }

        handleOAuthLogin()
    }, [])

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardContent className="pt-12 text-center space-y-4">
                    {status === 'loading' && (
                        <>
                            <div className="flex justify-center mb-4">
                                <Loader className="w-12 h-12 text-blue-500 animate-spin" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">
                                로그인 처리 중...
                            </h2>
                            <p className="text-slate-600">
                                잠시만 기다려주세요.
                            </p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="flex justify-center mb-4">
                                <CheckCircle className="w-16 h-16 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                로그인 완료!
                            </h2>
                            <p className="text-slate-600">
                                {message}
                            </p>
                            <p className="text-sm text-slate-500">
                                홈 페이지로 이동합니다...
                            </p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="flex justify-center mb-4">
                                <AlertCircle className="w-16 h-16 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                로그인 실패
                            </h2>
                            <p className="text-red-600 text-sm">
                                {message}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                                💡 팁: 브라우저 F12 → Console 탭에서 로그 확인
                            </p>
                            <p className="text-xs text-slate-500">
                                3초 후 로그인 페이지로 이동합니다...
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>
        </main>
    )
}