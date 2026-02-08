import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, level, goalLabel, weekNumber } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey) {
      const prompt = `You are a wise financial sage in a JRPG world. Teach a young person about "${topic}" in a fun, engaging, JRPG-themed way. The learner is Level ${level ?? 1} on their financial journey${goalLabel ? ` working toward "${goalLabel}"` : ""}. This is Week ${weekNumber ?? 1} of their education.

Write a financial literacy lesson in this EXACT JSON format (no markdown, no code fences, just raw JSON):
{
  "title": "Catchy JRPG-style lesson title (e.g. 'The Shield of Emergency Funds')",
  "summary": "One sentence summary of what they'll learn",
  "body": "2-3 paragraphs teaching the concept. Use JRPG metaphors (gold coins, quests, armor, shields, potions). Keep it simple and actionable for young adults (18-25). Include real numbers and examples.",
  "keyTakeaway": "One clear actionable takeaway they can do TODAY",
  "quiz": {
    "question": "A simple multiple-choice question to test understanding",
    "options": ["A) option", "B) option", "C) option"],
    "correctIndex": 0
  },
  "xpReward": 25
}`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
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

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text ?? "";
        try {
          const lesson = JSON.parse(text);
          return NextResponse.json({ success: true, lesson });
        } catch {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            const lesson = JSON.parse(match[0]);
            return NextResponse.json({ success: true, lesson });
          }
        }
      }
    }

    // Fallback lessons for each topic
    const lessons: Record<string, { title: string; summary: string; body: string; keyTakeaway: string; quiz: { question: string; options: string[]; correctIndex: number }; xpReward: number }> = {
      "budgeting": {
        title: "The Map of Gold Flow",
        summary: "Learn how to track where your gold coins go each month.",
        body: "Every great adventurer needs a map — not just of the land, but of their gold! Budgeting is like drawing a map of where every coin flows. Start by listing your income (the gold you earn) and your fixed costs (rent, utilities — think of these as toll gates you must pass).\n\nThe 50/30/20 rule is your starter spell: 50% for needs (toll gates), 30% for wants (side quests), and 20% for savings (powering up). If you earn $3,200/month, that's $1,600 for needs, $960 for fun, and $640 for your savings quest.\n\nTracking spending for just one week reveals surprising patterns. Many young adventurers discover they spend $200+/month on food delivery alone — that's a hidden demon draining your gold!",
        keyTakeaway: "Track every purchase for 7 days using your phone's notes app. You'll find at least one 'hidden demon' eating your gold.",
        quiz: { question: "In the 50/30/20 rule, what percentage goes to savings?", options: ["A) 50%", "B) 30%", "C) 20%"], correctIndex: 2 },
        xpReward: 25,
      },
      "emergency-fund": {
        title: "The Shield of Emergency Funds",
        summary: "Build your financial armor before the unexpected boss fight.",
        body: "In every JRPG, you need a shield before facing the boss. Your emergency fund IS that shield. Life throws surprise boss fights — car breakdowns ($500+), medical bills ($1,000+), sudden job loss. Without a shield, one hit can end your quest.\n\nStart with a Mini Shield: $500-$1,000 for small emergencies. Then level up to a Full Shield: 3-6 months of expenses. If your monthly costs are $2,000, aim for $6,000-$12,000.\n\nPro tip: Open a separate high-yield savings account (earning 4-5% APY right now!) and set up auto-transfers. Even $25/week = $1,300/year. That's a solid shield!",
        keyTakeaway: "Open a separate savings account today and set up a $25/week auto-transfer. Your shield starts building immediately.",
        quiz: { question: "How many months of expenses should a Full Shield (emergency fund) cover?", options: ["A) 1 month", "B) 3-6 months", "C) 12 months"], correctIndex: 1 },
        xpReward: 30,
      },
      "compound-interest": {
        title: "The Exponential Enchantment",
        summary: "Discover the most powerful spell in finance: compound interest.",
        body: "Albert Einstein called compound interest the 'eighth wonder of the world.' Here's why: when your gold earns interest, that interest earns MORE interest. It's like a spell that gets stronger every turn!\n\nExample: Invest $100/month starting at age 20 with 7% average returns. By age 60, you'd have $264,000 — but you only put in $48,000. The other $216,000 is pure magic (compound interest)! Start at 30 instead? You'd only have $122,000. Waiting 10 years cost you $142,000.\n\nThe Rule of 72: divide 72 by your interest rate to see how long it takes to double. At 7%, your money doubles every ~10 years. At 10%, every ~7 years.",
        keyTakeaway: "Start investing even $50/month NOW. Time is the most powerful ingredient in the compounding spell.",
        quiz: { question: "Using the Rule of 72, how long does it take money to double at 8% returns?", options: ["A) 6 years", "B) 9 years", "C) 12 years"], correctIndex: 1 },
        xpReward: 35,
      },
      "debt-management": {
        title: "Slaying the Debt Dragon",
        summary: "Learn battle strategies to defeat the most fearsome financial monster.",
        body: "Debt is the most dangerous dragon in the financial realm. Credit card debt at 20%+ interest is like a dragon that grows stronger every turn you don't fight it. A $5,000 balance at 20% APR costs you $1,000/year in interest alone!\n\nTwo battle strategies: The Avalanche Method attacks highest-interest debt first (mathematically optimal). The Snowball Method attacks smallest debts first (psychologically motivating — you see victories faster). Both work; pick the one that keeps you fighting.\n\nGolden rule: NEVER pay just the minimum. On a $5,000 credit card balance at 20%, minimum payments would take 25+ years and cost $8,000+ in interest. Double or triple the minimum payment to slay it in 2-3 years.",
        keyTakeaway: "List all your debts with interest rates. Pay at least double the minimum on your highest-rate debt this month.",
        quiz: { question: "Which debt strategy pays off the highest interest rate first?", options: ["A) Snowball Method", "B) Avalanche Method", "C) Minimum Method"], correctIndex: 1 },
        xpReward: 30,
      },
      "investing-basics": {
        title: "The Quest for Passive Gold",
        summary: "Learn how to make your gold work for you while you sleep.",
        body: "Investing is like sending your gold on quests while you rest at the inn. Index funds are the beginner's best weapon — they spread your gold across hundreds of companies, reducing risk. The S&P 500 has returned ~10% per year on average over the last 100 years.\n\nStart with your employer's 401(k) if they offer a match — that's FREE GOLD (literally doubling your money instantly). Then open a Roth IRA (you can contribute up to $7,000/year). In a Roth, your gains are NEVER taxed — it's like a permanent tax shield.\n\nDon't try to time the market or pick individual stocks as a beginner. 'Time IN the market beats timing THE market.' Even investing on the worst possible day each year still beats not investing.",
        keyTakeaway: "If your employer offers a 401(k) match, contribute at least enough to get the full match. It's an instant 100% return.",
        quiz: { question: "What is a Roth IRA's biggest advantage?", options: ["A) No contribution limits", "B) Tax-free growth and withdrawals", "C) Guaranteed returns"], correctIndex: 1 },
        xpReward: 35,
      },
      "credit-score": {
        title: "The Reputation System",
        summary: "Your credit score is your financial reputation — learn to level it up.",
        body: "Your credit score (300-850) is like your reputation stat in a JRPG. High reputation = better deals, lower interest rates, easier apartment approvals. A score above 740 is 'Legendary' status.\n\nThe 5 factors: Payment History (35%) — NEVER miss a payment, set up autopay. Credit Utilization (30%) — keep balances below 30% of your limit ($300 on a $1,000 card). Length of History (15%) — keep old accounts open. Credit Mix (10%) — different types help. New Credit (10%) — don't open too many accounts at once.\n\nPro tip: Become an authorized user on a parent's old, well-managed credit card. You inherit their payment history instantly — like inheriting a legendary weapon!",
        keyTakeaway: "Set up autopay for ALL bills today. One missed payment can drop your score 100+ points.",
        quiz: { question: "What is the biggest factor in your credit score?", options: ["A) Credit utilization", "B) Payment history", "C) Length of credit history"], correctIndex: 1 },
        xpReward: 30,
      },
      "taxes": {
        title: "The Tax Toll Gates",
        summary: "Understanding taxes so you keep more of your hard-earned gold.",
        body: "Taxes are the toll gates on the road to wealth. Understanding them means you keep more gold! The US uses progressive tax brackets — you don't pay 22% on ALL your income, only on the portion above $44,725 (for 2024). Your first $11,600 is taxed at just 10%.\n\nKey deductions for young adults: Student loan interest (up to $2,500/year), traditional IRA contributions, and the standard deduction ($14,600 for single filers). These reduce your taxable income directly.\n\nTax-advantaged accounts are your best allies: 401(k) and traditional IRA reduce taxes NOW. Roth IRA and Roth 401(k) give you tax-free withdrawals LATER. HSA (if eligible) is triple tax-advantaged — the ultimate financial spell!",
        keyTakeaway: "Check your paycheck stub. If you're getting a huge tax refund each year, adjust your W-4 to keep more gold each paycheck.",
        quiz: { question: "In a progressive tax system, if you earn $50,000:", options: ["A) All $50K is taxed at the same rate", "B) Different portions are taxed at different rates", "C) You pay no taxes below $50K"], correctIndex: 1 },
        xpReward: 30,
      },
      "needs-vs-wants": {
        title: "The Wisdom of True Needs",
        summary: "Master the ancient art of distinguishing needs from wants.",
        body: "The most fundamental financial spell: knowing the difference between needs and wants. Needs keep you alive and functioning — housing, basic food, transportation to work, health insurance. Wants make life enjoyable — dining out, entertainment, new clothes beyond basics.\n\nThe 24-Hour Rule: Before any purchase over $30, wait 24 hours. If you still want it AND can afford it, buy it guilt-free. Studies show 70% of impulse purchases are regretted within a week. That's the Impulse Imp demon stealing your gold!\n\nReframe spending as hours worked: If you earn $20/hour after taxes, a $100 dinner out costs 5 hours of your life. Is it worth 5 hours? Sometimes yes! The goal isn't to never spend — it's to spend intentionally.",
        keyTakeaway: "Apply the 24-Hour Rule to your next purchase over $30. Write it down and revisit tomorrow.",
        quiz: { question: "What does the 24-Hour Rule help you avoid?", options: ["A) Saving too much", "B) Impulse purchases", "C) Using credit cards"], correctIndex: 1 },
        xpReward: 25,
      },
    };

    const topicKey = (topic ?? "budgeting").toLowerCase().replace(/\s+/g, "-");
    const lesson = lessons[topicKey] ?? lessons["budgeting"];

    return NextResponse.json({ success: true, lesson });
  } catch (err) {
    console.error("Lore lesson API error:", err);
    return NextResponse.json({ error: "Failed to generate lesson" }, { status: 500 });
  }
}
