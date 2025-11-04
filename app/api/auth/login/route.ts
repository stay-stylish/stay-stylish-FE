import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    console.log('Login request for:', email)

    // stay-stylish 백엔드 로그인 API 호출
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    console.log('Backend login response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Backend login error:', errorData)
      return new NextResponse(
        JSON.stringify({
          error: errorData.message || "로그인에 실패했습니다."
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const data = await response.json()
    console.log('Login successful, got tokens')
    
    // 백엔드 응답: { success, message, data: { accessToken, refreshToken }, timestamp }
    const tokens = data.data

    // 사용자 정보 조회
    const userResponse = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    })

    console.log('User info response status:', userResponse.status)

    if (!userResponse.ok) {
      const userError = await userResponse.json()
      console.error('User info fetch error:', userError)
      throw new Error('사용자 정보 조회 실패')
    }

    const userData = await userResponse.json()
    const user = userData.data
    console.log('User info fetched:', user.email)

    // 프론트엔드 형식에 맞게 변환
    return NextResponse.json({
      user: {
        id: user.id.toString(), // userId가 아니라 id
        email: user.email,
        nickname: user.nickname,
        preferredStyle: user.stylePreference || '',
        gender: user.gender || '',
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  } catch (error) {
    console.error('Login API error:', error)
    return new NextResponse(
      JSON.stringify({
        error: error instanceof Error ? error.message : "서버 오류가 발생했습니다."
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}