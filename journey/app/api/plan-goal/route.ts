import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, bankData } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const todayStr = new Date().toISOString().split("T")[0];

    if (apiKey) {
      const prompt = `You are a financial planning AI inside a JRPG game. The user just told you their financial goal in natural language. Parse it into a structured plan.

Today's date is: ${todayStr}

User said: "${message}"

${bankData ? `Their bank data: ${bankData}` : "No bank data available."}

Based on what they said, create a complete financial journey plan. IMPORTANT: The "deadline" must be a real future date calculated from today (${todayStr}). If they say "in 10 days", add 10 days to today. If they say "3 months", add 3 months. If they say "by summer", use mid-June of the current or next year. If no timeframe is mentioned, default to 6 months from today. NEVER use a hardcoded date.

Respond in EXACTLY this JSON format (no markdown, no code fences, just raw JSON):
{
  "goalLabel": "short goal name, e.g. Emergency Fund, New Car, Vacation",
  "goalAmount": number (target savings amount in dollars, infer from context or use sensible default),
  "deadline": "YYYY-MM-DD format, calculated from today ${todayStr}",
  "monthlyIncome": number (if mentioned, otherwise 3200),
  "safetyBuffer": number (recommended safety buffer, usually 200-500),
  "commitments": [{"label": "string", "amount": number}],
  "savingsPlan": "2-3 sentence JRPG-flavored description of the savings strategy",
  "dailySavingsTarget": number (how much to save per day),
  "tipsCount": number (1-3),
  "tips": ["actionable tip 1", "tip 2"],
  "motivation": "One motivating JRPG sentence about their quest"
}

Be smart about inferring amounts. If they say "save for a car" assume ~$15000. "Emergency fund" = ~$5000. "Vacation" = ~$3000. If they mention a specific amount, use it. Infer commitments from bank data if available, otherwise use reasonable defaults (rent $1200, utilities $150, subscriptions $50). Always respond with valid JSON only.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text ?? "";
        try {
          const plan = JSON.parse(text);
          return NextResponse.json({ success: true, plan });
        } catch {
          // Try to extract JSON from response
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            const plan = JSON.parse(match[0]);
            return NextResponse.json({ success: true, plan });
          }
          throw new Error("Could not parse AI response");
        }
      }
    }

    // Fallback: basic parsing without AI
    const lower = message.toLowerCase();
    let goalLabel = "Savings Goal";
    let goalAmount = 5000;
    let deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 6); // default 6 months

    if (lower.includes("car")) { goalLabel = "New Car Fund"; goalAmount = 15000; }
    else if (lower.includes("emergency")) { goalLabel = "Emergency Fund"; goalAmount = 5000; }
    else if (lower.includes("vacation") || lower.includes("trip")) { goalLabel = "Vacation Fund"; goalAmount = 3000; }
    else if (lower.includes("house") || lower.includes("apartment") || lower.includes("rent")) { goalLabel = "Housing Fund"; goalAmount = 10000; }
    else if (lower.includes("laptop") || lower.includes("computer")) { goalLabel = "Tech Upgrade"; goalAmount = 2000; }
    else if (lower.includes("debt")) { goalLabel = "Debt Slayer"; goalAmount = 8000; }
    else if (lower.includes("wedding")) { goalLabel = "Wedding Fund"; goalAmount = 20000; }

    // Try to extract dollar amounts
    const amtMatch = message.match(/\$?([\d,]+)/);
    if (amtMatch) goalAmount = parseInt(amtMatch[1].replace(",", ""));

    // Dynamic date parsing: days, weeks, months, years
    const dayMatch = lower.match(/(\d+)\s*day/);
    const weekMatch = lower.match(/(\d+)\s*week/);
    const monthMatch = lower.match(/(\d+)\s*month/);
    const yearMatch = lower.match(/(\d+)\s*year/);
    if (dayMatch) {
      deadline = new Date();
      deadline.setDate(deadline.getDate() + parseInt(dayMatch[1]));
    } else if (weekMatch) {
      deadline = new Date();
      deadline.setDate(deadline.getDate() + parseInt(weekMatch[1]) * 7);
    } else if (monthMatch) {
      deadline = new Date();
      deadline.setMonth(deadline.getMonth() + parseInt(monthMatch[1]));
    } else if (yearMatch) {
      deadline = new Date();
      deadline.setFullYear(deadline.getFullYear() + parseInt(yearMatch[1]));
    } else if (lower.includes("next month")) {
      deadline = new Date();
      deadline.setMonth(deadline.getMonth() + 1);
    } else if (lower.includes("next year")) {
      deadline = new Date();
      deadline.setFullYear(deadline.getFullYear() + 1);
    }

    const daysUntilDeadline = Math.max(1, Math.ceil((deadline.getTime() - Date.now()) / 86400000));
    const dailyTarget = Math.round((goalAmount / daysUntilDeadline) * 100) / 100;

    return NextResponse.json({
      success: true,
      plan: {
        goalLabel,
        goalAmount,
        deadline: deadline.toISOString().split("T")[0],
        monthlyIncome: 3200,
        safetyBuffer: 200,
        commitments: [
          { label: "Rent", amount: 1200 },
          { label: "Utilities", amount: 150 },
          { label: "Subscriptions", amount: 45 },
        ],
        savingsPlan: `Your quest to conquer the ${goalLabel} begins! Save $${dailyTarget}/day to reach your $${goalAmount} goal. The path is long but your resolve is strong!`,
        dailySavingsTarget: dailyTarget,
        tipsCount: 2,
        tips: ["Pack lunch instead of eating out to save $200/month", "Cancel unused subscriptions to free up gold coins"],
        motivation: `A true hero saves before they spend! Your ${goalLabel} quest awaits, brave traveler!`,
      },
    });
  } catch (err) {
    console.error("Plan goal API error:", err);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}
