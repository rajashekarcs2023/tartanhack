import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { demonName, demonHp, demonMaxHp, heroLevel, dayStreak, action } = body;

    if (action === "attack") {
      // Damage scales with level and day streak (saving consistently = stronger attacks)
      const baseDmg = 20 + (heroLevel ?? 1) * 8;
      const streakBonus = Math.min(dayStreak ?? 0, 15) * 3;
      const critChance = Math.min(0.3, (dayStreak ?? 0) * 0.02 + (heroLevel ?? 1) * 0.03);
      const isCrit = Math.random() < critChance;
      const variance = Math.floor(Math.random() * 15);
      const rawDmg = baseDmg + streakBonus + variance;
      const heroDmg = isCrit ? Math.floor(rawDmg * 1.8) : rawDmg;

      // Demon counter-attack (weaker if demon is low HP)
      const demonHpRatio = (demonHp ?? 100) / (demonMaxHp ?? 100);
      const demonBaseDmg = 6 + Math.floor(demonHpRatio * 10);
      const demonVariance = Math.floor(Math.random() * 6);
      const demonDmg = demonBaseDmg + demonVariance;

      const newDemonHp = Math.max(0, (demonHp ?? 100) - heroDmg);
      const defeated = newDemonHp <= 0;

      // Try AI for battle message
      let message = "";
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (apiKey) {
        try {
          const prompt = defeated
            ? `You are narrating a JRPG battle. The hero (Level ${heroLevel}, ${dayStreak}-day saving streak) just defeated "${demonName}" (a financial bad-habit demon) with a ${isCrit ? "CRITICAL " : ""}${heroDmg} damage hit! Write ONE dramatic victory sentence in JRPG style. Keep it under 20 words. No quotes.`
            : `You are narrating a JRPG battle. Hero (Lv${heroLevel}) dealt ${heroDmg}${isCrit ? " CRITICAL" : ""} DMG to "${demonName}". The demon struck back for ${demonDmg} DMG. Write ONE dramatic battle sentence in JRPG style. Under 20 words. No quotes.`;
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
            body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 60, messages: [{ role: "user", content: prompt }] }),
          });
          if (res.ok) {
            const data = await res.json();
            message = data.content?.[0]?.text ?? "";
          }
        } catch { /* use fallback */ }
      }

      // Fallback messages
      if (!message) {
        if (defeated) {
          const msgs = [
            `${isCrit ? "CRITICAL HIT! " : ""}Your blade of discipline strikes true! ${demonName} crumbles!`,
            `A mighty blow fueled by ${dayStreak} days of saving! ${demonName} is vanquished!`,
            `${demonName} dissolves! Your financial willpower proved too strong!`,
            `${isCrit ? "DEVASTATING " : ""}${heroDmg} DMG! ${demonName} shatters like a bad spending habit!`,
          ];
          message = msgs[Math.floor(Math.random() * msgs.length)];
        } else {
          const msgs = [
            `${isCrit ? "CRITICAL! " : ""}You slash for ${heroDmg} DMG! ${demonName} retaliates for ${demonDmg}!`,
            `Your ${dayStreak}-day streak powers a ${heroDmg} DMG strike! ${demonName} bites back for ${demonDmg}!`,
            `${heroDmg} damage${isCrit ? " (CRIT!)" : ""}! ${demonName} claws back for ${demonDmg}! Keep fighting!`,
          ];
          message = msgs[Math.floor(Math.random() * msgs.length)];
        }
      }

      return NextResponse.json({
        heroDmg,
        demonDmg,
        newDemonHp,
        defeated,
        isCrit,
        message,
        xpGained: defeated ? 50 + (heroLevel ?? 1) * 15 : 0,
      });
    }

    if (action === "flee") {
      return NextResponse.json({
        success: true,
        message: `You retreat from ${demonName}. Save more to power up and face it again!`,
        tilePenalty: 0,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Battle API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
