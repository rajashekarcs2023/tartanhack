import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentTile, totalTiles, dayStreak, savingsToTarget, goalAmount, currentSaved, deadline } = body;

    const tilesLeft = totalTiles - currentTile;
    const savedPct = goalAmount > 0 ? (currentSaved / goalAmount) : 0;

    // Calculate ETA based on current savings rate and streak
    const avgTilesPerDay = dayStreak > 0 ? Math.max(0.15, Math.min(1, (savingsToTarget ?? 0.2) * 1.2)) : 0.1;
    const daysToGoal = tilesLeft > 0 ? Math.ceil(tilesLeft / avgTilesPerDay) : 0;

    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + daysToGoal);

    // Calculate if deadline is at risk
    const deadlineDate = deadline ? new Date(deadline) : null;
    const deadlineMs = deadlineDate ? deadlineDate.getTime() - Date.now() : Infinity;
    const deadlineDaysLeft = Math.ceil(deadlineMs / 86400000);
    const onTrack = daysToGoal <= deadlineDaysLeft;

    // Daily saving needed to hit deadline
    const remainingToSave = Math.max(0, goalAmount - currentSaved);
    const dailySavingNeeded = deadlineDaysLeft > 0 ? (remainingToSave / deadlineDaysLeft) : remainingToSave;

    // Streak bonus info
    let streakMessage = "";
    if (dayStreak >= 30) streakMessage = "LEGENDARY streak! Your hero radiates golden power!";
    else if (dayStreak >= 14) streakMessage = "Amazing streak! Demons cower before you!";
    else if (dayStreak >= 7) streakMessage = "Strong streak! Your attacks grow more powerful!";
    else if (dayStreak >= 3) streakMessage = "Good momentum! Keep it up, traveler!";
    else streakMessage = "Build your streak by avoiding unnecessary spending!";

    // Next milestone
    const nextMilestone = Math.ceil(currentTile / 5) * 5;
    const tilesToMilestone = Math.min(nextMilestone, totalTiles) - currentTile;

    return NextResponse.json({
      eta: {
        daysToGoal,
        arrivalDate: arrivalDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        onTrack,
        deadlineDaysLeft: deadlineDaysLeft > 0 ? deadlineDaysLeft : null,
      },
      savings: {
        savedPct: Math.round(savedPct * 100),
        dailySavingNeeded: Math.round(dailySavingNeeded * 100) / 100,
        remainingToSave: Math.round(remainingToSave * 100) / 100,
      },
      streak: {
        current: dayStreak,
        message: streakMessage,
        attackBonus: Math.min(dayStreak, 10) * 3,
      },
      milestone: {
        nextTile: Math.min(nextMilestone, totalTiles),
        tilesAway: tilesToMilestone,
      },
    });
  } catch (err) {
    console.error("Progress API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
