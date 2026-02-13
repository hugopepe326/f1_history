import { NextResponse } from "next/server";

const API_BASE = "https://f1api.dev/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const round = searchParams.get("round");
  const type = searchParams.get("type") || "race";

  try {
    let endpoint = "";

    if (!year) {
      // Get current season
      endpoint = "/current";
    } else if (year && !round) {
      // Get races for a specific year
      endpoint = `/${year}`;
    } else {
      // Get specific race results
      switch (type) {
        case "qualifying":
          endpoint = `/${year}/${round}/qualy`;
          break;
        case "sprint":
          endpoint = `/${year}/${round}/sprint/race`;
          break;
        default:
          endpoint = `/${year}/${round}/${type}`;
      }
    }

    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("F1 API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
