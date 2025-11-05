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

    console.log('Updating profile:', { nickname, preferredStyle, gender });

    // Map frontend gender values to backend ENUM
    let genderValue: string;
    if (gender === "남성" || gender === "MALE") {
      genderValue = "MALE";
    } else if (gender === "여성" || gender === "FEMALE") {
      genderValue = "FEMALE";
    } else {
      genderValue = "MALE"; // 기본값
    }

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

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to update profile" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Profile updated:', data);

    // Return updated user data
    const updatedUser = data.data;
    
    // Map backend gender ENUM back to Korean
    const displayGender = updatedUser.gender === "MALE" ? "남성" : "여성";

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      nickname: updatedUser.nickname,
      preferredStyle: updatedUser.stylePreference,
      gender: displayGender,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}