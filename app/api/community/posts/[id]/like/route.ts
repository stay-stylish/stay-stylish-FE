import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
          { error: '인증이 필요합니다' },
          { status: 401 }
      );
    }

    const postId = params.id;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    console.log(`[Like API] 좋아요 토글 - postId: ${postId}`);

    const response = await fetch(`${backendUrl}/api/v1/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[Like API] 오류 - status: ${response.status}`, errorData);
      return NextResponse.json(
          { error: errorData.message || '좋아요 처리에 실패했습니다' },
          { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Like API] 성공:', data);

    // 백엔드 ApiResponse 형태: { success, message, data: LikeResponse }
    // LikeResponse: { postId, liked, likeCount }
    return NextResponse.json(data);

  } catch (error) {
    console.error('[Like API] 예외 발생:', error);
    return NextResponse.json(
        { error: '좋아요 처리 중 오류가 발생했습니다' },
        { status: 500 }
    );
  }
}