import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export async function POST(request: NextRequest) {
    try {
        const { code } = await request.json()

        if (!code) {
            console.error('[OAuth Exchange] 코드가 없습니다')
            return NextResponse.json(
                { error: '인증 코드가 필요합니다' },
                { status: 400 }
            )
        }

        console.log('[OAuth Exchange] 일회용 코드 수신:', code)
        console.log('[OAuth Exchange] 백엔드 URL:', BACKEND_URL)

        // 백엔드에 일회용 코드 전송
        const backendUrl = `${BACKEND_URL}/api/v1/auth/oauth/exchange?code=${code}`
        console.log('[OAuth Exchange] 호출 URL:', backendUrl)

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        console.log('[OAuth Exchange] 백엔드 응답 상태:', response.status)

        if (!response.ok) {
            const errorText = await response.text()
            console.error('[OAuth Exchange] 백엔드 오류:', errorText)

            let errorMessage = '토큰 교환에 실패했습니다'
            try {
                const errorData = JSON.parse(errorText)
                errorMessage = errorData.message || errorMessage
            } catch (e) {
                if (errorText) errorMessage = errorText
            }

            return NextResponse.json(
                { error: errorMessage },
                { status: response.status }
            )
        }

        const responseText = await response.text()
        console.log('[OAuth Exchange] 백엔드 응답 본문:', responseText)

        if (!responseText) {
            console.error('[OAuth Exchange] 빈 응답')
            return NextResponse.json(
                { error: '서버에서 빈 응답을 받았습니다' },
                { status: 500 }
            )
        }

        const data = JSON.parse(responseText)
        console.log('[OAuth Exchange] 파싱된 데이터:', {
            success: data.success,
            hasData: !!data.data,
            hasAccessToken: !!data.data?.accessToken,
            hasRefreshToken: !!data.data?.refreshToken,
        })

        // 백엔드 응답: { success, message, data: { accessToken, refreshToken, isNewUser }, timestamp }
        if (!data.data || !data.data.accessToken || !data.data.refreshToken) {
            console.error('[OAuth Exchange] 토큰이 응답에 없습니다:', data)
            return NextResponse.json(
                { error: '토큰을 받지 못했습니다' },
                { status: 500 }
            )
        }

        console.log('[OAuth Exchange] 토큰 교환 성공')

        return NextResponse.json({
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
            isNewUser: data.data.isNewUser || false,
        })
    } catch (error) {
        console.error('[OAuth Exchange] 예외 발생:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '서버 오류가 발생했습니다' },
            { status: 500 }
        )
    }
}