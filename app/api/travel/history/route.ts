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

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch travel history" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend data:', JSON.stringify(data).substring(0, 200));
    return NextResponse.json(data.data);
  } catch (error) {
    console.error("Error fetching travel history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
