import type { BankAccount } from "@/types/journey";

export const MOCK_BANK_ACCOUNT: BankAccount = {
  linked: false,
  bankName: "",
  accountType: "",
  lastFour: "",
  balance: 0,
  transactions: [],
};

export const LINKED_BANK_ACCOUNT: BankAccount = {
  linked: true,
  bankName: "Chase",
  accountType: "Checking",
  lastFour: "4829",
  balance: 2847.53,
  transactions: [
    { id: "t1", date: "2026-02-07", description: "Starbucks Coffee", amount: 6.45, category: "food", type: "debit" },
    { id: "t2", date: "2026-02-07", description: "Uber Ride", amount: 14.20, category: "transport", type: "debit" },
    { id: "t3", date: "2026-02-06", description: "Amazon - Headphones", amount: 79.99, category: "shopping", type: "debit" },
    { id: "t4", date: "2026-02-06", description: "Spotify Premium", amount: 10.99, category: "subscription", type: "debit" },
    { id: "t5", date: "2026-02-05", description: "Whole Foods Market", amount: 52.30, category: "food", type: "debit" },
    { id: "t6", date: "2026-02-05", description: "Netflix", amount: 15.49, category: "subscription", type: "debit" },
    { id: "t7", date: "2026-02-04", description: "Gas Station Shell", amount: 45.00, category: "transport", type: "debit" },
    { id: "t8", date: "2026-02-04", description: "Chipotle", amount: 12.85, category: "food", type: "debit" },
    { id: "t9", date: "2026-02-03", description: "Target - Clothes", amount: 67.50, category: "shopping", type: "debit" },
    { id: "t10", date: "2026-02-03", description: "Gym Membership", amount: 29.99, category: "subscription", type: "debit" },
    { id: "t11", date: "2026-02-02", description: "Electric Bill", amount: 85.00, category: "utilities", type: "debit" },
    { id: "t12", date: "2026-02-02", description: "Water Bill", amount: 35.00, category: "utilities", type: "debit" },
    { id: "t13", date: "2026-02-01", description: "Rent Payment", amount: 1200.00, category: "housing", type: "debit" },
    { id: "t14", date: "2026-02-01", description: "Salary Deposit", amount: 3200.00, category: "income", type: "credit" },
    { id: "t15", date: "2026-01-31", description: "Doordash Delivery", amount: 28.50, category: "food", type: "debit" },
    { id: "t16", date: "2026-01-30", description: "Apple Music", amount: 10.99, category: "subscription", type: "debit" },
    { id: "t17", date: "2026-01-29", description: "Parking Garage", amount: 15.00, category: "transport", type: "debit" },
    { id: "t18", date: "2026-01-28", description: "CVS Pharmacy", amount: 22.30, category: "health", type: "debit" },
    { id: "t19", date: "2026-01-27", description: "Trader Joe's Groceries", amount: 68.40, category: "food", type: "debit" },
    { id: "t20", date: "2026-01-26", description: "Movie Tickets", amount: 24.00, category: "entertainment", type: "debit" },
    { id: "t21", date: "2026-01-25", description: "Internet Bill", amount: 65.00, category: "utilities", type: "debit" },
    { id: "t22", date: "2026-01-24", description: "Freelance Payment", amount: 450.00, category: "income", type: "credit" },
    { id: "t23", date: "2026-01-23", description: "Zara - Jacket", amount: 89.99, category: "shopping", type: "debit" },
    { id: "t24", date: "2026-01-22", description: "Pizza Hut", amount: 18.99, category: "food", type: "debit" },
    { id: "t25", date: "2026-01-20", description: "Phone Bill", amount: 55.00, category: "utilities", type: "debit" },
  ],
};

export function summarizeBankData(account: BankAccount): string {
  if (!account.linked) return "No bank account linked.";

  const debits = account.transactions.filter(t => t.type === "debit");
  const credits = account.transactions.filter(t => t.type === "credit");
  const totalSpent = debits.reduce((s, t) => s + t.amount, 0);
  const totalEarned = credits.reduce((s, t) => s + t.amount, 0);

  const categories: Record<string, number> = {};
  for (const t of debits) {
    categories[t.category] = (categories[t.category] ?? 0) + t.amount;
  }
  const topCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
    .join(", ");

  const recentTxns = account.transactions
    .slice(0, 5)
    .map(t => `${t.type === "debit" ? "-" : "+"}$${t.amount.toFixed(2)} ${t.description} (${t.date})`)
    .join("; ");

  return `Bank: ${account.bankName} ${account.accountType} ****${account.lastFour}. Balance: $${account.balance.toFixed(2)}. Total spent recently: $${totalSpent.toFixed(2)}. Total earned: $${totalEarned.toFixed(2)}. Top spending: ${topCategories}. Recent: ${recentTxns}`;
}
