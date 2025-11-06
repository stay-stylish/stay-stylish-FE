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

        console.log('[OAuth Exchange] ===== 시작 =====')
        console.log('[OAuth Exchange] 코드:', code)
        console.log('[OAuth Exchange] 백엔드 URL:', BACKEND_URL)

        if (!code) {
            console.error('[OAuth Exchange] 코드 없음!')
            return NextResponse.json(
                { error: '인증 코드가 필요합니다' },
                { status: 400 }
            )
        }

        // 백엔드에 일회용 코드 전송
        const backendUrl = `${BACKEND_URL}/api/v1/auth/oauth/exchange?code=${encodeURIComponent(code)}`
        console.log('[OAuth Exchange] 백엔드 호출:', backendUrl)

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        console.log('[OAuth Exchange] 응답 상태:', response.status)
        console.log('[OAuth Exchange] 응답 헤더:', Object.fromEntries(response.headers.entries()))

        const responseText = await response.text()
        console.log('[OAuth Exchange] 응답 본문 (처음 500자):', responseText.substring(0, 500))

        if (!response.ok) {
            console.error('[OAuth Exchange] ❌ 백엔드 에러!')
            console.error('[OAuth Exchange] 상태 코드:', response.status)
            console.error('[OAuth Exchange] 응답 전체:', responseText)

            let errorData: BackendErrorResponse = {}
            try {
                errorData = JSON.parse(responseText)
                console.error('[OAuth Exchange] 파싱된 에러:', errorData)
            } catch (e) {
                console.error('[OAuth Exchange] JSON 파싱 실패')
            }

            return NextResponse.json(
                {
                    error: errorData.message || errorData.error || responseText || '토큰 교환에 실패했습니다',
                    details: {
                        status: response.status,
                        backendUrl,
                        rawResponse: responseText.substring(0, 500),
                        originalError: errorData
                    }
                },
                { status: response.status || 500 }
            )
        }

        if (!responseText) {
            console.error('[OAuth Exchange] 빈 응답!')
            return NextResponse.json(
                { error: '백엔드에서 빈 응답을 받았습니다' },
                { status: 500 }
            )
        }

        let data: any
        try {
            data = JSON.parse(responseText)
            console.log('[OAuth Exchange] 파싱된 데이터:', JSON.stringify(data).substring(0, 300))
        } catch (e) {
            console.error('[OAuth Exchange] JSON 파싱 실패:', e)
            return NextResponse.json(
                { error: '백엔드 응답 파싱 실패' },
                { status: 500 }
            )
        }

        // 응답 데이터 검증
        console.log('[OAuth Exchange] data.data:', data.data)
        console.log('[OAuth Exchange] 토큰 확인:')
        console.log('[OAuth Exchange]   - accessToken:', data.data?.accessToken ? '있음' : '없음')
        console.log('[OAuth Exchange]   - refreshToken:', data.data?.refreshToken ? '있음' : '없음')
        console.log('[OAuth Exchange]   - isNewUser:', data.data?.isNewUser)

        if (!data.data?.accessToken || !data.data?.refreshToken) {
            console.error('[OAuth Exchange] ❌ 토큰 없음!')
            console.error('[OAuth Exchange] data:', data)
            return NextResponse.json(
                { error: '토큰을 받지 못했습니다' },
                { status: 500 }
            )
        }

        console.log('[OAuth Exchange] ✅ 성공!')
        console.log('[OAuth Exchange] ===== 완료 =====')

        return NextResponse.json({
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
            isNewUser: data.data.isNewUser || false,
        })
    } catch (error) {
        console.error('[OAuth Exchange] ❌ 예외 발생!')
        console.error('[OAuth Exchange] 에러 타입:', error instanceof Error ? 'Error' : typeof error)
        console.error('[OAuth Exchange] 에러 메시지:', error instanceof Error ? error.message : String(error))
        console.error('[OAuth Exchange] 에러 스택:', error instanceof Error ? error.stack : 'N/A')

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : '서버 오류',
                errorType: error instanceof Error ? 'Error' : typeof error,
                errorDetails: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}