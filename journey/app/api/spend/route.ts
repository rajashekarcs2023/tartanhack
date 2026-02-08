import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, category, label, safeToSpend, income, commitments, goalAmount, savedAmount, currentTile, totalTiles, dayStreak, bankData } = body;

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // If we have an API key, use Claude to evaluate the spending decision
    if (apiKey) {
      const prompt = `You are a financial advisor inside a JRPG game. The hero is on tile ${currentTile} of ${totalTiles} on their journey to their savings goal.

Player stats:
- Monthly income: $${income}
- Monthly commitments: $${commitments}
- Safe to spend this month: $${safeToSpend}
- Savings goal: $${goalAmount ?? 5000} (saved so far: $${savedAmount ?? 0})
- Day streak (days without unnecessary spending): ${dayStreak}
- Current progress: tile ${currentTile}/${totalTiles}

The player wants to spend $${amt} on "${label}" (category: ${category}).
${bankData ? `\nBank account context: ${bankData}` : ""}

Evaluate this spending decision. Respond in EXACTLY this JSON format (no markdown, no code fences):
{
  "verdict": "SAFE" or "DETOUR" or "WRONG_TURN",
  "tileDelta": number (0 for safe, -1 for detour, -2 to -3 for wrong turn),
  "daysDelta": number (estimated days this delays the goal),
  "reason": "A short 1-2 sentence JRPG-flavored explanation",
  "streakBroken": boolean (true if this is impulse/unnecessary spending)
}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text ?? "";
        try {
          const result = JSON.parse(text);
          return NextResponse.json({
            verdict: result.verdict ?? "SAFE",
            tileDelta: result.tileDelta ?? 0,
            daysDelta: result.daysDelta ?? 0,
            reason: result.reason ?? "The guide ponders your decision...",
            streakBroken: result.streakBroken ?? false,
          });
        } catch {
          // If AI response isn't valid JSON, fall through to local logic
        }
      }
    }

    // Fallback: local decision logic
    let verdict: "SAFE" | "DETOUR" | "WRONG_TURN" = "SAFE";
    let tileDelta = 0;
    let daysDelta = 0;
    let reason = "";
    let streakBroken = false;

    const sts = Number(safeToSpend) || 0;

    const goal = Number(goalAmount) || 5000;
    const pctOfGoal = goal > 0 ? amt / goal : 0;

    if (pctOfGoal > 0.4 || amt > sts * 0.15 || amt > 200) {
      verdict = "WRONG_TURN";
      tileDelta = -3;
      daysDelta = Math.ceil(amt / 15);
      reason = `This $${amt} purchase is ${Math.round(pctOfGoal * 100)}% of your $${goal} goal! A dangerous path — the demons of debt grow stronger!`;
      streakBroken = true;
    } else if (pctOfGoal > 0.15 || amt > sts * 0.05 || amt > 50) {
      verdict = "DETOUR";
      tileDelta = -1;
      daysDelta = Math.ceil(amt / 30);
      reason = `This $${amt} spend is ${Math.round(pctOfGoal * 100)}% of your goal. A detour that delays you ~${daysDelta} days, traveler.`;
      streakBroken = category === "shopping" || category === "food";
    } else {
      verdict = "SAFE";
      tileDelta = 0;
      daysDelta = Math.ceil(amt / 50);
      reason = `Affordable! Only ${Math.round(pctOfGoal * 100)}% of your goal. Minor delay of ~${daysDelta} days. Path stays clear!`;
      streakBroken = false;
    }

    return NextResponse.json({ verdict, tileDelta, daysDelta, reason, streakBroken });
  } catch (err) {
    console.error("Spend API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
