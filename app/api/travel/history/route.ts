// stay-stylish/stay-stylish-fe/stay-stylish-FE-c14b4b1a4b8e4c05090a39f123785ddbf08fe1b0/app/api/travel/history/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "0";
    const size = searchParams.get("size") || "5";

    console.log('Travel history API called with page:', page, 'size:', size);

    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    console.log('Token received:', token ? token.substring(0, 20) + '...' : 'null');

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Call backend to get saved travel recommendations
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/travel-outfits/recommendations?page=${page}&size=${size}`;
    console.log('Calling backend:', backendUrl);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Backend response status:', response.status);

    // [수정] response.ok 확인을 .json() 호출 전에 수행
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      
      let errorMessage = "Failed to fetch travel history";
      try {
        // 백엔드 에러 응답이 JSON 형식일 수 있음 (ApiResponse)
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // JSON 파싱 실패 시, errorText가 있다면 그것을 에러 메시지로 사용
        if(errorText) errorMessage = errorText;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // [수정] 비어있는 body에 대한 .json() 호출 방지
    const responseText = await response.text();
    if (!responseText) {
      console.error("Empty response body from backend");
      return NextResponse.json(
        { error: "Internal server error: Empty response" },
        { status: 500 }
      );
    }

    const data = JSON.parse(responseText); // ApiResponse<PageResponse<...>>
    console.log('Backend data:', JSON.stringify(data).substring(0, 200));
    
    // [수정] 백엔드 응답 구조(ApiResponse)에 맞게 data.data를 반환
    return NextResponse.json(data.data); // PageResponse<...> 객체 반환

  } catch (error) {
    console.error("Error fetching travel history:", error);
    
    // [수정] JSON 파싱 오류(SyntaxError)를 명시적으로 처리
    if (error instanceof SyntaxError) {
      console.error("Failed to parse backend JSON response");
      return NextResponse.json(
        { error: "Internal server error: Invalid JSON response" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}