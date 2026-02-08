"use client";
import { useState } from "react";
import { useJourney } from "@/store/journey-store";
import { RpgPanel, RpgButton } from "@/components/terrain/rpg-panel";
import { GameMenu } from "@/components/terrain/game-menu";

const CATEGORY_COLORS: Record<string, string> = {
  food: "#ff9800", shopping: "#e040fb", transport: "#4fc3f7",
  subscription: "#ff6666", utilities: "#a0d8a0", housing: "#c8a24e",
  entertainment: "#ff69b4", health: "#69f0ae", income: "#4CAF50",
};

export function BankScreen() {
  const { navigate, state, linkBank, unlinkBank } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
  const [linking, setLinking] = useState(false);
  const [tab, setTab] = useState<"overview" | "transactions">("overview");
  const bank = state.bankAccount;

  const handleLink = async () => {
    setLinking(true);
    await new Promise(r => setTimeout(r, 1500));
    linkBank();
    setLinking(false);
  };

  const debits = bank.transactions.filter(t => t.type === "debit");
  const credits = bank.transactions.filter(t => t.type === "credit");
  const totalSpent = debits.reduce((s, t) => s + t.amount, 0);
  const totalEarned = credits.reduce((s, t) => s + t.amount, 0);

  const categories: Record<string, number> = {};
  for (const t of debits) {
    categories[t.category] = (categories[t.category] ?? 0) + t.amount;
  }
  const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1]);

  return (
    <div className="relative flex h-full flex-col" style={{ backgroundColor: "#1a1a0e" }}>
      <div className="flex items-center justify-between" style={{ backgroundColor: "rgba(42,26,14,0.95)", padding: "6px 10px", borderBottom: "2px solid #8b5e3c" }}>
        <RpgButton variant="secondary" onClick={() => navigate("title")} style={{ fontSize: 6 }}>HOME</RpgButton>
        <p style={{ fontSize: 7, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>BANK VAULT</p>
        <RpgButton variant="secondary" onClick={() => setMenuOpen(true)} style={{ fontSize: 6 }}>MENU</RpgButton>
      </div>

      {!bank.linked ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div style={{ width: 60, height: 60, borderRadius: 8, background: "linear-gradient(135deg, #2d5a8a, #4080c0)", border: "3px solid #8b5e3c", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth={2}>
              <rect x={2} y={6} width={20} height={14} rx={2} />
              <path d="M2 10h20" />
              <path d="M6 14h4" />
            </svg>
          </div>
          <p style={{ fontSize: 7, color: "#ffd700", fontFamily: "'Press Start 2P',monospace", textAlign: "center", marginBottom: 8 }}>LINK YOUR ACCOUNT</p>
          <p style={{ fontSize: 5, color: "#8b7355", fontFamily: "'Press Start 2P',monospace", textAlign: "center", lineHeight: 1.8, marginBottom: 16 }}>
            Connect your bank to unlock AI-powered spending insights and let Journey analyze your real habits.
          </p>
          <RpgButton variant="primary" onClick={handleLink} style={{ fontSize: 7, padding: "10px 24px" }}>
            {linking ? "CONNECTING..." : "LINK BANK ACCOUNT"}
          </RpgButton>
          <p style={{ fontSize: 4, color: "#666", fontFamily: "'Press Start 2P',monospace", marginTop: 12, textAlign: "center" }}>
            (Demo: loads mock Chase account data)
          </p>
        </div>
      ) : (
        <>
          {/* Account header */}
          <div style={{ background: "linear-gradient(135deg, rgba(45,90,138,0.3), rgba(64,128,192,0.15))", padding: "10px 12px", borderBottom: "1px solid #2d5a8a" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div style={{ width: 28, height: 28, borderRadius: 4, background: "linear-gradient(135deg, #2d5a8a, #4080c0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}><rect x={2} y={6} width={20} height={14} rx={2} /><path d="M2 10h20" /></svg>
                </div>
                <div>
                  <p style={{ fontSize: 6, color: "#fff8e7", fontFamily: "'Press Start 2P',monospace" }}>{bank.bankName} ****{bank.lastFour}</p>
                  <p style={{ fontSize: 4, color: "#8b7355", fontFamily: "'Press Start 2P',monospace" }}>{bank.accountType}</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 4, color: "#8b7355", fontFamily: "'Press Start 2P',monospace" }}>BALANCE</p>
                <p style={{ fontSize: 8, color: "#4CAF50", fontFamily: "'Press Start 2P',monospace" }}>${bank.balance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex" style={{ backgroundColor: "rgba(42,26,14,0.8)", borderBottom: "2px solid #5a3a1e" }}>
            {(["overview", "transactions"] as const).map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                style={{ flex: 1, padding: "6px", fontSize: 5, color: tab === t ? "#ffd700" : "#8b7355", backgroundColor: tab === t ? "rgba(139,94,60,0.3)" : "transparent", borderBottom: tab === t ? "2px solid #ffd700" : "2px solid transparent", cursor: "pointer", fontFamily: "'Press Start 2P',monospace" }}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {tab === "overview" && (
              <>
                {/* Summary stats */}
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div className="pixel-border flex flex-col items-center p-2" style={{ backgroundColor: "rgba(42,26,14,0.7)" }}>
                    <span style={{ fontSize: 4, color: "#8b7355", fontFamily: "'Press Start 2P',monospace" }}>SPENT</span>
                    <span style={{ fontSize: 8, color: "#ff6666", fontFamily: "'Press Start 2P',monospace" }}>${totalSpent.toFixed(0)}</span>
                  </div>
                  <div className="pixel-border flex flex-col items-center p-2" style={{ backgroundColor: "rgba(42,26,14,0.7)" }}>
                    <span style={{ fontSize: 4, color: "#8b7355", fontFamily: "'Press Start 2P',monospace" }}>EARNED</span>
                    <span style={{ fontSize: 8, color: "#4CAF50", fontFamily: "'Press Start 2P',monospace" }}>${totalEarned.toFixed(0)}</span>
                  </div>
                </div>

                {/* Spending breakdown */}
                <RpgPanel className="mb-3">
                  <p style={{ fontSize: 6, color: "#ffd700", fontFamily: "'Press Start 2P',monospace", marginBottom: 8 }}>SPENDING BREAKDOWN</p>
                  {sortedCats.map(([cat, amt]) => {
                    const pct = totalSpent > 0 ? (amt / totalSpent) * 100 : 0;
                    return (
                      <div key={cat} style={{ marginBottom: 6 }}>
                        <div className="flex items-center justify-between" style={{ marginBottom: 2 }}>
                          <span style={{ fontSize: 5, color: CATEGORY_COLORS[cat] ?? "#fff8e7", fontFamily: "'Press Start 2P',monospace" }}>{cat.toUpperCase()}</span>
                          <span style={{ fontSize: 5, color: "#fff8e7", fontFamily: "'Press Start 2P',monospace" }}>${amt.toFixed(0)}</span>
                        </div>
                        <div style={{ height: 6, backgroundColor: "#2a1a0e", border: "1px solid #5a3a1e", overflow: "hidden", borderRadius: 2 }}>
                          <div style={{ height: "100%", width: `${pct}%`, backgroundColor: CATEGORY_COLORS[cat] ?? "#8b7355", transition: "width 0.3s" }} />
                        </div>
                      </div>
                    );
                  })}
                </RpgPanel>

                {/* AI Insight */}
                <RpgPanel className="mb-3">
                  <div className="flex items-start gap-2">
                    <div style={{ width: 22, height: 22, borderRadius: 4, background: "linear-gradient(135deg, #ffd700, #ffaa00)", border: "2px solid #8b6508", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 9 }}>*</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 5, color: "#8b7355", fontFamily: "'Press Start 2P',monospace", marginBottom: 2 }}>GUIDE INSIGHT</p>
                      <p style={{ fontSize: 5, color: "#fff8e7", fontFamily: "'Press Start 2P',monospace", lineHeight: 1.8 }}>
                        Your biggest expenses are {sortedCats[0]?.[0] ?? "unknown"} (${sortedCats[0]?.[1]?.toFixed(0) ?? 0}) and {sortedCats[1]?.[0] ?? "unknown"} (${sortedCats[1]?.[1]?.toFixed(0) ?? 0}). 
                        Ask the Guide for personalized tips on reducing spending!
                      </p>
                    </div>
                  </div>
                </RpgPanel>

                <RpgButton variant="danger" className="w-full text-center" onClick={unlinkBank} style={{ fontSize: 5 }}>UNLINK ACCOUNT</RpgButton>
              </>
            )}

            {tab === "transactions" && (
              <>
                {bank.transactions.map(t => (
                  <div key={t.id} className="mb-1 flex items-center justify-between" style={{ padding: "6px 8px", backgroundColor: "rgba(42,26,14,0.6)", border: "1px solid #3a2a1e" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 5.5, color: "#fff8e7", fontFamily: "'Press Start 2P',monospace" }}>{t.description}</p>
                      <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                        <span style={{ fontSize: 4, color: CATEGORY_COLORS[t.category] ?? "#8b7355", fontFamily: "'Press Start 2P',monospace" }}>{t.category}</span>
                        <span style={{ fontSize: 4, color: "#666", fontFamily: "'Press Start 2P',monospace" }}>{t.date}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 6, color: t.type === "debit" ? "#ff6666" : "#4CAF50", fontFamily: "'Press Start 2P',monospace", whiteSpace: "nowrap" }}>
                      {t.type === "debit" ? "-" : "+"}${t.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}

      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} currentScreen="bank" />
    </div>
  );
}
