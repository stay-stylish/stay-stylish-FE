import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, nickname, gender, stylePreference } = body

    console.log('Signup request:', { email, nickname, gender, stylePreference })

    // stay-stylish 백엔드 회원가입 API 호출
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        nickname,
        gender,
        stylePreference,
      }),
    })

    console.log('Backend signup response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Backend signup error:', errorData)
      return new NextResponse(
        JSON.stringify({
          error: errorData.message || "회원가입에 실패했습니다."
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
    console.log('Backend signup success:', data)
    
    // 백엔드 응답: { success, message, data: { userId, email, nickname, ... }, timestamp }
    return NextResponse.json({
      success: true,
      message: data.message || "회원가입이 완료되었습니다. 이메일 인증을 완료해주세요.",
      user: data.data
    })
  } catch (error) {
    console.error('Signup API error:', error)
    return new NextResponse(
      JSON.stringify({
        error: "서버 오류가 발생했습니다."
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
