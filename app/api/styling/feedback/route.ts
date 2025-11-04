import { NextRequest, NextResponse } from "next/server";
import { fetchWithRefresh } from "@/lib/fetch-with-refresh";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { categoryName, status, latitude, longitude } = body;

    if (!categoryName || !status || !latitude || !longitude) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      );
    }

    const response = await fetchWithRefresh(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/outfits/feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          categoryName,
          status,
          latitude,
          longitude
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || '피드백 전송에 실패했습니다' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('피드백 처리 중 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}