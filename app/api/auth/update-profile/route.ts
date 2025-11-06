import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, preferredStyle, gender } = body;

    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
      );
    }

    console.log('[Update Profile] 프로필 업데이트 요청:', { nickname, preferredStyle, gender });

    const genderMap: { [key: string]: "MALE" | "FEMALE" } = {
      "남성": "MALE",
      "여성": "FEMALE",
      "male": "MALE",
      "female": "FEMALE",
      "MALE": "MALE",
      "FEMALE": "FEMALE",
      "m": "MALE",
      "f": "FEMALE",
      "M": "MALE",
      "F": "FEMALE",
    };

    // Gender 값 변환 (없으면 기본값 MALE)
    const genderValue = gender ? (genderMap[gender.toString()] || "MALE") : "MALE";

    console.log('[Update Profile] Gender 변환:', gender, '→', genderValue);

    // Call backend to update profile
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/users/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nickname,
            stylePreference: preferredStyle,
            gender: genderValue,
          }),
        }
    );

    console.log('[Update Profile] 백엔드 응답 상태:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Update Profile] 백엔드 오류:', errorData);
      return NextResponse.json(
          { error: errorData.message || "Failed to update profile" },
          { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Update Profile] 프로필 업데이트 성공');

    // Return updated user data
    const updatedUser = data.data;

    return NextResponse.json({
      id: updatedUser.id.toString(),
      email: updatedUser.email,
      nickname: updatedUser.nickname,
      preferredStyle: updatedUser.stylePreference || '',
      gender: updatedUser.gender, // 백엔드 값 그대로 전달 (MALE/FEMALE)
    });
  } catch (error) {
    console.error("[Update Profile] 예외 발생:", error);
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    );
  }
}