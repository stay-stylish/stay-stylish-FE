import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { country, city, startDate, endDate } = body

    console.log('Travel outfit request:', { country, city, startDate, endDate })

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      console.error('No token provided')
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다' },
        { status: 401 }
      )
    }

    // stay-stylish 백엔드 API 호출
    const backendUrl = `${BACKEND_URL}/api/v1/travel-outfits/recommendations`
    console.log('Calling backend URL:', backendUrl)

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        country,
        city,
        startDate,
        endDate
      })
    })

    console.log('Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error response:', errorText)
      
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: '인증에 실패했습니다. 다시 로그인해주세요.' },
          { status: 401 }
        )
      }

      throw new Error(`백엔드 응답 오류: ${response.status}`)
    }

    const data = await response.json()
    console.log('Backend response data:', JSON.stringify(data, null, 2))

    // stay-stylish 응답 형식: { success, message, data: TravelOutfitResponse, timestamp }
    const travelData = data.data

    return NextResponse.json({
      travelOutfitId: travelData.travelId,
      country: travelData.country,
      city: travelData.city,
      startDate: travelData.startDate,
      endDate: travelData.endDate,
      weatherSummary: travelData.weatherSummary,
      culturalConstraints: travelData.culturalConstraints,
      aiOutfit: travelData.aiOutfitJson,
      safetyNotes: travelData.safetyNotes
    })
  } catch (error) {
    console.error('Travel outfit API error:', error)
    
    return NextResponse.json(
      { error: '여행 옷차림 추천을 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
