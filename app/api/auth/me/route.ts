import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')

        if (!authHeader) {
            console.error('[Me] Authorization 헤더가 없습니다')
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        console.log('[Me] 토큰으로 사용자 정보 조회 시작')

        const response = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
            headers: {
                'Authorization': authHeader,
            },
        })

        console.log('[Me] 백엔드 응답 상태:', response.status)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('[Me] 백엔드 오류:', errorData)
            return NextResponse.json(
                { error: errorData.message || '사용자 정보 조회 실패' },
                { status: response.status }
            )
        }

        const data = await response.json()
        const user = data.data

        console.log('[Me] 사용자 정보 조회 성공:', user.email)

        return NextResponse.json({
            id: user.id.toString(),
            email: user.email,
            nickname: user.nickname,
            preferredStyle: user.stylePreference || '',
            gender: user.gender || '',
        })
    } catch (error) {
        console.error('[Me] 예외 발생:', error)
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다' },
            { status: 500 }
        )
    }
}