"use client"

import { Heart, Plus, ArrowLeft, Plane, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"

// ==== 타입 정의 (백엔드 스펙 기반) ====

interface Post {
  id: number
  title: string
  content: string
  authorNickname: string
  likeCount: number
  shareCount: number
  createdAt: string
  updatedAt: string
}

interface PagePostResponse {
  totalElements: number
  totalPages: number
  size: number
  number: number
  content: Post[]
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

interface LikeResponse {
  postId: number
  liked: boolean
  likeCount: number
}

// content에서 이미지 URL 추출 (마크다운 이미지 또는 HTML img 태그)
const extractImageFromContent = (content: string): string | null => {
  // 마크다운 이미지 패턴: ![alt](url)
  const markdownImageRegex = /!\[.*?\]\((.*?)\)/
  const markdownMatch = content.match(markdownImageRegex)
  if (markdownMatch) return markdownMatch[1]

  // HTML img 태그 패턴: <img src="url" />
  const htmlImageRegex = /<img[^>]+src="([^">]+)"/
  const htmlMatch = content.match(htmlImageRegex)
  if (htmlMatch) return htmlMatch[1]

  // http로 시작하는 URL 찾기
  const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/i
  const urlMatch = content.match(urlRegex)
  if (urlMatch) return urlMatch[1]

  return null
}

