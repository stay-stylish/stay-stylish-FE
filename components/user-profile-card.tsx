"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Edit2, LogOut, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface UserProfileCardProps {
  email: string
  nickname: string
  preferredStyle: string
  gender: string
  onEdit?: () => void
}

export function UserProfileCard({ email, nickname, preferredStyle, gender, onEdit }: UserProfileCardProps) {
  const { logout, withdrawAccount } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleWithdraw = async () => {
    try {
      await withdrawAccount()
      toast({
        title: "회원탈퇴가 완료되었습니다.",
        description: "그동안 서비스를 이용해주셔서 감사합니다.",
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "회원탈퇴 실패",
        description: error instanceof Error ? error.message : "회원탈퇴에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto p-8 bg-white shadow-md border border-slate-200">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">프로필</h1>
        <div className="flex items-center gap-3">
          <Button
            onClick={onEdit}
            variant="outline"
            className="flex items-center gap-2 border-slate-300 hover:bg-slate-50 bg-transparent"
          >
            <Edit2 className="w-4 h-4" />
            수정하기
          </Button>
          <Button
            onClick={() => {
              logout()
              router.push("/login")
            }}
            variant="ghost"
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </div>
      </div>

      {/* Profile Information */}
      <div className="space-y-6">
        {/* Email */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <label className="text-lg font-semibold text-slate-700">이메일</label>
          <p className="text-lg text-slate-900">{email}</p>
        </div>

        {/* Nickname */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <label className="text-lg font-semibold text-slate-700">닉네임</label>
          <p className="text-lg text-slate-900">{nickname}</p>
        </div>

        {/* Preferred Style */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <label className="text-lg font-semibold text-slate-700">선호 스타일</label>
          <p className="text-lg text-slate-900">{preferredStyle}</p>
        </div>

        {/* Gender */}
        <div className="flex items-center justify-between pb-4">
          <label className="text-lg font-semibold text-slate-700">성별</label>
          <p className="text-lg text-slate-900">{gender}</p>
        </div>
      </div>

      {/* Account Management - Bottom Right */}
      <div className="flex justify-end mt-6">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="text-sm text-slate-500 hover:text-red-600"
            >
              회원탈퇴
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말로 탈퇴하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                회원탈퇴 시 모든 데이터가 영구적으로 삭제됩니다.
                이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleWithdraw}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                회원탈퇴
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  )
}
