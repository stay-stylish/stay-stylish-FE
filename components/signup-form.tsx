"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SignupForm() {
  const router = useRouter()
  const [nickname, setNickname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [gender, setGender] = useState("")
  const [stylePreference, setStylePreference] = useState("")
  const [region, setRegion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다")
      return
    }

    if (password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다")
      return
    }

    if (!gender) {
      setError("성별을 선택해주세요")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          nickname,
          gender,
          stylePreference: stylePreference || "캐주얼",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "회원가입에 실패했습니다")
      }

      setSuccessMessage(
        data.message || 
        "회원가입이 완료되었습니다!\n\n입력하신 이메일 주소로 인증 메일을 발송했습니다.\n이메일 인증을 완료하시면 로그인이 가능합니다."
      )
      
      // 5초 후 로그인 페이지로 이동 (메시지를 읽을 시간 제공)
      setTimeout(() => {
        router.push("/login")
      }, 5000)
    } catch (err) {
      console.error("Signup error:", err)
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true)
    try {
      // Spring Security OAuth2 로그인 엔드포인트로 리다이렉트
      // (회원가입과 로그인이 같은 엔드포인트 사용)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
          process.env.NEXT_PUBLIC_API_URL ||
          'http://localhost:8080'

      window.location.href = `${backendUrl}/oauth2/authorization/google`
    } catch (error) {
      console.error("Google signup error:", error)
      setError("Google 회원가입에 실패했습니다")
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">계정 생성</CardTitle>
        <CardDescription>오늘 가입하고 시작하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant="outline"
          className="w-full mb-4 bg-transparent"
          onClick={handleGoogleSignup}
          disabled={isLoading}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 회원가입
        </Button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">또는 이메일로 계속</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
              type="text"
              placeholder="닉네임을 입력하세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">최소 8자 이상이어야 합니다</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">비밀번호 확인</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">성별</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="성별을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">남성</SelectItem>
                <SelectItem value="FEMALE">여성</SelectItem>
                <SelectItem value="OTHER">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="style-preference">선호 스타일</Label>
            <Input
              id="style-preference"
              type="text"
              placeholder="예: 모던, 클래식, 미니멀"
              value={stylePreference}
              onChange={(e) => setStylePreference(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">선택사항입니다</p>
          </div>

          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}
          {successMessage && (
            <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg">
              <p className="font-medium mb-2">✉️ 이메일 인증이 필요합니다</p>
              <p className="whitespace-pre-line leading-relaxed">
                회원가입 신청이 완료되었습니다.
                <br /><br />
                <strong>입력하신 이메일({email})로 인증 링크를 발송했습니다.</strong>
                <br />
                이메일 인증을 완료하셔야 로그인이 가능합니다.
                <br /><br />
                ※ 이메일이 도착하지 않은 경우 스팸함을 확인해주세요.
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "계정 생성 중..." : "회원가입"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">이미 계정이 있으신가요? </span>
          <Link href="/login" className="text-primary hover:underline font-medium">
            로그인 페이지로 이동
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
