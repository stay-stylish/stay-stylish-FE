import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export async function POST(request: NextRequest) {
    try {
        const { code } = await request.json()

        if (!code) {
            return NextResponse.json(
                { error: '인증 코드가 필요합니다' },
                { status: 400 }
            )
        }

        console.log('[OAuth Exchange] 일회용 코드:', code)

        // 백엔드에 일회용 코드 전송
        const response = await fetch(
            `${BACKEND_URL}/api/v1/auth/oauth/exchange?code=${code}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )

        console.log('[OAuth Exchange] 백엔드 응답 상태:', response.status)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('[OAuth Exchange] 백엔드 오류:', errorData)
            return NextResponse.json(
                { error: errorData.message || '토큰 교환에 실패했습니다' },
                { status: response.status }
            )
        }

        const data = await response.json()
        console.log('[OAuth Exchange] 토큰 교환 성공')

        // 백엔드 응답: { success, message, data: { accessToken, refreshToken, isNewUser }, timestamp }
        return NextResponse.json({
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
            isNewUser: data.data.isNewUser,
        })
    } catch (error) {
        console.error('[OAuth Exchange] 오류:', error)
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다' },
            { status: 500 }
        )
    }
}