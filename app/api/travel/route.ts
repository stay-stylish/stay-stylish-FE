// stay-stylish/stay-stylish-fe/stay-stylish-FE-c14b4b1a4b8e4c05090a39f123785ddbf08fe1b0/app/api/travel/route.ts

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

    // [수정] response.ok 확인을 .json() 호출 전에 수행
    if (!response.ok) {
      const errorText = await response.text(); // JSON이 아닐 수 있으므로 text()로 먼저 받음
      console.error('Backend error response:', errorText)
      
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: '인증에 실패했습니다. 다시 로그인해주세요.' },
          { status: 401 }
        )
      }

      // 에러 응답이 JSON인지 시도하고, 아니면 텍스트를 사용
      let errorMessage = `백엔드 응답 오류: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // JSON 파싱 실패 시 errorText가 비어있지 않으면 사용
        if (errorText) {
          errorMessage = errorText;
        }
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }
    
    // [수정] response.ok가 확인되었으므로 안전하게 .json() 호출
    const data = await response.json(); 

    console.log('Backend response data:', JSON.stringify(data, null, 2))

    // 백엔드가 보낸 ApiResponse를 클라이언트에 그대로 반환
    // (데이터 형식: { success, message, data: { travelId }, timestamp })
    return NextResponse.json(data);

  } catch (error) {
    console.error('Travel outfit API error:', error)
    
    return NextResponse.json(
      { error: '여행 옷차림 추천 요청에 실패했습니다.' },
      { status: 500 }
    )
  }
}