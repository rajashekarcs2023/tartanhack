"use client";
import { useState } from "react";
import { useJourney } from "@/store/journey-store";
import { RpgPanel, RpgButton } from "@/components/terrain/rpg-panel";
import { GameMenu } from "@/components/terrain/game-menu";

/* Weekly curriculum — unlocks progressively */
const WEEKLY_TOPICS = [
  { id: "w1", week: 1, topic: "needs-vs-wants", title: "The Wisdom of True Needs", desc: "Needs vs wants — the foundation of all money decisions", unlockLevel: 1 },
  { id: "w2", week: 2, topic: "budgeting", title: "The Map of Gold Flow", desc: "Learn to track and plan where every coin goes", unlockLevel: 1 },
  { id: "w3", week: 3, topic: "emergency-fund", title: "The Shield of Emergency Funds", desc: "Build your financial armor before the unexpected", unlockLevel: 2 },
  { id: "w4", week: 4, topic: "debt-management", title: "Slaying the Debt Dragon", desc: "Battle strategies for defeating debt", unlockLevel: 2 },
  { id: "w5", week: 5, topic: "credit-score", title: "The Reputation System", desc: "Your credit score — level it up wisely", unlockLevel: 3 },
  { id: "w6", week: 6, topic: "compound-interest", title: "The Exponential Enchantment", desc: "The most powerful spell in all of finance", unlockLevel: 3 },
  { id: "w7", week: 7, topic: "investing-basics", title: "The Quest for Passive Gold", desc: "Make your gold work for you while you rest", unlockLevel: 4 },
  { id: "w8", week: 8, topic: "taxes", title: "The Tax Toll Gates", desc: "Keep more of your hard-earned gold", unlockLevel: 5 },
];

interface Lesson {
  title: string;
  summary: string;
  body: string;
  keyTakeaway: string;
  quiz: { question: string; options: string[]; correctIndex: number };
  xpReward: number;
}

