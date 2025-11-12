'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, ArrowLeft, Users2, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingButton } from '@/components/ui/loading-button';

interface WeatherSummary {
  avgTemperature: number;
  avgHumidity: number;
  rainProbability: number;
  condition: string;
  umbrellaSummary?: string;
}

interface CulturalConstraints {
  notes: string;
  rules: string[];
}

interface OutfitItem {
  slot: string;
  item: string;
  styleTag: string;
}
interface OutfitSet {
  setNo: number;
  reason: string;
  items: OutfitItem[];
}

interface AiOutfit {
  summary: string;
  outfits: OutfitSet[];
}

interface TravelStylingData {
  travelId: number;
  status?: 'PENDING' | 'COMPLETED' | 'FAILED';
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  weatherSummary: WeatherSummary;
  culturalConstraints: CulturalConstraints;
  aiOutfit: AiOutfit;
  safetyNotes: string[];
  errorMessage?: string;
}

export default function TravelRecommendationsPage() {
  const router = useRouter();
  const { getAccessToken } = useAuth();

  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState('AI가 스타일링 분석중');

  // 날짜 헬퍼
  const getISODate = (date: Date) => date.toISOString().split('T')[0];

  // 오늘(min), 14일 뒤(max)
  const today = useMemo(() => getISODate(new Date()), []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return getISODate(d);
  }, []);

  const handleGetStyling = async () => {
    setError(null);

    // 입력 검증
    if (!country.trim() || !city.trim() || !startDate || !endDate) {
      setError('모든 필드를 입력해주세요');
      return;
    }

    const englishRegex = /^[a-zA-Z\s\-.,()']+$/;
    if (!englishRegex.test(country.trim())) {
      setError('나라는 영어(알파벳)로만 입력해주세요.');
      return;
    }
    if (!englishRegex.test(city.trim())) {
      setError('도시는 영어(알파벳)로만 입력해주세요.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('종료일은 시작일보다 빠를 수 없습니다.');
      return;
    }

    setIsLoading(true);
    setLoadingText('AI가 스타일링 분석중');

    try {
      const token = getAccessToken();

      if (!token) {
        setError('로그인이 필요합니다');
        setIsLoading(false);
        router.push('/login');
        return;
      }

      // 1) 요청 생성
      const requestResponse = await fetch('/api/travel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ country, city, startDate, endDate }),
      });

      const responseData = await requestResponse.json();

      if (!requestResponse.ok) {
        throw new Error(
          responseData.error || '여행 옷차림 추천 요청에 실패했습니다'
        );
      }

      // 2) ID 추출
      const travelOutfitId: number | undefined = responseData.data?.travelId;
      if (!travelOutfitId) {
        console.error('Full server response:', JSON.stringify(responseData, null, 2));
        throw new Error(
          '여행 옷차림 추천 ID를 받지 못했습니다. 응답 데이터를 확인해주세요.'
        );
      }

      // 3) 폴링
      let retryCount = 0;
      const maxRetries = 60; // 3분
      const retryInterval = 3000; // 3초

      while (retryCount < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryInterval));

        try {
          const resultResponse = await fetch(`/api/travel/history/${travelOutfitId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!resultResponse.ok) {
            if (resultResponse.status === 404) {
              setLoadingText(`추천 정보 생성 중... (${retryCount + 1}/${maxRetries})`);
              retryCount++;
              continue;
            }
            const errorData = await resultResponse.json().catch(() => ({}));
            throw new Error(
              errorData.error ||
                `여행 옷차림 추천을 가져오는데 실패했습니다 (${resultResponse.status})`
            );
          }

          const recommendationData: TravelStylingData | null =
            await resultResponse.json();

          if (!recommendationData) {
            setLoadingText(`추천 정보 생성 중... (${retryCount + 1}/${maxRetries})`);
            retryCount++;
            continue;
          }

          switch (recommendationData.status) {
            case 'COMPLETED':
              if (
                !recommendationData.weatherSummary ||
                !recommendationData.aiOutfit
              ) {
                setLoadingText(`데이터 정리 중... (${retryCount + 1}/${maxRetries})`);
                retryCount++;
                continue;
              }
              router.push(`/travel-history/${travelOutfitId}`);
              return;

            case 'FAILED':
              throw new Error(
                recommendationData.errorMessage ||
                  '여행 옷차림 추천 생성에 실패했습니다'
              );

            case 'PENDING':
            default:
              setLoadingText(`옷차림 추천 준비 중... (${retryCount + 1}/${maxRetries})`);
              retryCount++;
              continue;
          }
        } catch (pollError) {
          if (retryCount >= maxRetries) {
            throw pollError instanceof Error ? pollError : new Error(String(pollError));
          }
          // 네트워크 순간 오류 등은 다음 루프로
          retryCount++;
        }
      }

      throw new Error('시간 초과: 여행 옷차림 추천을 가져오는데 실패했습니다');
    } catch (err) {
      console.error('Failed to fetch travel styling:', err);
      setError(
        err instanceof Error ? err.message : '여행 옷차림 추천을 가져오는데 실패했습니다'
      );
      setIsLoading(false);
    }
  };

  // '뒤로가기' 안정성 강화
  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative min-h-[400px] overflow-hidden px-8 pt-14 py-16 text-white">
        <div className="absolute inset-0 z-10 bg-black/70" />
        <div className="absolute inset-0">
          <Image
            src="/plane.jpg"
            alt="비행기 풍경"
            fill
            className="h-full w-full object-cover"
            sizes="100vw"
            quality={90}
            priority
          />
        </div>

        {/* Top Bar */}
        <div className="absolute left-8 top-4 z-20 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="rounded-lg p-2 transition-colors hover:bg-black/30"
            title="뒤로 가기"
          >
            <ArrowLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={() => router.push('/')}
            className="font-pretendard text-3xl font-[600] tracking-[-0.01em] text-white transition-colors hover:text-blue-400"
          >
            Stay-Stylish
          </button>
        </div>

        <div className="absolute right-8 top-4 z-20 flex items-center gap-4">
          <button
            onClick={() => router.push('/community')}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors hover:bg-black/30"
            title="커뮤니티"
          >
            <Users2 className="h-5 w-5" />
            <span>커뮤니티</span>
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors hover:bg-black/30"
            title="마이페이지"
          >
            <User className="h-5 w-5" />
            <span>마이페이지</span>
          </button>
        </div>

        <div className="relative z-20 mx-auto mt-16 max-w-7xl">
          <h1 className="mb-4 text-6xl font-bold">ARE YOU PLANNING TRAVEL?</h1>
          <p className="mb-8 text-xl text-gray-200">여행지에 딱 맞는 스타일링을 받아보세요!</p>
        </div>
      </div>

      {/* Form */}
      <div className="px-8 py-12">
        <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">해외 여행 옷차림 추천</h2>
            <Button
              variant="outline"
              className="border-[#4169E1] bg-transparent text-[#4169E1] hover:bg-blue-50"
              onClick={() => router.push('/travel-history')}
            >
              조회 기록
            </Button>
          </div>

          <div className="space-y-4">
            {/* Country */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="여행할 나라를 영어로 입력하세요 (예: Japan, France)"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-full border-2 border-slate-300 px-6 py-3 pl-12 text-base"
              />
            </div>

            {/* City */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="여행할 도시를 영어로 입력하세요 (예: Tokyo, Paris)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-full border-2 border-slate-300 px-6 py-3 pl-12 text-base"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="relative">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-full border-2 border-slate-300 px-6 py-3 text-base"
                  min={today}
                  max={maxDate}
                />
              </div>
              <div className="relative">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-full border-2 border-slate-300 px-6 py-3 text-base"
                  min={startDate || today}
                  max={maxDate}
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600">
              {error}
            </div>
          )}

          {/* CTA */}
          <div className="mt-8 flex justify-center">
            <LoadingButton
              onClick={handleGetStyling}
              isLoading={isLoading}
              loadingText={loadingText}
              className="rounded-full bg-[#4169E1] px-12 py-4 text-lg font-semibold text-white hover:bg-[#3154B3]"
            >
              스타일링 받기
            </LoadingButton>
          </div>

          {/* Loading UI */}
          {isLoading && (
            <div className="mt-8 space-y-6">
              {/* Weather Summary Skeleton */}
              <div className="space-y-4 rounded-xl bg-blue-50 p-6">
                <Skeleton className="h-7 w-48" />
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
                <Skeleton className="h-7 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />

                <div className="mt-6 space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-3 border-t pt-4">
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
        </div>
      </div>
    </main>
  );
}
