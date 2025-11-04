"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, ArrowLeft, Users2, User } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadingButton } from "@/components/ui/loading-button"

interface WeatherSummary {
  avgTemperature: number
  avgHumidity: number
  rainProbability: number
  condition: string
  umbrellaSummary?: string
}

interface CulturalConstraints {
  notes: string
  rules: string[]
}

interface OutfitSet {
  setNo: number
  reason: string
  items: Array<{
    slot: string
    item: string
    styleTag: string
  }>
}

interface AiOutfit {
  summary: string
  outfits: OutfitSet[]
}

interface TravelStylingData {
  travelOutfitId: number
  status?: 'PENDING' | 'COMPLETED' | 'FAILED'  // 상태 필드 추가
  country: string
  city: string
  startDate: string
  endDate: string
  weatherSummary: WeatherSummary
  culturalConstraints: CulturalConstraints
  aiOutfit: AiOutfit
  safetyNotes: string[]
}

export default function TravelRecommendationsPage() {
  const router = useRouter()
  const { getAccessToken } = useAuth()
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stylingData, setStylingData] = useState<TravelStylingData | null>(null);

  const handleGetStyling = async () => {
    if (!country.trim() || !city.trim() || !startDate || !endDate) {
      setError("모든 필드를 입력해주세요");
      return;
    }

    setIsLoading(true);
    setError("");
    setStylingData(null);

    try {
      const token = getAccessToken();

      if (!token) {
        setError("로그인이 필요합니다");
        setIsLoading(false);
        return;
      }

      // 1. 먼저 추천 요청을 보냅니다
      const requestResponse = await fetch('/api/v1/travel-outfits/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          country,
          city,
          startDate,
          endDate
        })
      });

      if (!requestResponse.ok) {
        const errorData = await requestResponse.json();
        throw new Error(errorData.error || '여행 옷차림 추천 요청에 실패했습니다');
      }

      const responseData = await requestResponse.json();
      console.log('Initial response data:', JSON.stringify(responseData.data, null, 2));

      // data 객체 안의 travelId를 확인
      const travelOutfitId = responseData.data?.travelId;

      if (!travelOutfitId) {
        console.error('Full server response:', JSON.stringify(responseData, null, 2));
        throw new Error(`여행 옷차림 추천 ID를 받지 못했습니다. 응답 데이터를 확인해주세요.`);
      }
      
      console.log(`Retrieved travel outfit ID: ${travelOutfitId}`);
      
      // 2. 결과가 준비될 때까지 주기적으로 확인합니다
      let retryCount = 0;
      const maxRetries = 60;  // 최대 60번 시도 (3분)
      const retryInterval = 3000;  // 3초마다 확인

      while (retryCount < maxRetries) {
        try {
          const resultResponse = await fetch(`/api/v1/travel-outfits/recommendations/${travelOutfitId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!resultResponse.ok) {
            if (resultResponse.status === 404) {
              console.log('아직 결과가 준비되지 않았습니다. 재시도 중...');
              await new Promise(resolve => setTimeout(resolve, retryInterval));
              retryCount++;
              continue;
            }

            const errorData = await resultResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `여행 옷차림 추천을 가져오는데 실패했습니다 (${resultResponse.status})`);
          }

          const data = await resultResponse.json();
          console.log('Travel styling data:', JSON.stringify(data, null, 2));

          if (!data.success) {
            if (data.message?.includes('존재하지 않는') || data.message?.includes('찾을 수 없')) {
              console.log('아직 추천이 생성되지 않았습니다. 재시도 중...');
              await new Promise(resolve => setTimeout(resolve, retryInterval));
              retryCount++;
              continue;
            }
            throw new Error(data.message || '여행 옷차림 추천 조회에 실패했습니다');
          }

          const recommendationData = data.data;
          console.log('추천 처리 상태:', recommendationData?.status);

          // 상태에 따른 처리
          switch (recommendationData?.status) {
            case 'COMPLETED':
              if (!recommendationData.weatherSummary || !recommendationData.aiOutfitJson) {
                console.log('데이터 준비 중... (날씨 정보 및 AI 추천 대기)');
                await new Promise(resolve => setTimeout(resolve, retryInterval));
                retryCount++;
                continue;
              }
              // 모든 데이터가 준비된 경우
              console.log('추천이 완료되었습니다!');
              
              // aiOutfit 필드명을 aiOutfitJson으로 변경하여 데이터 설정
              const stylingDataWithCorrectField = {
                ...recommendationData,
                aiOutfit: recommendationData.aiOutfitJson  // 필드명 변경
              };
              setStylingData(stylingDataWithCorrectField);
              return;  // 성공적으로 완료됨
              
            case 'FAILED':
              // 처리 중 오류가 발생한 경우
              throw new Error(recommendationData.errorMessage || '여행 옷차림 추천 생성에 실패했습니다');
              
            case 'PENDING':
            default:
              // 진행 상태 메시지 설정
              let statusMessage = '옷차림 추천 준비 중...';
              if (recommendationData.processingStatus) {
                if (recommendationData.processingStatus.includes('날씨')) {
                  statusMessage = '날씨 정보 수집 중...';
                } else if (recommendationData.processingStatus.includes('AI')) {
                  statusMessage = 'AI가 옷차림을 분석 중...';
                }
              }
              console.log(`${statusMessage} (${retryCount + 1}/${maxRetries})`);
              
              // Loading UI 업데이트를 위한 부분 상태 설정
              setError(null);  // 진행 중일 때는 에러 메시지 제거
              setIsLoading(true);  // 로딩 상태 유지
              
              await new Promise(resolve => setTimeout(resolve, retryInterval));
              retryCount++;
              continue;
          }
        } catch (error) {
          if (retryCount >= maxRetries) {
            throw error;  // 최대 시도 횟수를 초과한 경우 에러를 상위로 전파
          }
          console.warn('재시도 중 오류 발생:', error);
          await new Promise(resolve => setTimeout(resolve, retryInterval));
          retryCount++;
        }
      }

      throw new Error('시간 초과: 여행 옷차림 추천을 가져오는데 실패했습니다');
    } catch (err) {
      console.error('Failed to fetch travel styling:', err);
      setError(err instanceof Error ? err.message : '여행 옷차림 추천을 가져오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header Banner Section */}
      <div className="relative text-white py-16 px-8 overflow-hidden pt-14 min-h-[400px]">
        <div className="absolute inset-0 z-10 bg-black/70" />
        <div className="absolute inset-0">
          <Image
            src="/plane.jpg"
            alt="비행기 풍경"
            fill
            className="object-cover w-full h-full"
            sizes="100vw"
            quality={90}
            priority
          />
        </div>
        
        <div className="flex items-center gap-4 absolute top-4 left-8 z-20">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-black/30 rounded-lg transition-colors"
            title="뒤로 가기"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => router.push("/")}
            className="text-3xl font-[600] font-pretendard tracking-[-0.01em] text-white hover:text-blue-400 transition-colors"
          >
            Stay-Stylish
          </button>
        </div>

        <div className="flex items-center gap-4 absolute top-4 right-8 z-20">
          <button
            onClick={() => router.push("/community")}
            className="px-4 py-2 hover:bg-black/30 rounded-lg transition-colors text-white flex items-center gap-2"
            title="커뮤니티"
          >
            <Users2 className="w-5 h-5" />
            <span>커뮤니티</span>
          </button>
          <button
            onClick={() => router.push("/profile")}
            className="px-4 py-2 hover:bg-black/30 rounded-lg transition-colors text-white flex items-center gap-2"
            title="마이페이지"
          >
            <User className="w-5 h-5" />
            <span>마이페이지</span>
          </button>
        </div>

        <div className="relative z-20 max-w-7xl mx-auto mt-16">
          <h1 className="text-6xl font-bold mb-4">ARE YOU PLANNING TRAVEL?</h1>
          <p className="text-xl text-gray-200 mb-8">여행지에 딱 맞는 스타일링을 받아보세요!</p>
        </div>
      </div>

      {/* Travel Input Form Section */}
      <div className="py-12 px-8">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">해외 여행 옷차림 추천</h2>
            <Button 
              variant="outline" 
              className="text-[#4169E1] border-[#4169E1] hover:bg-blue-50 bg-transparent"
              onClick={() => router.push('/travel-history')}
            >
              조회 기록
            </Button>
          </div>

          <div className="space-y-4">
            {/* Country Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="여행할 나라를 영어로 입력하세요 (예: Japan, France)"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="rounded-full border-2 border-slate-300 px-6 py-3 pl-12 text-base w-full"
              />
            </div>

            {/* City Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="여행할 도시를 영어로 입력하세요 (예: Tokyo, Paris)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-full border-2 border-slate-300 px-6 py-3 pl-12 text-base w-full"
              />
            </div>

            {/* Date Range Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative flex-1">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-full border-2 border-slate-300 px-6 py-3 text-base w-full"
                  placeholder="시작일"
                />
              </div>

              <div className="relative flex-1">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-full border-2 border-slate-300 px-6 py-3 text-base w-full"
                  placeholder="종료일"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
              {error}
            </div>
          )}

          {/* Get Styling Button */}
          <div className="flex justify-center mt-8">
            <LoadingButton
              onClick={handleGetStyling}
              isLoading={isLoading}
              loadingText="AI가 스타일링 분석중"
              className="bg-[#4169E1] hover:bg-[#3154B3] text-white rounded-full px-12 py-4 font-semibold text-lg"
            >
              스타일링 받기
            </LoadingButton>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="mt-8 space-y-6">
              {/* Weather Summary Skeleton */}
              <div className="bg-blue-50 rounded-xl p-6 space-y-4">
                <Skeleton className="h-7 w-48" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </div>

              {/* AI Outfit Recommendations Skeleton */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4">
                <Skeleton className="h-7 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                
                <div className="space-y-6 mt-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="border-t pt-4 space-y-3">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((j) => (
                          <Skeleton key={j} className="h-16 w-full rounded-lg" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cultural Constraints Skeleton */}
              <div className="bg-purple-50 rounded-xl p-6 space-y-3">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-full" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              </div>

              {/* Safety Notes Skeleton */}
              <div className="bg-red-50 rounded-xl p-6 space-y-3">
                <Skeleton className="h-7 w-40" />
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Styling Recommendation Result */}
          {stylingData && !isLoading && (
            <div className="mt-8 space-y-6">
              {/* Weather Summary */}
              <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <h3 className="text-xl font-bold text-slate-900 mb-4">날씨 요약</h3>
                <div className="grid grid-cols-2 gap-4">
                  {stylingData?.weatherSummary && (
                    <>
                      <div>
                        <p className="text-sm text-slate-600">평균 기온</p>
                        <p className="text-2xl font-bold text-blue-600">{Number(stylingData.weatherSummary.avgTemperature).toFixed(1)}°C</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">강수 확률</p>
                        <p className="text-2xl font-bold text-blue-600">{Number(stylingData.weatherSummary.rainProbability).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">평균 습도</p>
                        <p className="text-2xl font-bold text-blue-600">{Number(stylingData.weatherSummary.avgHumidity).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">날씨 상태</p>
                        <p className="text-xl font-bold text-blue-600">{stylingData.weatherSummary.condition}</p>
                      </div>
                    </>
                  )}
                </div>
                {stylingData?.weatherSummary?.umbrellaSummary && (
                  <p className="mt-4 text-sm text-slate-700">{stylingData.weatherSummary.umbrellaSummary}</p>
                )}
              </div>

              {/* AI Outfit Recommendation */}
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-xl">
                <h3 className="text-xl font-bold text-slate-900 mb-4">AI 옷차림 추천</h3>
                <p className="text-base text-slate-700 leading-relaxed mb-6">{stylingData?.aiOutfit?.summary}</p>
                
                <div className="space-y-4">
                  {stylingData?.aiOutfit?.outfits?.map((outfit) => (
                    <div key={outfit.setNo} className="p-4 bg-white rounded-lg border border-green-200">
                      <p className="font-bold text-slate-900 mb-2">코디 {outfit.setNo}</p>
                      <p className="text-sm text-slate-600 mb-3">{outfit.reason}</p>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {outfit.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                            >
                              {item.item} ({item.styleTag})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cultural Constraints */}
              {stylingData?.culturalConstraints?.rules?.length > 0 && (
                <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">문화적 주의사항</h3>
                  <p className="text-base text-slate-700 mb-3">{stylingData.culturalConstraints.notes}</p>
                  <ul className="list-disc list-inside space-y-2">
                    {stylingData.culturalConstraints.rules.map((rule, idx) => (
                      <li key={idx} className="text-sm text-slate-700">{rule}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safety Notes */}
              {stylingData?.safetyNotes?.length > 0 && (
                <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">안전 주의사항</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {stylingData.safetyNotes.map((note, idx) => (
                      <li key={idx} className="text-sm text-slate-700">{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}