export default function CommunityPage() {
  const router = useRouter()
  const { getAccessToken } = useAuth()

  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [likedPosts, setLikedPosts] = useState<{ [key: number]: boolean }>({})
  const [sortBy, setSortBy] = useState<"latest" | "like">("latest")

  // 게시글 목록 조회 (프론트 → /api/community/posts → 백엔드 /api/v1/posts)
  const fetchPosts = useCallback(async () => {
  setIsLoading(true)
  setError(null)

  try {
    const token = getAccessToken()

    // 토큰 없으면 로그인 페이지로
    if (!token) {
      router.replace("/login")
      return
    }

    const query = new URLSearchParams({
      sortBy,
      page: String(page),
      size: String(12),
    })

    // ✅ 옵션 B: Next API Route 프록시 사용
    const response = await fetch(`/api/community/posts?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let errorMessage = "게시물을 불러오는데 실패했습니다"

      try {
        const errorData: any = await response.json().catch(() => ({}))
        if (errorData?.message) {
          errorMessage = errorData.message
        }
      } catch {
        // json 파싱 실패는 그냥 기본 메시지 사용
      }

      if (response.status === 401) {
        router.replace("/login")
        return
      }

      throw new Error(errorMessage)
    }

    // 🔥 여기서 응답 모양을 유연하게 처리
    const raw = await response.json()
    console.log("Client posts raw response:", raw)

    let pageData: PagePostResponse | undefined

    // 케이스 1: { success, message, data: { content: [...] } } (백엔드 원본 그대로)
    if (raw && typeof raw === "object" && "data" in raw && raw.data?.content) {
      pageData = raw.data as PagePostResponse
    }
    // 케이스 2: { content: [...] } 만 오는 경우 (프록시에서 data를 까고 줌)
    else if (raw && raw.content) {
      pageData = raw as PagePostResponse
    }

    setPosts(pageData?.content || [])
    setTotalPages(pageData?.totalPages || 0)
  } catch (err) {
    console.error("Fetch posts error:", err)
    setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다")
  } finally {
    setIsLoading(false)
  }
}, [getAccessToken, page, sortBy, router])


  // 페이지/정렬 변경 시 목록 다시 조회
  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleSortChange = (newSort: "latest" | "like") => {
    setSortBy(newSort)
    setPage(0)
  }

  // 좋아요 토글 (프론트 → /api/community/posts/[postId]/like → 백엔드 /api/v1/posts/{postId}/like)
  const handleLike = async (postId: number) => {
    try {
      const token = getAccessToken()

      if (!token) {
        router.replace("/login")
        return
      }

      const isCurrentlyLiked = !!likedPosts[postId]

      // 낙관적 업데이트
      setLikedPosts(prev => ({
        ...prev,
        [postId]: !prev[postId],
      }))

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                likeCount: post.likeCount + (isCurrentlyLiked ? -1 : 1),
              }
            : post
        )
      )

      // ✅ 옵션 B: Next API Route 프록시 사용
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        // 실패 시 롤백
        setLikedPosts(prev => ({
          ...prev,
          [postId]: isCurrentlyLiked,
        }))

        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? {
                  ...post,
                  likeCount: post.likeCount + (isCurrentlyLiked ? 1 : -1),
                }
              : post
          )
        )

        throw new Error("좋아요 처리에 실패했습니다.")
      }

      // 스펙: ApiResponseLikeResponse
      const result: ApiResponse<LikeResponse> = await response.json()
      const likeData = result.data

      setLikedPosts(prev => ({
        ...prev,
        [postId]: likeData.liked,
      }))

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                likeCount: likeData.likeCount,
              }
            : post
        )
      )
    } catch (err) {
      console.error("Like error:", err)
      // 필요하면 여기서 토스트 띄우기 등 추가
    }
  }

  // ===== 로딩 상태 UI =====
  if (isLoading) {
    return (
      <main className="min-h-screen bg-white pt-14">
        <header className="border-b border-slate-200 sticky top-0 bg-white z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
              <button
                onClick={() => router.push("/")}
                className="text-3xl font-[600] font-pretendard tracking-[-0.01em] text-slate-900 hover:text-blue-500 transition-colors"
              >
                Stay-Stylish
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/travel-recommendations")}
                className="px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-700 flex items-center gap-2"
                title="여행 스타일링"
              >
                <Plane className="w-5 h-5" />
                <span>여행</span>
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-700 flex items-center gap-2"
                title="마이페이지"
              >
                <User className="w-5 h-5" />
                <span>마이페이지</span>
              </button>
            </div>
          </div>
        </header>

        {/* Skeleton UI */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="group">
                {/* Image Skeleton */}
                <Skeleton className="w-full aspect-square rounded-lg mb-3" />

                {/* Title Skeleton */}
                <Skeleton className="h-5 w-3/4 mb-2" />

                {/* Meta Info Skeleton */}
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => router.push("/community/create")}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all"
          title="새 게시물 작성"
        >
          <Plus className="w-8 h-8" />
        </button>
      </main>
    )
  }

  // ===== 에러 상태 UI =====
  if (error) {
    return (
      <main className="min-h-screen bg-white pt-14">
        <header className="border-b border-slate-200 sticky top-0 bg-white z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
              <button
                onClick={() => router.push("/")}
                className="text-3xl font-[600] font-pretendard tracking-[-0.01em] text-slate-900 hover:text-blue-500 transition-colors"
              >
                Stay-Stylish
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/travel-recommendations")}
                className="px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-700 flex items-center gap-2"
                title="여행 스타일링"
              >
                <Plane className="w-5 h-5" />
                <span>여행</span>
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-700 flex items-center gap-2"
                title="마이페이지"
              >
                <User className="w-5 h-5" />
                <span>마이페이지</span>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              fetchPosts()
            }}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>

        <button
          onClick={() => router.push("/community/create")}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all"
          title="새 게시물 작성"
        >
          <Plus className="w-8 h-8" />
        </button>
      </main>
    )
  }

  // ===== 정상 UI =====
  return (
    <main className="min-h-screen bg-white pt-14">
      {/* Header */}
      <header className="border-b border-slate-200 sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="뒤로 가기"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
            <button
              onClick={() => router.push("/")}
              className="text-3xl font-[600] font-pretendard tracking-[-0.01em] text-slate-900 hover:text-blue-500 transition-colors"
            >
              Stay-Stylish
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/travel-recommendations")}
              className="px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-700 flex items-center gap-2"
              title="여행 스타일링"
            >
              <Plane className="w-5 h-5" />
              <span>여행</span>
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-700 flex items-center gap-2"
              title="마이페이지"
            >
              <User className="w-5 h-5" />
              <span>마이페이지</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sort Controls */}
      <div className="border-b border-slate-200 bg-slate-50 sticky top-[68px] z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <span className="text-sm text-slate-600 font-medium">정렬:</span>
          <button
            onClick={() => handleSortChange("latest")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              sortBy === "latest"
                ? "bg-blue-500 text-white"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
            }`}
          >
            최신순
          </button>
          <button
            onClick={() => handleSortChange("like")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              sortBy === "like"
                ? "bg-blue-500 text-white"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
            }`}
          >
            좋아요순
          </button>
        </div>
      </div>

      {/* Style Feed Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">게시물이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => {
              const imageUrl = extractImageFromContent(post.content)
              const authorInitial = (post.authorNickname?.[0] || "?").toUpperCase()

              return (
                <div
                  key={post.id}
                  className="group cursor-pointer"
                  onClick={() => router.push(`/community/${post.id}`)}
                >
                  {/* Image Container */}
                  <div className="relative bg-slate-100 rounded-lg overflow-hidden mb-3 aspect-square">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => {
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                        <span className="text-slate-400 text-sm">이미지 없음</span>
                      </div>
                    )}
                  </div>

                  {/* Post Info */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {post.title}
                    </h3>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {authorInitial}
                        </div>
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {post.authorNickname}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            handleLike(post.id)
                          }}
                          className="focus:outline-none cursor-pointer hover:scale-110 transition-transform"
                        >
                          <Heart
                            className={`w-4 h-4 text-red-500 transition-colors ${
                              likedPosts[post.id] ? "fill-red-500" : "fill-none"
                            }`}
                          />
                        </button>
                        <span
                          onClick={e => {
                            e.stopPropagation()
                            handleLike(post.id)
                          }}
                          className="text-sm font-medium text-slate-700 cursor-pointer hover:text-red-500 transition-colors min-w-[20px] text-right"
                        >
                          {post.likeCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              disabled={page === 0}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="px-4 py-2 text-slate-700">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => router.push("/community/create")}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all"
        title="새 게시물 작성"
      >
        <Plus className="w-8 h-8" />
      </button>
    </main>
  )
}
