import { NextRequest, NextResponse } from 'next/server'
import { fetchWithRefresh } from '@/lib/fetch-with-refresh'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const authHeader = req.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const response = await fetchWithRefresh(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/outfits/feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      const data = await response.json()
      return NextResponse.json(
        { error: data.message || '피드백 전송에 실패했습니다' },
        { status: response.status }
      )
    }

    return NextResponse.json(await response.json())
  } catch (error) {
    console.error('피드백 처리 중 오류 발생:', error)
    return NextResponse.json(
      { error: '서버 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}