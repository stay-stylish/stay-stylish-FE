import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')

        console.log('Email verification request with token:', token ? 'present' : 'missing')

        if (!token) {
            return NextResponse.json(
                { error: '인증 토큰이 필요합니다' },
                { status: 400 }
            )
        }

        // 백엔드 이메일 검증 API 호출
        const response = await fetch(
            `${BACKEND_URL}/api/v1/auth/verify?token=${encodeURIComponent(token)}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )

        console.log('Backend verification response status:', response.status)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            console.error('Backend verification error:', errorData)
            return NextResponse.json(
                { error: errorData.message || '이메일 인증에 실패했습니다' },
                { status: response.status }
            )
        }

        const data = await response.json()
        console.log('Email verification successful')

        return NextResponse.json({
            success: true,
            message: '이메일 인증이 완료되었습니다',
            data: data.data,
        })
    } catch (error) {
        console.error('Email verification API error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '서버 오류가 발생했습니다' },
            { status: 500 }
        )
    }
}