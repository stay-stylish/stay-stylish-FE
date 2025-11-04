// stay-stylish/stay-stylish-fe/stay-stylish-FE-c14b4b1a4b8e4c05090a39f123785ddbf08fe1b0/app/api/travel/history/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const travelId = params.id;

    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Call backend to get detailed travel recommendation
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/travel-outfits/recommendations/${travelId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // [수정] response.ok 확인을 .json() 호출 전에 수행
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to fetch travel detail";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        if (errorText) {
          errorMessage = errorText;
        }
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }
    
    // [수정] 200 OK 응답이지만 body가 비어있는 경우를 대비
    const responseText = await response.text();
    if (!responseText) {
      console.error("Empty response body from backend");
      return NextResponse.json(
        { error: "Internal server error: Empty response" },
        { status: 500 }
      );
    }

    const data = JSON.parse(responseText); // ApiResponse<TravelOutfitResponse>
    const travelData = data.data; // TravelOutfitResponse

    // 프론트엔드(page.tsx)의 TravelStylingData 인터페이스에 맞게 필드명 변경
    if (travelData) {
      // aiOutfitJson -> aiOutfit
      const frontendData = {
        ...travelData,
        aiOutfit: travelData.aiOutfitJson // 필드명 변경
      };
      delete (frontendData as any).aiOutfitJson; // 기존 필드 삭제

      return NextResponse.json(frontendData);
    }

    return NextResponse.json(travelData); // data.data가 null인 경우 null 반환
    
  } catch (error) {
    console.error("Error fetching travel detail:", error);

    // [수정] JSON.parse(responseText) 실패 시(SyntaxError) 별도 처리
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