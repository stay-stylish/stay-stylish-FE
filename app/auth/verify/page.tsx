"use client"

// 1. useEffect, useState와 함께 useRef를 import 합니다.
import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader } from "lucide-react"

export default function VerifyPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    // 2. 인증 요청이 이미 실행되었는지 추적하는 ref를 생성합니다.
    const verifyFetched = useRef(false)

    useEffect(() => {
        const verifyEmail = async () => {
            // 3. 이미 요청을 보냈다면(2번째 실행) 즉시 중단합니다.
            if (verifyFetched.current) {
                return
            }
            // 4. 요청을 보냈다고 플래그를 true로 설정합니다.
            verifyFetched.current = true

            const token = searchParams.get('token')

            if (!token) {
                setStatus('error')
                setMessage('인증 토큰이 없습니다. 이메일 링크를 다시 확인해주세요.')
                setTimeout(() => router.push('/login'), 3000)
                return
            }

            try {
                // 프론트엔드 프록시 API 호출
                const response = await fetch(`/api/auth/verify?token=${token}`)

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    // 백엔드 에러 메시지(data.message)를 사용하도록 수정합니다.
                    throw new Error(errorData.message || '인증에 실패했습니다')
                }

                setStatus('success')
                setMessage('이메일 인증이 완료되었습니다!')

                // 3초 후 로그인 페이지로 이동
                setTimeout(() => {
                    router.push('/login')
                }, 3000)
            } catch (err) {
                console.error('Verify error:', err)
                setStatus('error')
                setMessage(
                    err instanceof Error
                        ? err.message
                        // 5. 백엔드에서 오는 "유효하지 않은 토큰" 메시지가 여기에 표시됩니다.
                        : '이메일 인증에 실패했습니다. 다시 시도해주세요.'
                )
                // 인증 실패 시 로그인 페이지가 아닌 회원가입 페이지로 보냅니다.
                setTimeout(() => router.push('/signup'), 3000)
            }
        }

        verifyEmail()
    }, [searchParams, router])

    // 6. 이 아래 JSX 렌더링(return) 부분은 전혀 수정되지 않았습니다.
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardContent className="pt-12 text-center space-y-4">
                    {/* ... (UI 부분은 동일하게 유지됩니다) ... */}
                    {status === 'loading' && (
                        <>
                            <div className="flex justify-center mb-4">
                                <Loader className="w-12 h-12 text-blue-500 animate-spin" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">
                                이메일 인증 진행 중...
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
                                이메일 인증 완료!
                            </h2>
                            <p className="text-slate-600">
                                {message}
                            </p>
                            <p className="text-sm text-slate-500">
                                3초 후 로그인 페이지로 이동합니다...
                            </p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="flex justify-center mb-4">
                                <AlertCircle className="w-16 h-16 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                인증 실패
                            </h2>
                            <p className="text-red-600">
                                {message}
                            </p>
                            <p className="text-sm text-slate-500">
                                3초 후 페이지를 이동합니다...
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>
        </main>
    )
}