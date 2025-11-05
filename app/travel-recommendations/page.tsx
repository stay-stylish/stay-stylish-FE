// stay-stylish/stay-stylish-fe/stay-stylish-FE-c14b4b1a4b8e4c05090a39f123785ddbf08fe1b0/app/travel-recommendations/page.tsx

"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useMemo } from "react" // [수정] useMemo import
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, ArrowLeft, Users2, User } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadingButton } from "@/components/ui/loading-button"

// (인터페이스 정의는 기존과 동일)
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

// 이 인터페이스는 API 응답(TravelOutfitResponse)과 일치해야 합니다.
interface TravelStylingData {
  travelId: number
  status?: 'PENDING' | 'COMPLETED' | 'FAILED'  // 상태 필드
  country: string
  city: string
  startDate: string
  endDate: string
  weatherSummary: WeatherSummary
  culturalConstraints: CulturalConstraints
  aiOutfit: AiOutfit // aiOutfitJson이 아닌 aiOutfit
  safetyNotes: string[]
  errorMessage?: string // 에러 메시지 필드
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
  
  const [loadingText, setLoadingText] = useState("AI가 스타일링 분석중");

  // --- [수정] 날짜 제한 로직 ---
  // 'YYYY-MM-DD' 형식으로 날짜를 반환하는 헬퍼
  const getISODate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // 오늘 날짜 (min)
  const today = useMemo(() => getISODate(new Date()), []);
  
  // 14일 뒤 날짜 (max)
  const maxDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14); // 오늘로부터 14일 뒤
    return getISODate(date);
  }, []);
  // --- [수정 완료] ---


  const handleGetStyling = async () => {
    setError(""); // 이전 에러 메시지 초기화

    // --- [수정] 입력값 검증 로직 ---
    if (!country.trim() || !city.trim() || !startDate || !endDate) {
      setError("모든 필드를 입력해주세요");
      return;
    }

    // 영어, 공백, 하이픈, 쉼표, 마침표, 괄호, 작은따옴표만 허용 (도시/국가 이름)
    const englishRegex = /^[a-zA-Z\s\-.,()']+$/;
    if (!englishRegex.test(country.trim())) {
      setError("나라는 영어(알파벳)로만 입력해주세요.");
      return;
    }
    if (!englishRegex.test(city.trim())) {
      setError("도시는 영어(알파벳)로만 입력해주세요.");
      return;
    }
    
    if (new Date(endDate) < new Date(startDate)) {
      setError("종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }
    // --- [수정 완료] ---

    setIsLoading(true);
    setLoadingText("AI가 스타일링 분석중"); 

    try {
      const token = getAccessToken();

      if (!token) {
        setError("로그인이 필요합니다");
        setIsLoading(false); 
        router.push("/login"); 
        return;
      }

      // 1. Next.js API 프록시(/api/travel) 호출 (POST)
      const requestResponse = await fetch('/api/travel', { 
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

      const responseData = await requestResponse.json(); 

      if (!requestResponse.ok) {
        throw new Error(responseData.error || '여행 옷차림 추천 요청에 실패했습니다');
      }

      // 2. 백엔드 ApiResponse에서 travelId 추출
      const travelOutfitId = responseData.data?.travelId;

      if (!travelOutfitId) {
        console.error('Full server response:', JSON.stringify(responseData, null, 2));
        throw new Error(`여행 옷차림 추천 ID를 받지 못했습니다. 응답 데이터를 확인해주세요.`);
      }
      
      console.log(`Retrieved travel outfit ID: ${travelOutfitId}`);
      
      // 3. 결과가 준비될 때까지 주기적으로 확인 (Polling)
      let retryCount = 0;
      const maxRetries = 60;  // 최대 60번 시도 (3분)
      const retryInterval = 3000;  // 3초마다 확인

      while (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryInterval)); 
        
        try {
          // Next.js GET 프록시(/api/travel/history) 호출
          const resultResponse = await fetch(`/api/travel/history/${travelOutfitId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!resultResponse.ok) {
            if (resultResponse.status === 404) {
              console.log('아직 결과가 준비되지 않았습니다. 재시도 중...');
              setLoadingText(`추천 정보 생성 중... (${retryCount+1}/${maxRetries})`);
              retryCount++;
              continue;
            }

            const errorData = await resultResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `여행 옷차림 추천을 가져오는데 실패했습니다 (${resultResponse.status})`);
          }

          const recommendationData: TravelStylingData = await resultResponse.json();
          
          if (!recommendationData) {
            console.log('아직 결과가 준비되지 않았습니다. (null 응답). 재시도 중...');
            setLoadingText(`추천 정보 생성 중... (${retryCount+1}/${maxRetries})`);
            retryCount++;
            continue;
          }

          console.log('추천 처리 상태:', recommendationData?.status);

          // 상태에 따른 처리
          switch (recommendationData.status) {
            case 'COMPLETED':
              if (!recommendationData.weatherSummary || !recommendationData.aiOutfit) {
                console.log('데이터 준비 중... (날씨 정보 및 AI 추천 대기)');
                setLoadingText(`데이터 정리 중... (${retryCount+1}/${maxRetries})`);
                retryCount++;
                continue;
              }
              // 성공 시 상세 페이지로 리디렉션
              console.log('추천이 완료되었습니다! 페이지로 이동합니다.');
              router.push(`/travel-history/${travelOutfitId}`);
              return; // 성공 (페이지 이동이 시작되면 로딩을 false로 바꿀 필요 없음)
              
            case 'FAILED':
              // 처리 중 오류가 발생한 경우
              throw new Error(recommendationData.errorMessage || '여행 옷차림 추천 생성에 실패했습니다');
              
            case 'PENDING':
            default:
              // 로딩 텍스트 업데이트
              let statusMessage = '옷차림 추천 준비 중...';
              console.log(`${statusMessage} (${retryCount + 1}/${maxRetries})`);
              setLoadingText(`${statusMessage} (${retryCount + 1}/${maxRetries})`);
              retryCount++;
              continue;
          }
        } catch (pollError) {
          if (retryCount >= maxRetries) {
            throw pollError;  // 최대 시도 횟수를 초과한 경우 에러를 상위로 전파
          }
          console.warn('재시도 중 오류 발생:', pollError);
          retryCount++;
        }
      }

      throw new Error('시간 초과: 여행 옷차림 추천을 가져오는데 실패했습니다');

    } catch (err) {
      console.error('Failed to fetch travel styling:', err);
      setError(err instanceof Error ? err.message : '여행 옷차림 추천을 가져오는데 실패했습니다');
      setIsLoading(false); // 에러가 발생했을 때만 isLoading을 false로 설정
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
                  min={today} // [수정] 오늘 날짜
                  max={maxDate} // [수정] 14일 뒤
                />
              </div>

              <div className="relative flex-1">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-full border-2 border-slate-300 px-6 py-3 text-base w-full"
                  placeholder="종료일"
                  min={startDate || today} // [수정] 시작일 또는 오늘 날짜
                  max={maxDate} // [수정] 14일 뒤
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
              loadingText={loadingText} // 동적 로딩 텍스트
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
            </div>
          )}

          {/* Styling Recommendation Result - 제거 (완료 시 페이지 이동) */}
        </div>
      </div>
    </main>
  );
}