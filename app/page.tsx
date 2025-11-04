"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, Plane, Users, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useWeather } from "@/hooks/use-weather"
import { Skeleton } from "@/components/ui/skeleton"

interface WeatherData {
  location: string
  temperature: number
  precipitation: number
  weather: string
  icon: string
  humidity?: number
  windSpeed?: number
  latitude?: number
  longitude?: number
}

interface StylingData {
  recommendationText: string
  recommendedCategories: string[]
  recommendedLinks: string[]
}

// 날씨 아이콘 매핑
function getWeatherEmoji(iconCode: string): string {
  const iconMap: { [key: string]: string } = {
    "01d": "☀️", "01n": "🌙",
    "02d": "⛅", "02n": "☁️",
    "03d": "☁️", "03n": "☁️",
    "04d": "☁️", "04n": "☁️",
    "09d": "🌧️", "09n": "🌧️",
    "10d": "🌦️", "10n": "🌧️",
    "11d": "⛈️", "11n": "⛈️",
    "13d": "❄️", "13n": "❄️",
    "50d": "🌫️", "50n": "🌫️",
  }
  return iconMap[iconCode] || "🌤️"
}

export default function Home() {
  const router = useRouter()
  const [region, setRegion] = useState("")
  const [isLoadingWeather, setIsLoadingWeather] = useState(false)
  const [isLoadingStyling, setIsLoadingStyling] = useState(false)
  const [error, setError] = useState("")
  const { isAuthenticated, user, getAccessToken, logout } = useAuth()
  const { weatherData, stylingData, setWeatherData, setStylingData } = useWeather()

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      router.push("/login")
    } else {
      router.push("/profile")
    }
  }

  const handleLogout = () => {
    logout()
    setWeatherData(null) // 로그아웃 시 추천 데이터 초기화
    setStylingData(null)
    router.push("/login")
  }

  const handleGetWeather = async () => {
    if (!region.trim()) {
      setError("지역을 입력해주세요")
      return
    }

    // 로그인 체크
    if (!isAuthenticated) {
      setError("스타일링 추천을 받으려면 로그인이 필요합니다")
      setIsLoadingWeather(false)
      setIsLoadingStyling(false)
      router.push("/login")
      return
    }

    setIsLoadingWeather(true)
    setIsLoadingStyling(true)
    setError("")
    setStylingData(null) // 이전 추천 초기화
    
    try {
      // Nominatim API를 사용하여 지역명으로 위도/경도 검색
      const searchQuery = `${region}, South Korea`  // 한국 지역으로 한정
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=kr`,
        {
          headers: {
            'Accept-Language': 'ko'  // 한국어 결과 우선
          }
        }
      )
      
      if (!geocodeResponse.ok) {
        throw new Error("위치 검색에 실패했습니다")
      }

      const locations = await geocodeResponse.json()
      
      if (!locations.length) {
        throw new Error("입력하신 지역을 찾을 수 없습니다")
      }

      const { lat, lon } = locations[0]

      // 위도/경도로 날씨 정보 가져오기
      const weatherResponse = await fetch(
        `/api/weather?latitude=${lat}&longitude=${lon}`
      )
      
      if (!weatherResponse.ok) {
        const errorData = await weatherResponse.json()
        throw new Error(errorData.error || "날씨 정보를 가져오는데 실패했습니다")
      }

      const weather = await weatherResponse.json()
      setWeatherData(weather)
      setIsLoadingWeather(false)

      // 날씨 조회 성공 시 자동으로 AI 스타일링 추천 시작
      if (weather.latitude && weather.longitude) {
        try {
          const token = getAccessToken()
          
          if (!token) {
            console.warn("No access token available")
            setError("스타일링 추천을 받으려면 로그인이 필요합니다")
            setIsLoadingStyling(false)
            return
          }

          const stylingResponse = await fetch(
            `/api/styling?latitude=${weather.latitude}&longitude=${weather.longitude}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          )
          
          console.log('Styling response status:', stylingResponse.status)
          
          if (stylingResponse.ok) {
            const styling = await stylingResponse.json()
            console.log('Styling data received:', styling)
            setStylingData(styling)
          } else {
            const errorData = await stylingResponse.json().catch(() => ({ error: 'Unknown error' }))
            console.warn("Failed to fetch styling recommendations:", errorData)
            console.error("Response status:", stylingResponse.status)
            console.error("Response statusText:", stylingResponse.statusText)
            setError(errorData.error || "스타일링 추천을 가져오는데 실패했습니다")
          }
        } catch (stylingError) {
          console.error("Styling fetch error:", stylingError)
          console.error("Error details:", JSON.stringify(stylingError, null, 2))
          setError("스타일링 추천을 가져오는데 실패했습니다")
        } finally {
          setIsLoadingStyling(false)
        }
      } else {
        setIsLoadingStyling(false)
      }
    } catch (err) {
      console.error("Failed to fetch weather:", err)
      setError(err instanceof Error ? err.message : "날씨 정보를 가져오는데 실패했습니다")
      setIsLoadingWeather(false)
      setIsLoadingStyling(false)
    }
  }

  const handleGetStyling = () => {
    // 상세 스타일링 페이지로 이동
    router.push("/recommendations")
  }

  const handleTravelRecommendations = () => {
    router.push("/travel-recommendations")
  }

  const handleCommunity = () => {
    router.push("/community")
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="p-3 pt-14">
        {/* Header with Logo, Subtitle and Navigation */}
        <div className="max-w-7xl mx-auto px-[1.5rem] mb-12 flex items-center justify-between">
          <div className="flex flex-col items-start">
            <p className="text-lg font-[300] text-slate-700 mb-[5px] font-pretendard tracking-[-0.05em] flex items-center gap-[2px]">
              오늘의 날씨를 입다<span className="text-xl">☀️</span>
            </p>
            <h1 className="text-5xl font-[600] text-slate-900 font-pretendard tracking-[-0.01em]">
              Stay-Stylish
            </h1>
          </div>
          <div className="flex justify-end">
            <div className="flex items-center gap-3">
              <button
                onClick={handleProfileClick}
                className="p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                title="프로필"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-900"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
              <button
                onClick={handleTravelRecommendations}
                className="p-3 hover:bg-slate-50 rounded-lg transition-colors"
                title="여행 옷차림 추천"
              >
                <Plane className="w-6 h-6 text-slate-900" />
              </button>
              <button
                onClick={handleCommunity}
                className="p-3 hover:bg-slate-50 rounded-lg transition-colors"
                title="커뮤니티"
              >
                <Users className="w-6 h-6 text-slate-900" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar and Current Location Button */}
        <div className="max-w-7xl mx-auto mb-12 px-[1.5rem] -mt-[15px]">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-7 h-7 text-slate-400" />
              <Input
                type="text"
                placeholder="지역을 입력하세요"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoadingWeather) {
                    handleGetWeather()
                  }
                }}
                className="rounded-full border-2 border-slate-300 px-8 py-6 pl-16 text-xl w-full shadow-sm hover:shadow-md transition-shadow"
              />
            </div>
            <Button
              onClick={async () => {
                try {
                  // 로그인 체크
                  if (!isAuthenticated) {
                    setError("스타일링 추천을 받으려면 로그인이 필요합니다")
                    router.push("/login")
                    return
                  }

                  setIsLoadingWeather(true)
                  setIsLoadingStyling(true)
                  setError("")
                  setStylingData(null)

                  // 위치 정보 권한 요청 및 현재 위치 획득
                  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                      enableHighAccuracy: true,
                      timeout: 5000,
                      maximumAge: 0
                    })
                  })

                  const { latitude, longitude } = position.coords

                  // 위치 기반 날씨 정보 요청
                  const weatherResponse = await fetch(`/api/weather?latitude=${latitude}&longitude=${longitude}`)
                  
                  if (!weatherResponse.ok) {
                    const errorData = await weatherResponse.json()
                    throw new Error(errorData.error || "날씨 정보를 가져오는데 실패했습니다")
                  }

                  const weather = await weatherResponse.json()
                  setWeatherData(weather)
                  setIsLoadingWeather(false)

                  // 날씨 정보를 기반으로 스타일링 추천 요청
                  try {
                    const token = getAccessToken()
                    
                    if (!token) {
                      console.warn("No access token available")
                      setError("스타일링 추천을 받으려면 로그인이 필요합니다")
                      setIsLoadingStyling(false)
                      return
                    }

                    const stylingResponse = await fetch(
                      `/api/styling?latitude=${latitude}&longitude=${longitude}`,
                      {
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      }
                    )
                    
                    if (stylingResponse.ok) {
                      const styling = await stylingResponse.json()
                      setStylingData(styling)
                    } else {
                      const errorData = await stylingResponse.json().catch(() => ({ error: 'Unknown error' }))
                      console.error("Failed to fetch styling recommendations:", errorData)
                      setError(errorData.error || "스타일링 추천을 가져오는데 실패했습니다")
                    }
                  } catch (stylingError) {
                    console.error("Styling fetch error:", stylingError)
                    setError("스타일링 추천을 가져오는데 실패했습니다")
                  }
                } catch (error) {
                  console.error("Error:", error)
                  if (error instanceof GeolocationPositionError) {
                    switch(error.code) {
                      case error.PERMISSION_DENIED:
                        setError("위치 정보 접근 권한이 거부되었습니다")
                        break
                      case error.POSITION_UNAVAILABLE:
                        setError("위치 정보를 사용할 수 없습니다")
                        break
                      case error.TIMEOUT:
                        setError("위치 정보 요청 시간이 초과되었습니다")
                        break
                      default:
                        setError("위치 정보를 가져오는데 실패했습니다")
                    }
                  } else {
                    setError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다")
                  }
                } finally {
                  setIsLoadingWeather(false)
                  setIsLoadingStyling(false)
                }
              }}
              className="whitespace-nowrap px-6 h-[3.25rem] bg-blue-600 hover:bg-blue-700 text-white rounded-full text-lg font-medium shadow-sm hover:shadow-md transition-all"
            >
              현재 위치로 추천받기
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-7xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
            {error}
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-8 px-8">
          {/* Left Column - Weather Information */}
          <div className="p-6">
            {isLoadingWeather ? (
              // 날씨 정보 로딩 중 Skeleton UI
              <div className="space-y-6">
                <div className="flex justify-center">
                  <Skeleton className="h-10 w-48" />
                </div>
                <div className="flex justify-center items-center gap-8">
                  <Skeleton className="h-32 w-32 rounded-full" />
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-36" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                </div>
              </div>
            ) : weatherData ? (
              <>
                <div className="mb-4 text-center">
                  <h2 className="text-3xl font-bold text-slate-900">
                    {weatherData.location}
                  </h2>
                </div>
                <div className="flex justify-center items-center gap-4">
                  <div className="flex items-center">
                    <div className="text-[120px]">{getWeatherEmoji(weatherData.icon)}</div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-6xl font-bold text-slate-900">{weatherData.temperature}°C</p>
                    <p className="text-xl text-slate-600">{weatherData.weather}</p>
                    <p className="text-lg text-slate-600 font-medium">
                      강수량 {weatherData.precipitation}mm
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-400 mb-2">지역을 입력하고 날씨를 확인하세요</h2>
                <p className="text-lg text-slate-400">날씨 정보를 기반으로 옷차림을 추천해드립니다</p>
              </div>
            )}
          </div>

          {/* Right Column - Styling Recommendations */}
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex justify-start max-w-md mx-auto">
                <div className="relative bg-[#E9E9EB] text-[#000000] px-4 py-3 rounded-[22px] text-[17px]">
                  <div className="absolute w-4 h-4 bg-[#E9E9EB] -left-1.5 top-4 transform rotate-45"
                       style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }}>
                  </div>
                  오늘 날씨에 맞는 스타일링이 뭐야?
                </div>
              </div>
              
              {isLoadingStyling ? (
                // 로딩 중 스타일링 추천
                <div className="py-2">
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-slate-500">스타일링 추천 중...</span>
                    </div>
                  </div>
                </div>
              ) : stylingData ? (
                // AI 추천 카테고리
                <div className="py-2">
                  <div className="flex flex-wrap gap-3 justify-end px-4">
                    {stylingData.recommendedCategories.map((category, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-xl py-3 px-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-lg text-[#4169E1] font-semibold"
                      >
                        {category}
                      </div>
                    ))}
                  </div>
                </div>
              ) : weatherData ? (
                // 날씨는 있지만 아직 추천이 없을 때
                <p className="text-lg text-slate-500 text-center">
                  날씨를 조회하면 AI 추천을 받을 수 있어요
                </p>
              ) : (
                // 아무것도 없을 때
                <p className="text-lg text-slate-500 text-center">
                  날씨를 확인하고 AI 스타일링 추천을 받아보세요
                </p>
              )}

              <div className="flex justify-end pr-4">
                <div className="relative">
                  <div className="relative bg-[#4169E1] text-white px-4 py-3 rounded-[22px]">
                    <Button
                      onClick={handleGetStyling}
                      disabled={!stylingData}
                      className="text-white disabled:opacity-50 disabled:cursor-not-allowed p-0 m-0 bg-transparent hover:bg-transparent text-[17px] leading-none h-auto min-h-0 font-normal"
                    >
                      {"   상세 스타일링 보러 가기 ▶   "}
                    </Button>
                    <div className="absolute w-4 h-4 bg-[#4169E1] -right-1.5 top-4 transform rotate-45"
                         style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Travel Styling Banner */}
        <div className="absolute left-0 right-0 w-screen mt-8 overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-black/70 z-10"></div>
            <div className="absolute inset-0">
              <Image
                src="/plane.jpg"
                alt="비행기 풍경"
                fill
                className="object-cover"
                priority
                onError={(e) => {
                  console.error('Image failed to load:', e)
                }}
                onLoad={() => {
                  console.log('Image loaded successfully')
                }}
              />
            </div>
            <div className="relative z-20 max-w-7xl mx-auto py-20 px-8">
              <div className="space-y-3 flex flex-col items-center text-center">
                <h2 className="text-5xl font-bold text-white flex items-center gap-3">
                  떠나요 해외로 <span className="text-5xl">✈️</span>
                </h2>
                <p className="text-xl text-gray-200">여행지 날씨에 맞는 옷차림이 궁금하시다면?</p>
                <div className="mt-8">
                  <Button
                    onClick={handleTravelRecommendations}
                    className="bg-white hover:bg-gray-100 text-[#111111] px-8 py-6 text-lg font-medium rounded-xl transition-transform hover:scale-105"
                  >
                    여행 스타일링 보러 가기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}