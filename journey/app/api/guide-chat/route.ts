import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, currentTile, totalTiles, dayStreak, savedAmount, goalAmount, goalLabel, commitments, level, goldCoins, bankData } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const savedPct = goalAmount > 0 ? Math.round((savedAmount / goalAmount) * 100) : 0;

    if (apiKey) {
      const systemPrompt = `You are the Guide Fairy in a JRPG financial adventure game. You speak in a warm, encouraging, slightly mystical JRPG style. You give practical financial advice wrapped in fantasy metaphor.

Player stats:
- Level: ${level ?? 1}, Gold: ${goldCoins ?? 0}
- Journey: tile ${currentTile}/${totalTiles}
- Saving streak: ${dayStreak} days
- Goal: "${goalLabel ?? "Savings Goal"}" — $${savedAmount ?? 0} / $${goalAmount ?? 5000} (${savedPct}%)
- Active commitments: ${commitments ?? "None set"}
${bankData ? `\nBank account data:\n${bankData}` : "\nNo bank account linked yet."}

You are knowledgeable about investing and personal finance. If asked about investments, provide practical beginner-friendly advice about:
- Index funds (S&P 500, total market) as the "enchanted shields" of wealth building
- High-yield savings accounts as "gold vaults" for emergency funds
- Roth IRA as a "legendary quest reward" for tax-free growth
- Dollar-cost averaging as "steady sword training"
- The importance of emergency fund (3-6 months expenses) before investing
- Avoiding individual stock picking for beginners ("fighting dragons alone")
- Compound interest as "experience points that multiply over time"

Keep responses under 4 sentences. Be specific to their situation. Use JRPG language (quests, battles, demons of debt, etc). If bank data is available, reference their actual spending patterns. Always encourage saving first, then investing.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          system: systemPrompt,
          messages: [{ role: "user", content: message }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text ?? "";
        if (text) {
          return NextResponse.json({ reply: text });
        }
      }
    }

    // Fallback local replies
    const lower = message.toLowerCase();
    let reply: string;

    if (lower.includes("how") && lower.includes("doing")) {
      reply = `You've saved $${savedAmount} of $${goalAmount} (${savedPct}%). You're on tile ${currentTile} of ${totalTiles}. ${dayStreak > 3 ? "Your streak gives you great power!" : "Build your streak to grow stronger!"}`;
    } else if (lower.includes("focus") || lower.includes("what should")) {
      reply = `Focus on maintaining your ${dayStreak}-day saving streak! Each day without unnecessary spending powers up your attacks against the demons ahead. Stay on the golden path, hero!`;
    } else if (lower.includes("route") || lower.includes("explain") || lower.includes("map")) {
      reply = `Your route has ${totalTiles} tiles. You're at tile ${currentTile}. Saving moves you forward; spending pushes you back. Demons block key tiles — defeat them by maintaining your saving streak!`;
    } else if (lower.includes("demon") || lower.includes("battle") || lower.includes("fight")) {
      reply = `Demons appear at key tiles on your journey. Each day you save, you gain attack power. When you reach a demon's tile, you can battle it! Defeating demons earns tiles, gold, and XP. Your ${dayStreak}-day streak gives +${Math.min(dayStreak, 10) * 3} bonus damage!`;
    } else if (lower.includes("invest") || lower.includes("stock") || lower.includes("fund") || lower.includes("portfolio") || lower.includes("roth") || lower.includes("ira")) {
      if (savedPct < 50) {
        reply = `Before venturing into the Investment Realm, secure your Gold Vault first! You've saved ${savedPct}% of your goal. Once you hit at least 50%, consider a High-Yield Savings Account as your first enchanted shield. The S&P 500 index fund awaits brave heroes who've built their emergency fund!`;
      } else {
        reply = `Hero, you're ${savedPct}% to your goal — strong enough to explore the Investment Realm! Start with a Roth IRA (legendary tax-free loot!) and put it in a total market index fund. Dollar-cost averaging is like steady sword training — invest the same amount regularly. Compound interest is XP that multiplies over time!`;
      }
    } else if (lower.includes("eta") || lower.includes("when") || lower.includes("goal")) {
      const tilesLeft = totalTiles - currentTile;
      const avgRate = Math.max(0.15, (dayStreak > 0 ? 0.3 : 0.1));
      const daysEst = Math.ceil(tilesLeft / avgRate);
      reply = `At your current pace, you'll reach ${goalLabel ?? "your goal"} in about ${daysEst} days. Save consistently to speed up! Every day of your streak makes the journey faster.`;
    } else {
      reply = `You're ${savedPct}% toward ${goalLabel ?? "your goal"}. Tile ${currentTile}/${totalTiles}. ${dayStreak >= 5 ? "Your saving streak burns bright — keep the flame alive!" : "Stay on the path, brave traveler! Every coin saved is a step forward!"}`;
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Guide chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
