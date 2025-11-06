import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

/**
 * DELETE /api/v1/users/me
 * 회원탈퇴 API
 */
export async function DELETE(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')

        if (!authHeader) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        console.log('[Delete User] 회원탈퇴 요청 시작')

        // 백엔드 회원탈퇴 API 호출
        const response = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
            method: 'DELETE',
            headers: {
                'Authorization': authHeader,
            },
        })

        console.log('[Delete User] 백엔드 응답 상태:', response.status)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('[Delete User] 백엔드 오류:', errorData)
            return NextResponse.json(
                { error: errorData.message || '회원탈퇴 실패' },
                { status: response.status }
            )
        }

        const data = await response.json()
        console.log('[Delete User] 회원탈퇴 성공')

        return NextResponse.json({
            success: true,
            message: data.message || '회원탈퇴가 완료되었습니다'
        })
    } catch (error) {
        console.error('[Delete User] 예외 발생:', error)
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/v1/users/me
 * 사용자 정보 조회
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')

        if (!authHeader) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        console.log('[Get User] 사용자 정보 조회 시작')

        const response = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
            headers: {
                'Authorization': authHeader,
            },
        })

        console.log('[Get User] 백엔드 응답 상태:', response.status)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('[Get User] 백엔드 오류:', errorData)
            return NextResponse.json(
                { error: errorData.message || '사용자 정보 조회 실패' },
                { status: response.status }
            )
        }

        const data = await response.json()
        const user = data.data

        console.log('[Get User] 사용자 정보 조회 성공:', user.email)

        return NextResponse.json({
            id: user.id.toString(),
            email: user.email,
            nickname: user.nickname,
            preferredStyle: user.stylePreference || '',
            gender: user.gender || '', // MALE/FEMALE 그대로
        })
    } catch (error) {
        console.error('[Get User] 예외 발생:', error)
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/v1/users/me
 * 사용자 정보 수정
 */
export async function PUT(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')

        if (!authHeader) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { nickname, stylePreference, gender } = body

        console.log('[Update User] 사용자 정보 수정 시작:', { nickname, stylePreference, gender })

        const genderMap: { [key: string]: "MALE" | "FEMALE" } = {
            "남성": "MALE",
            "여성": "FEMALE",
            "male": "MALE",
            "female": "FEMALE",
            "MALE": "MALE",
            "FEMALE": "FEMALE",
        };

        const genderValue = gender ? (genderMap[gender.toString()] || "MALE") : "MALE";

        console.log('[Update User] Gender 변환:', gender, '→', genderValue)

        const response = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
            method: 'PUT',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nickname,
                stylePreference,
                gender: genderValue,
            }),
        })

        console.log('[Update User] 백엔드 응답 상태:', response.status)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('[Update User] 백엔드 오류:', errorData)
            return NextResponse.json(
                { error: errorData.message || '정보 수정 실패' },
                { status: response.status }
            )
        }

        const data = await response.json()
        const updatedUser = data.data

        console.log('[Update User] 정보 수정 성공')

        return NextResponse.json({
            id: updatedUser.id.toString(),
            email: updatedUser.email,
            nickname: updatedUser.nickname,
            preferredStyle: updatedUser.stylePreference || '',
            gender: updatedUser.gender, // MALE/FEMALE 그대로
        })
    } catch (error) {
        console.error('[Update User] 예외 발생:', error)
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다' },
            { status: 500 }
        )
    }
}