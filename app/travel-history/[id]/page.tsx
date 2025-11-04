// stay-stylish/stay-stylish-fe/stay-stylish-FE-c14b4b1a4b8e4c05090a39f123785ddbf08fe1b0/app/travel-history/[id]/page.tsx

"use client"

import React, { useEffect, useState } from "react" // React import 추가
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Calendar, Cloud } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"

interface TravelDetailResponse {
  travelId: number
  userId: number
  country: string
  city: string
  startDate: string
  endDate: string
  weatherSummary: {
    avgTemperature: number
    avgHumidity: number
    rainProbability: number
    condition: string
    umbrellaSummary?: string // [수정] umbrellaSummary 필드 추가
  }
  culturalConstraints: {
    notes: string
    rules: string[]
  }
  aiOutfit: {
    summary: string
    outfits: Array<{
      setNo: number
      reason: string
      items: Array<{
        slot: string
        item: string
        styleTag: string
      }>
    }>
  }
  safetyNotes: string[]
  createdAt: string
}

export default function TravelDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { getAccessToken } = useAuth()
  const [detail, setDetail] = useState<TravelDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchDetail();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchDetail = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = getAccessToken()
      if (!token) {
        setError("로그인이 필요합니다")
        router.push("/login");
        return
      }

      const travelId = params.id as string
      console.log('Fetching travel detail for ID:', travelId)

      const response = await fetch(`/api/travel/history/${travelId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "데이터를 불러오지 못했습니다." }))
        console.error('Error response:', errorData)
        throw new Error(errorData.error || "여행 상세 정보를 불러오는데 실패했습니다")
      }

      const data: TravelDetailResponse = await response.json()
      console.log('Received detail data:', data)
      
      if ((data as any).status && (data as any).status !== 'COMPLETED') {
         if ((data as any).status === 'FAILED') {
            throw new Error((data as any).errorMessage || '추천 생성에 실패했습니다.');
         } else {
            setError('추천 데이터가 아직 준비 중입니다. 잠시 후 다시 시도해주세요.');
            setTimeout(() => router.back(), 5000);
            return;
         }
      }
      
      setDetail(data)
    } catch (err) {
      console.error('Fetch detail error:', err)
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="bg-slate-900 text-white py-8 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-3xl font-bold">여행 계획 상세</h1>
            </div>
          </div>
        </div>
        {/* Skeleton UI */}
        <div className="max-w-7xl mx-auto py-8 px-8 space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </main>
    )
  }

  if (error || !detail) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="bg-slate-900 text-white py-8 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-3xl font-bold">여행 계획 상세</h1>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto py-12 px-8 text-center">
          <p className="text-red-600">{error || "데이터를 찾을 수 없습니다"}</p>
          <Button
            onClick={() => router.back()}
            className="mt-4 bg-blue-500 hover:bg-blue-600"
          >
            돌아가기
          </Button>
        </div>
      </main>
    )
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
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-6 h-6" />
                <h1 className="text-3xl font-bold">
                  {detail.country}, {detail.city}
                </h1>
              </div>
              <div className="flex items-center gap-2 text-slate-300 ml-9">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDate(detail.startDate)} ~ {formatDate(detail.endDate)}
                </span>
              </div>
            </div>
          </div>
          <p className="text-slate-400 text-sm ml-14">
            조회일: {formatDate(detail.createdAt)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-8 space-y-6">
        {/* Weather Summary */}
        {detail.weatherSummary && (
          <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Cloud className="w-6 h-6 text-blue-500" />
              날씨 요약
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">평균 기온</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Number(detail.weatherSummary.avgTemperature).toFixed(1)}°C
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">강수 확률</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Number(detail.weatherSummary.rainProbability).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">평균 습도</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Number(detail.weatherSummary.avgHumidity).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">날씨 상태</p>
                <p className="text-xl font-bold text-blue-600">
                  {detail.weatherSummary.condition}
                </p>
              </div>
            </div>
            
            {/* --- [수정] 우산 요약 렌더링 --- */}
            {detail.weatherSummary.umbrellaSummary && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">☔️ 우산 가이드</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {/* ' / ' 기준으로 줄바꿈 처리 */}
                  {detail.weatherSummary.umbrellaSummary.split(' / ').map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </p>
              </div>
            )}
            {/* --- [수정 완료] --- */}

          </div>
        )}

        {/* AI Outfit Recommendation */}
        {detail.aiOutfit && (
          <div className="p-6 bg-green-50 border-2 border-green-200 rounded-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">AI 옷차림 추천</h3>
            
            <p className="text-base text-slate-700 leading-relaxed mb-6">
              {detail.aiOutfit.summary}
            </p>

            <div className="space-y-4">
              {detail.aiOutfit.outfits.map((outfit) => (
                <div
                  key={outfit.setNo}
                  className="p-4 bg-white rounded-lg border border-green-200"
                >
                  <p className="font-bold text-slate-900 mb-2">코디 {outfit.setNo}</p>
                  <p className="text-sm text-slate-600 mb-3">{outfit.reason}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {outfit.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="text-sm p-2 bg-green-50 rounded border border-green-100"
                      >
                        <span className="font-semibold text-green-700">
                          {item.slot}:
                        </span>{" "}
                        <span className="text-slate-700">{item.item}</span>
                        {item.styleTag && (
                          <span className="ml-2 text-xs text-green-600">
                            #{item.styleTag}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cultural Constraints */}
        {detail.culturalConstraints && (
          <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              문화적 복장 제약사항
            </h3>
            <p className="text-base text-slate-700 mb-4">
              {detail.culturalConstraints.notes}
            </p>
            {detail.culturalConstraints.rules && detail.culturalConstraints.rules.length > 0 && (
              <ul className="space-y-2">
                {detail.culturalConstraints.rules.map((rule, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <span className="text-yellow-600 font-bold">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Safety Notes */}
        {detail.safetyNotes && detail.safetyNotes.length > 0 && (
          <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">안전 유의사항</h3>
            <ul className="space-y-2">
              {detail.safetyNotes.map((note, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <span className="text-red-600 font-bold">⚠</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}