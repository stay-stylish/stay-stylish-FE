"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Calendar, MapPin, Cloud } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"

interface TravelHistoryItem {
  travelId: number
  country: string
  city: string
  startDate: string
  endDate: string
  weatherSummary: {
    avgTemperature: number
    avgHumidity: number
    rainProbability: number
    condition: string
  }
  createdAt: string
}

interface PageResponse {
  content: TravelHistoryItem[]
  totalPages: number
  totalElements: number
  size: number
  number: number
}

export default function TravelHistoryPage() {
  const router = useRouter()
  const { getAccessToken } = useAuth()
  const [history, setHistory] = useState<TravelHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    fetchHistory()
  }, [page])

  const fetchHistory = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = getAccessToken()
      if (!token) {
        setError("로그인이 필요합니다")
        return
      }

      console.log('Fetching travel history...')

      const response = await fetch(`/api/travel/history?page=${page}&size=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || "여행 기록을 불러오는데 실패했습니다")
      }

      const data: PageResponse = await response.json()
      console.log('Received data:', data)
      // weatherSummary가 null이거나 필수 속성이 없는 항목 필터링
      const validHistoryItems = data.content.filter(item => 
        item.weatherSummary && 
        typeof item.weatherSummary.avgTemperature === 'number' &&
        typeof item.weatherSummary.rainProbability === 'number' &&
        item.weatherSummary.condition
      )
      console.log('Filtered items:', validHistoryItems)
      setHistory(validHistoryItems)
      setTotalPages(Math.max(1, Math.ceil(validHistoryItems.length / data.size)))
    } catch (err) {
      console.error('Fetch history error:', err)
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetail = (travelId: number) => {
    router.push(`/travel-history/${travelId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-slate-900 text-white py-8 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold">여행 옷차림 조회 기록</h1>
          </div>
          <p className="text-slate-300 ml-14">조회했던 여행 옷차림 추천 목록입니다</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-8">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    {/* Location Skeleton */}
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-5 h-5 rounded-full" />
                      <Skeleton className="h-6 w-48" />
                    </div>
                    
                    {/* Date Skeleton */}
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4 rounded-full" />
                      <Skeleton className="h-4 w-64" />
                    </div>

                    {/* Weather Info Skeleton */}
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>

                  {/* Button Skeleton */}
                  <Skeleton className="h-10 w-24" />
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">조회 기록이 없습니다</p>
            <Button
              onClick={() => router.push("/travel-recommendations")}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              여행 추천 받기
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <Card
                key={item.travelId}
                className={`p-6 ${item.weatherSummary ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''}`}
                onClick={() => item.weatherSummary && handleViewDetail(item.travelId)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <MapPin className="w-5 h-5 text-blue-500" />
                      <h3 className="text-xl font-bold text-slate-900">
                        {item.country}, {item.city}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 text-slate-600 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {formatDate(item.startDate)} ~ {formatDate(item.endDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      {item.weatherSummary && (
                        <>
                          <div className="flex items-center gap-2">
                            <Cloud className="w-4 h-4 text-blue-500" />
                            <span className="text-slate-700">
                              평균 {item.weatherSummary.avgTemperature?.toFixed(1) ?? 'N/A'}°C
                            </span>
                          </div>
                          <div className="text-slate-700">
                            강수 {item.weatherSummary.rainProbability ?? 'N/A'}%
                          </div>
                          <div className="text-slate-700">
                            {item.weatherSummary.condition ?? '날씨 정보 없음'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {formatDate(item.createdAt)}
                    </p>
                    {item.weatherSummary && (
                      <Button
                        variant="outline"
                        className="mt-2 text-blue-500 border-blue-500 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDetail(item.travelId)
                        }}
                      >
                        상세보기
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              이전
            </Button>
            <span className="px-4 py-2 text-slate-700">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
