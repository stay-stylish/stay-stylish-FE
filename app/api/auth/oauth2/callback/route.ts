import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken || !refreshToken) {
        return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
    }

    // 토큰을 클라이언트로 전달 (쿠키 또는 리다이렉트 파라미터)
    const response = NextResponse.redirect(new URL('/home', request.url));

    // 또는 로컬스토리지에 저장하도록 클라이언트 페이지로 리다이렉트
    return NextResponse.redirect(
        new URL(`/auth-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`, request.url)
    );
}