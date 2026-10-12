import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({
    success: true,
    ticketId: id,
    status: "open",
    message: "Vé hỏi đã được hoãn và giữ ở trạng thái open.",
  });
}