export function LoreScreen() {
  const { navigate, state, setState } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"lessons" | "scrolls">("lessons");

  const heroLevel = state.journey.level;

  const loadLesson = async (topic: string, weekNum: number) => {
    setSelectedTopic(topic);
    setLesson(null);
    setQuizAnswer(null);
    setQuizSubmitted(false);
    setLoading(true);
    try {
      const res = await fetch("/api/lore-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          level: heroLevel,
          goalLabel: state.goal?.label ?? "",
          weekNumber: weekNum,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.lesson) {
          setLesson(data.lesson);
        }
      }
    } catch { /* fallback handled by API */ }
    setLoading(false);
  };

  const submitQuiz = () => {
    if (quizAnswer === null || !lesson) return;
    setQuizSubmitted(true);
    if (quizAnswer === lesson.quiz.correctIndex && selectedTopic) {
      setCompletedTopics(prev => new Set(prev).add(selectedTopic));
      // Award XP
      setState(prev => ({
        ...prev,
        journey: {
          ...prev.journey,
          xp: prev.journey.xp + (lesson.xpReward ?? 25),
        },
      }));
    }
  };

  const goBack = () => {
    setSelectedTopic(null);
    setLesson(null);
    setQuizAnswer(null);
    setQuizSubmitted(false);
  };

  return (
    <div className="relative flex h-full flex-col" style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #1a3a0e 100%)" }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ backgroundColor: "rgba(42,26,14,0.95)", padding: "6px 10px", borderBottom: "2px solid #8b5e3c" }}>
        <RpgButton variant="secondary" onClick={() => selectedTopic ? goBack() : navigate("title")} style={{ fontSize: 6 }}>{selectedTopic ? "BACK" : "HOME"}</RpgButton>
        <p style={{ fontSize: 7, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>LORE BOOK</p>
        <RpgButton variant="secondary" onClick={() => setMenuOpen(true)} style={{ fontSize: 6 }}>MENU</RpgButton>
      </div>

      {/* Tab bar */}
      {!selectedTopic && (
        <div className="flex" style={{ backgroundColor: "rgba(42,26,14,0.7)" }}>
          {(["lessons", "scrolls"] as const).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              style={{ flex: 1, padding: "6px 0", fontSize: 5.5, fontFamily: "'Press Start 2P',monospace", color: tab === t ? "#ffd700" : "#8b7355", backgroundColor: tab === t ? "rgba(139,94,60,0.3)" : "transparent", border: "none", borderBottom: tab === t ? "2px solid #ffd700" : "2px solid transparent", cursor: "pointer" }}>
              {t === "lessons" ? "WEEKLY LESSONS" : "LORE SCROLLS"}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {/* ── Lesson View ── */}
        {selectedTopic && loading && (
          <RpgPanel>
            <p style={{ fontSize: 6, color: "#ffd700", textAlign: "center", fontFamily: "'Press Start 2P',monospace", animation: "hero-bob 0.6s ease-in-out infinite" }}>
              The sage is preparing your lesson...
            </p>
          </RpgPanel>
        )}

        {selectedTopic && lesson && (
          <>
            <RpgPanel className="mb-3">
              <p style={{ fontSize: 8, color: "#ffd700", marginBottom: 4, textAlign: "center", fontFamily: "'Press Start 2P',monospace" }}>{lesson.title}</p>
              <p style={{ fontSize: 5, color: "#4fc3f7", marginBottom: 8, textAlign: "center", fontFamily: "'Press Start 2P',monospace" }}>{lesson.summary}</p>
              {lesson.body.split("\n\n").map((para, i) => (
                <p key={i} style={{ fontSize: 5.5, color: "#fff8e7", lineHeight: 2, marginBottom: 8, fontFamily: "'Press Start 2P',monospace" }}>{para}</p>
              ))}
            </RpgPanel>

            {/* Key takeaway */}
            <RpgPanel className="mb-3" style={{ borderLeft: "3px solid #4CAF50" }}>
              <p style={{ fontSize: 5.5, color: "#4CAF50", marginBottom: 4, fontFamily: "'Press Start 2P',monospace" }}>KEY TAKEAWAY</p>
              <p style={{ fontSize: 5.5, color: "#a0d8a0", lineHeight: 1.8, fontFamily: "'Press Start 2P',monospace" }}>{lesson.keyTakeaway}</p>
            </RpgPanel>

            {/* Quiz */}
            <RpgPanel className="mb-3">
              <p style={{ fontSize: 6, color: "#ffd700", marginBottom: 6, fontFamily: "'Press Start 2P',monospace" }}>KNOWLEDGE CHECK</p>
              <p style={{ fontSize: 5.5, color: "#fff8e7", lineHeight: 1.8, marginBottom: 8, fontFamily: "'Press Start 2P',monospace" }}>{lesson.quiz.question}</p>
              <div className="flex flex-col gap-2">
                {lesson.quiz.options.map((opt, i) => {
                  let bg = "rgba(42,26,14,0.6)";
                  let border = "1px solid #5a3a1e";
                  if (quizSubmitted) {
                    if (i === lesson.quiz.correctIndex) { bg = "rgba(76,175,80,0.3)"; border = "2px solid #4CAF50"; }
                    else if (i === quizAnswer && i !== lesson.quiz.correctIndex) { bg = "rgba(244,67,54,0.3)"; border = "2px solid #f44336"; }
                  } else if (quizAnswer === i) {
                    bg = "rgba(79,195,247,0.2)"; border = "2px solid #4fc3f7";
                  }
                  return (
                    <button key={i} type="button" onClick={() => !quizSubmitted && setQuizAnswer(i)}
                      style={{ padding: "6px 8px", fontSize: 5.5, fontFamily: "'Press Start 2P',monospace", color: "#fff8e7", backgroundColor: bg, border, cursor: quizSubmitted ? "default" : "pointer", textAlign: "left" }}>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {!quizSubmitted ? (
                <RpgButton variant="primary" onClick={submitQuiz} className="w-full mt-3" style={{ fontSize: 6, textAlign: "center" }}>
                  SUBMIT ANSWER
                </RpgButton>
              ) : (
                <div style={{ marginTop: 8, textAlign: "center" }}>
                  {quizAnswer === lesson.quiz.correctIndex ? (
                    <>
                      <p style={{ fontSize: 7, color: "#4CAF50", fontFamily: "'Press Start 2P',monospace" }}>CORRECT!</p>
                      <p style={{ fontSize: 5, color: "#ffd700", marginTop: 4, fontFamily: "'Press Start 2P',monospace" }}>+{lesson.xpReward} XP earned!</p>
                    </>
                  ) : (
                    <p style={{ fontSize: 6, color: "#ff6666", fontFamily: "'Press Start 2P',monospace" }}>Not quite! Review the lesson and try again next time.</p>
                  )}
                </div>
              )}
            </RpgPanel>
          </>
        )}

        {/* ── Weekly Lessons List ── */}
        {!selectedTopic && tab === "lessons" && (
          <>
            <RpgPanel className="mb-3" style={{ textAlign: "center" }}>
              <p style={{ fontSize: 6, color: "#ffd700", fontFamily: "'Press Start 2P',monospace", marginBottom: 4 }}>FINANCIAL ACADEMY</p>
              <p style={{ fontSize: 4.5, color: "#8b7355", fontFamily: "'Press Start 2P',monospace", lineHeight: 1.8 }}>
                Master one concept per week. Each lesson teaches a vital financial skill with quizzes and XP rewards!
              </p>
              <div className="flex justify-center gap-3 mt-2">
                <span style={{ fontSize: 5, color: "#a0d8a0", fontFamily: "'Press Start 2P',monospace" }}>Level: {heroLevel}</span>
                <span style={{ fontSize: 5, color: "#4fc3f7", fontFamily: "'Press Start 2P',monospace" }}>{completedTopics.size}/{WEEKLY_TOPICS.length} done</span>
              </div>
            </RpgPanel>

            {WEEKLY_TOPICS.map(w => {
              const unlocked = heroLevel >= w.unlockLevel;
              const completed = completedTopics.has(w.topic);
              return (
                <RpgPanel key={w.id} className="mb-2">
                  {unlocked ? (
                    <button type="button" onClick={() => loadLesson(w.topic, w.week)} className="w-full text-left" style={{ cursor: "pointer", background: "none", border: "none", fontFamily: "'Press Start 2P',monospace" }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: 28, height: 28, borderRadius: 4, backgroundColor: completed ? "#2d7a2d" : "#8b5e3c", border: `2px solid ${completed ? "#4CAF50" : "#c4956a"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 8, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>{completed ? "!" : w.week}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="flex items-center gap-2">
                            <p style={{ fontSize: 5.5, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>WK{w.week}: {w.title}</p>
                          </div>
                          <p style={{ fontSize: 4, color: "#8b7355", marginTop: 2, fontFamily: "'Press Start 2P',monospace" }}>{w.desc}</p>
                          {completed && <p style={{ fontSize: 4, color: "#4CAF50", marginTop: 2, fontFamily: "'Press Start 2P',monospace" }}>COMPLETED</p>}
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3" style={{ opacity: 0.4 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 4, backgroundColor: "#3a3a3a", border: "2px solid #555", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 8, color: "#666" }}>?</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 5.5, color: "#666", fontFamily: "'Press Start 2P',monospace" }}>LOCKED — Reach Lv{w.unlockLevel}</p>
                        <p style={{ fontSize: 4, color: "#555", fontFamily: "'Press Start 2P',monospace" }}>{w.desc}</p>
                      </div>
                    </div>
                  )}
                </RpgPanel>
              );
            })}
          </>
        )}

        {/* ── Lore Scrolls (original) ── */}
        {!selectedTopic && tab === "scrolls" && (
          <>
            <RpgPanel className="mb-3" style={{ textAlign: "center" }}>
              <p style={{ fontSize: 6, color: "#ffd700", fontFamily: "'Press Start 2P',monospace", marginBottom: 4 }}>JOURNEY SCROLLS</p>
              <p style={{ fontSize: 4.5, color: "#8b7355", fontFamily: "'Press Start 2P',monospace", lineHeight: 1.8 }}>
                Lore scrolls unlock as you progress through your quest. Each reveals wisdom from the financial realm.
              </p>
            </RpgPanel>
            {state.lore.map(l => (
              <RpgPanel key={l.id} className="mb-2">
                {l.unlockedAt ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div style={{ width: 14, height: 16, backgroundColor: "#c8a24e", border: "1px solid #8b6508", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 7 }}>*</span>
                      </div>
                      <p style={{ fontSize: 6, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>{l.title}</p>
                    </div>
                    <p style={{ fontSize: 5.5, color: "#fff8e7", lineHeight: 1.8, fontFamily: "'Press Start 2P',monospace" }}>{l.body}</p>
                    <p style={{ fontSize: 4, color: "#8b7355", marginTop: 4, fontFamily: "'Press Start 2P',monospace" }}>Unlocked {new Date(l.unlockedAt).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2" style={{ opacity: 0.4 }}>
                    <div style={{ width: 14, height: 16, backgroundColor: "#3a3a3a", border: "1px solid #555", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 7, color: "#666" }}>?</span>
                    </div>
                    <p style={{ fontSize: 6, color: "#666", fontFamily: "'Press Start 2P',monospace" }}>LOCKED — Keep progressing!</p>
                  </div>
                )}
              </RpgPanel>
            ))}
          </>
        )}
      </div>

      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} currentScreen="lore" />
    </div>
  );
}
