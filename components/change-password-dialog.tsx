"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ChangePasswordDialog() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다")
      return
    }

    if (passwords.newPassword.length < 8) {
      setError("새 비밀번호는 최소 8자 이상이어야 합니다")
      return
    }

    setIsLoading(true)

    // TODO: 백엔드에 비밀번호 변경 API 구현 후 활성화
    setError("현재 비밀번호 변경 기능은 지원하지 않습니다. 프로필 수정 페이지에서 다른 정보를 변경하실 수 있습니다.")
    setIsLoading(false)

    /*
    // 백엔드 API가 준비되면 아래 코드 활성화:
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      })

      if (!response.ok) {
        throw new Error('비밀번호 변경에 실패했습니다')
      }

      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" })
      alert("비밀번호가 성공적으로 변경되었습니다")
    } catch (err) {
      console.error("Failed to change password:", err)
      setError(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다")
    } finally {
      setIsLoading(false)
    }
    */
  }

  return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">비밀번호 변경</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>비밀번호 변경</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">현재 비밀번호</Label>
              <PasswordInput
                  id="currentPassword"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                      setPasswords((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                  }
                  required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <PasswordInput
                  id="newPassword"
                  value={passwords.newPassword}
                  onChange={(e) =>
                      setPasswords((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                  }
                  required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
              <PasswordInput
                  id="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                      setPasswords((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                  }
                  required
              />
            </div>
            {error && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-md">
                  {error}
                </div>
            )}
            <div className="flex justify-end gap-4 pt-4">
              <DialogTrigger asChild>
                <Button type="button" variant="outline">
                  취소
                </Button>
              </DialogTrigger>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "변경 중..." : "변경하기"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
  )
}