"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"

export default function OAuthAdditionalInfoPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { loginWithOAuth } = useAuth()

    const [nickname, setNickname] = useState("")
    const [gender, setGender] = useState("")
    const [stylePreference, setStylePreference] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    // URL에서 코드 추출
    const code = searchParams.get('code')

    useEffect(() => {
        if (!code) {
            setError("인증 코드가 없습니다. 다시 로그인해주세요.")
            setTimeout(() => router.push('/login'), 2000)
        }
    }, [code, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!nickname.trim() || !gender) {
            setError("닉네임과 성별은 필수입니다.")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            // 1단계: 코드로 토큰 교환
            console.log('[OAuth Additional] 토큰 교환 시작...')
            const exchangeResponse = await fetch('/api/auth/oauth/exchange', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
            })

            if (!exchangeResponse.ok) {
                const exchangeError = await exchangeResponse.json()
                throw new Error(exchangeError.error || "토큰 교환에 실패했습니다")
            }

            const exchangeData = await exchangeResponse.json()
            const accessToken = exchangeData.accessToken
            const refreshToken = exchangeData.refreshToken

            console.log('[OAuth Additional] 토큰 교환 성공')

            // 2단계: 프로필 업데이트
            console.log('[OAuth Additional] 프로필 업데이트 시작...')
            const updateResponse = await fetch('/api/auth/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    nickname,
                    preferredStyle: stylePreference,
                    gender
                })
            })

            if (!updateResponse.ok) {
                throw new Error("프로필 업데이트에 실패했습니다.")
            }

            const userData = await updateResponse.json()
            console.log('[OAuth Additional] 프로필 업데이트 성공')

            // 3단계: Zustand 스토어에 저장
            console.log('[OAuth Additional] 스토어 저장 중...')
            loginWithOAuth(accessToken, refreshToken, {
                id: userData.id || userData.userId,
                email: userData.email,
                nickname: userData.nickname,
                preferredStyle: userData.preferredStyle || '',
                gender: userData.gender || ''
            })

            console.log('[OAuth Additional] 완료 - 홈으로 이동')

            // 4단계: 홈으로 이동
            router.push('/')

        } catch (err) {
            console.error('[OAuth Additional] 오류:', err)
            setError(err instanceof Error ? err.message : "오류가 발생했습니다.")
        } finally {
            setIsLoading(false)
        }
    }

    if (!code) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <p className="text-center text-red-500">{error || "인증 정보를 확인하는 중..."}</p>
                    </CardContent>
                </Card>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">추가 정보 입력</CardTitle>
                    <CardDescription>서비스 이용을 위해 추가 정보를 입력해주세요</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nickname">닉네임 *</Label>
                            <Input
                                id="nickname"
                                placeholder="닉네임을 입력하세요"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gender">성별 *</Label>
                            <Select value={gender} onValueChange={setGender} disabled={isLoading}>
                                <SelectTrigger id="gender">
                                    <SelectValue placeholder="성별을 선택하세요" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="남성">남성</SelectItem>
                                    <SelectItem value="여성">여성</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="style-preference">선호 스타일</Label>
                            <Input
                                id="style-preference"
                                placeholder="예: 모던, 클래식, 미니멀"
                                value={stylePreference}
                                onChange={(e) => setStylePreference(e.target.value)}
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">선택사항입니다</p>
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "저장 중..." : "완료"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    )
}