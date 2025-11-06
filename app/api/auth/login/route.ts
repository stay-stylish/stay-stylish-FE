import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    console.log('[Login] 로그인 요청:', email)

    // stay-stylish 백엔드 로그인 API 호출
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    console.log('[Login] 백엔드 응답 상태:', response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[Login] 백엔드 오류:', errorData)
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
    console.log('[Login] 로그인 성공')

    // 백엔드 응답: { success, message, data: { accessToken, refreshToken }, timestamp }
    const tokens = data.data

    // 사용자 정보 조회
    const userResponse = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    })

    console.log('[Login] 사용자 정보 응답 상태:', userResponse.status)

    if (!userResponse.ok) {
      const userError = await userResponse.json()
      console.error('[Login] 사용자 정보 조회 오류:', userError)
      throw new Error('사용자 정보 조회 실패')
    }

    const userData = await userResponse.json()
    const user = userData.data;
    console.log('[Login] 사용자 정보 조회 완료:', user.email);

    return NextResponse.json({
      user: {
        id: user.id.toString(),
        email: user.email,
        nickname: user.nickname,
        preferredStyle: user.stylePreference || '',
        gender: user.gender || '', // MALE/FEMALE 그대로
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  } catch (error) {
    console.error('[Login] 예외 발생:', error)
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