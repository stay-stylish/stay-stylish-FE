"use client"
import { LoginForm } from "@/components/login-form"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-white">
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="뒤로 가기"
      >
        <ArrowLeft className="w-6 h-6 text-gray-600" />
      </button>
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoginForm />
      </div>
    </main>
  )
}
