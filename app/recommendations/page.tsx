"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import StylingRecommendationsCard from "@/components/styling-recommendations-card"
import { useWeather } from "@/hooks/use-weather"
import { useState } from "react"

interface FeedbackState {
  [key: string]: {
    status: 'LIKE' | 'DISLIKE' | null;
    loading: boolean;
  };
}

export default function RecommendationsPage() {
  const router = useRouter()
  const { weatherData, stylingData, setStylingData } = useWeather()
  const { getAccessToken } = useAuth()
  const [feedbackStates, setFeedbackStates] = useState<FeedbackState>({})

  const handleFeedback = async (categoryName: string, status: 'LIKE' | 'DISLIKE') => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('로그인이 필요합니다');
      }

      if (!weatherData) {
        throw new Error('날씨 데이터가 없습니다');
      }

      const response = await fetch(`/api/styling/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryName,
          status,
          latitude: weatherData.latitude,
          longitude: weatherData.longitude
        })
      });

      if (!response.ok) {
        throw new Error('피드백 전송에 실패했습니다');
      }

    } catch (error) {
      console.error('피드백 전송 실패:', error);
      alert(error instanceof Error ? error.message : '피드백 전송에 실패했습니다');
      throw error; // 에러를 다시 던져서 호출자가 처리할 수 있도록 함
    }
  };

  // 추천 데이터를 가져오는 중일 때는 스켈레톤 UI를 보여줌
  if (!stylingData || !weatherData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        {/* Header Skeleton */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="mb-6 w-24">
            <Skeleton className="h-10" />
          </div>
          <div className="space-y-2 mb-8">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <div className="border-2 border-slate-200 shadow-sm rounded-lg p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>

          <div className="border-2 border-slate-200 shadow-sm rounded-lg p-6 space-y-4">
            <Skeleton className="h-8 w-32" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <Skeleton className="h-6 w-32" />
                  <div className="flex gap-3">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <Skeleton className="h-11 w-11 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  // 링크 형식으로 변환
  // 백엔드 응답: 각 카테고리마다 W컨셉, 무신사 순서로 2개씩 링크
  const recommendedCategories = stylingData.recommendedCategories.flatMap((category, index) => {
    const baseIndex = index * 2
    return [
      { category, link: stylingData.recommendedLinks[baseIndex] || "#" },      // W컨셉
      { category, link: stylingData.recommendedLinks[baseIndex + 1] || "#" }   // 무신사
    ]
  })

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header with Back Button */}
      <div className="max-w-4xl mx-auto mb-8">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          돌아가기
        </Button>

        <div className="space-y-2 mb-8">
          <h1 className="text-4xl font-bold text-slate-900">스타일링 추천</h1>
          <p className="text-lg text-slate-600">
            {weatherData.location}의 날씨({weatherData.temperature}°C)를 고려한 맞춤 스타일링입니다.
          </p>
        </div>
      </div>

      {/* Recommendations Content */}
      <div className="max-w-4xl mx-auto space-y-4">
        <StylingRecommendationsCard
          recommendationText={stylingData.recommendationText}
          recommendedCategories={recommendedCategories}
          feedbackStates={feedbackStates}
          setFeedbackStates={setFeedbackStates}
          onFeedback={async (categoryName, status) => {
            try {
              const token = getAccessToken();
              if (!token) {
                throw new Error('로그인이 필요합니다');
              }

              const response = await fetch(`/api/styling/feedback`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  categoryName,
                  status,
                  latitude: weatherData.latitude,
                  longitude: weatherData.longitude
                })
              });

              if (!response.ok) {
                throw new Error('피드백 전송에 실패했습니다');
              }

            } catch (error) {
              console.error('피드백 전송 실패:', error);
              alert(error instanceof Error ? error.message : '피드백 전송에 실패했습니다');
            }
          }}
        />
        
        {/* 새로운 추천 받기 버튼 */}
        <div className="flex justify-center pt-6">
          <Button
            onClick={async () => {
              try {
                const token = getAccessToken();
                if (!token) {
                  throw new Error('로그인이 필요합니다');
                }

                // 현재 저장되지 않은 피드백이 있다면 먼저 저장
                const unsavedFeedbacks = Object.entries(feedbackStates)
                  .filter(([_, state]) => state.status !== null)
                  .map(([category, state]) => ({
                    category,
                    status: state.status as 'LIKE' | 'DISLIKE'
                  }));

                if (unsavedFeedbacks.length > 0) {
                  for (const { category, status } of unsavedFeedbacks) {
                    await handleFeedback(category, status);
                  }
                }

                // 추천 텍스트를 null로 설정하여 로딩 상태 표시
                setStylingData({
                  ...stylingData,
                  recommendationText: ''
                });

                const response = await fetch(
                  `/api/styling?latitude=${weatherData.latitude}&longitude=${weatherData.longitude}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  }
                );

                if (!response.ok) {
                  throw new Error('새로운 추천 데이터를 가져오는데 실패했습니다');
                }

                const newData = await response.json();
                setStylingData(newData);
                
                // 피드백 상태 초기화
                setFeedbackStates({});
                
              } catch (error) {
                console.error('새로운 추천 데이터 조회 실패:', error);
                alert(error instanceof Error ? error.message : '새로운 추천을 가져오는데 실패했습니다');

                // 에러 발생 시 이전 데이터 복원
                if (stylingData) {
                  setStylingData(stylingData);
                }
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            피드백 반영한 새로운 추천 받기
          </Button>
        </div>
      </div>
    </main>
  )
}
