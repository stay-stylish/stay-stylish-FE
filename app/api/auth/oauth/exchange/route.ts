import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

interface BackendErrorResponse {
    message?: string
    error?: string
    [key: string]: any
}

export async function POST(request: NextRequest) {
    try {
        const { code } = await request.json()

        console.log('[OAuth Exchange] 코드:', code)
        console.log('[OAuth Exchange] 백엔드 URL:', BACKEND_URL)

        if (!code) {
            return NextResponse.json(
                { error: '인증 코드가 필요합니다' },
                { status: 400 }
            )
        }

        // 백엔드에 일회용 코드 전송
        const backendUrl = `${BACKEND_URL}/api/v1/auth/oauth/exchange?code=${code}`
        console.log('[OAuth Exchange] 백엔드 호출:', backendUrl)

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        console.log('[OAuth Exchange] 응답 상태:', response.status)

        const responseText = await response.text()

        if (!response.ok) {
            console.error('[OAuth Exchange] 백엔드 에러:', responseText)
            let errorData: BackendErrorResponse = {}
            try {
                errorData = JSON.parse(responseText)
            } catch (e) {
                // JSON 파싱 실패
            }

            return NextResponse.json(
                {
                    error: errorData.message || errorData.error || responseText || '토큰 교환에 실패했습니다',
                    details: {
                        status: response.status,
                        backendUrl,
                        rawResponse: responseText.substring(0, 200)
                    }
                },
                { status: response.status }
            )
        }

        if (!responseText) {
            return NextResponse.json(
                { error: '백엔드에서 빈 응답을 받았습니다' },
                { status: 500 }
            )
        }

        let data: any
        try {
            data = JSON.parse(responseText)
        } catch (e) {
            console.error('[OAuth Exchange] JSON 파싱 실패')
            return NextResponse.json(
                { error: '백엔드 응답 파싱 실패' },
                { status: 500 }
            )
        }

        if (!data.data?.accessToken || !data.data?.refreshToken) {
            console.error('[OAuth Exchange] 토큰 없음:', data.data)
            return NextResponse.json(
                { error: '토큰을 받지 못했습니다' },
                { status: 500 }
            )
        }

        console.log('[OAuth Exchange] 성공')
        return NextResponse.json({
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
            isNewUser: data.data.isNewUser || false,
        })
    } catch (error) {
        console.error('[OAuth Exchange] 예외:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '서버 오류' },
            { status: 500 }
        )
    }
}