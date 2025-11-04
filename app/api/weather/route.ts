import { NextResponse } from 'next/server'

// stay-stylish 백엔드 URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const latitude = searchParams.get('latitude')
    const longitude = searchParams.get('longitude')

    console.log('Weather API called with:', { location, latitude, longitude })

    // GPS 좌표가 있으면 그대로 사용
    if (latitude && longitude) {
      console.log('Using GPS coordinates:', latitude, longitude)
      const response = await fetch(`${BACKEND_URL}/api/v1/weather/weather-by-gps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }),
        credentials: 'omit'  // credentials 비활성화
      })

      console.log('Backend response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Backend error:', errorText)
        throw new Error('날씨 정보를 가져올 수 없습니다')
      }

      const data = await response.json()
      console.log('Backend response data:', data)
      
      // stay-stylish 응답을 프론트엔드 형식으로 변환
      const weatherData = data.data
      const locationParts = [weatherData.province, weatherData.city, weatherData.district].filter(Boolean)
      return NextResponse.json({
        location: locationParts.join(' '),
        temperature: Math.round(weatherData.temperature),
        precipitation: weatherData.rainfall,
        weather: `${weatherData.sky} ${weatherData.pty !== '없음' ? weatherData.pty : ''}`.trim(),
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        icon: getSkyIcon(weatherData.sky, weatherData.pty),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      })
    }

    // 지역명만 있으면 Geocoding 필요
    if (location) {
      const decodedLocation = decodeURIComponent(location)
      console.log('Using location name:', decodedLocation)
      // 간단한 한국 주요 도시 좌표 매핑
      const cityCoords: { [key: string]: { lat: number; lon: number } } = {
        '서울': { lat: 37.5665, lon: 126.9780 },
        '부산': { lat: 35.1796, lon: 129.0756 },
        '대구': { lat: 35.8714, lon: 128.6014 },
        '인천': { lat: 37.4563, lon: 126.7052 },
        '광주': { lat: 35.1595, lon: 126.8526 },
        '대전': { lat: 36.3504, lon: 127.3845 },
        '울산': { lat: 35.5384, lon: 129.3114 },
        '세종': { lat: 36.4800, lon: 127.2890 },
        '수원': { lat: 37.2636, lon: 127.0286 },
        '성남': { lat: 37.4449, lon: 127.1388 },
      }

      // 입력된 지역명이 도시 이름을 포함하는지 확인
      const matchedCity = Object.keys(cityCoords).find(city => 
        decodedLocation.includes(city) || city.includes(decodedLocation)
      )
      const coords = matchedCity ? cityCoords[matchedCity] : cityCoords['서울'] // 기본값: 서울
      console.log('Mapped coordinates:', coords)
      
      const backendUrl = `${BACKEND_URL}/api/v1/weather/weather-by-gps`
      console.log('Calling backend URL:', backendUrl)
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lon,
        }),
        credentials: 'omit'
      })

      console.log('Backend response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Backend error response:', errorText)
        throw new Error(`백엔드 응답 오류: ${response.status}`)
      }

      const data = await response.json()
      console.log('Backend response data:', JSON.stringify(data, null, 2))
      
      const weatherData = data.data
      const locationParts = [weatherData.province, weatherData.city, weatherData.district].filter(Boolean)
      
      return NextResponse.json({
        location: locationParts.join(' '),
        temperature: Math.round(weatherData.temperature),
        precipitation: weatherData.rainfall,
        weather: `${weatherData.sky} ${weatherData.pty !== '없음' ? weatherData.pty : ''}`.trim(),
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        icon: getSkyIcon(weatherData.sky, weatherData.pty),
        latitude: coords.lat,
        longitude: coords.lon
      })
    }

    return NextResponse.json(
      { error: '지역 또는 GPS 좌표를 입력해주세요' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '날씨 정보를 가져오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

// 날씨 상태에 따른 아이콘 코드 반환
function getSkyIcon(sky: string, pty: string): string {
  if (pty === '비') return '10d'
  if (pty === '눈') return '13d'
  if (sky === '맑음') return '01d'
  if (sky === '구름많음') return '02d'
  if (sky === '흐림') return '04d'
  return '01d'
}
