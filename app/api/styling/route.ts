import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const latitude = searchParams.get('latitude')
    const longitude = searchParams.get('longitude')

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'GPS 좌표가 필요합니다' },
        { status: 400 }
      )
    }

    console.log('Styling API called with:', { latitude, longitude })

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
    const backendUrl = `${BACKEND_URL}/api/v1/outfits/recommendation?latitude=${latitude}&longitude=${longitude}`
    console.log('Calling backend URL:', backendUrl)

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    })

    console.log('Backend response status:', response.status)
    console.log('Backend response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error response:', errorText)
      console.error('Request was sent to:', backendUrl)
      console.error('With token (first 20 chars):', token.substring(0, 20))
      
      // 인증 에러인 경우
      if (response.status === 401 || response.status === 403) {
        console.log('Authentication failed - returning 401')
        return NextResponse.json(
          { error: '인증에 실패했습니다. 다시 로그인해주세요.' },
          { status: 401 }
        )
      }

      throw new Error(`백엔드 응답 오류: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Backend response data:', JSON.stringify(data, null, 2))

    // stay-stylish 응답 형식: { success, message, data, timestamp }
    const stylingData = data.data

    if (!stylingData) {
      console.error('No data in response:', data)
      throw new Error('백엔드 응답에 data 필드가 없습니다')
    }

    console.log('Styling data to return:', {
      recommendationText: stylingData.recommendation_text,
      recommendedCategories: stylingData.recommended_categories,
      recommendedLinks: stylingData.recommended_links
    })

    return NextResponse.json({
      recommendationText: stylingData.recommendation_text,
      recommendedCategories: stylingData.recommended_categories,
      recommendedLinks: stylingData.recommended_links
    })
  } catch (error) {
    console.error('Styling API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { error: '스타일링 추천을 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
