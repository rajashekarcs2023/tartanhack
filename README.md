# Journey — Financial Literacy RPG

A gamified financial literacy app that transforms personal finance into a JRPG adventure. Built at TartanHacks 2026.

## 🎮 Concept

Users set a savings goal and Journey turns their real finances into a personalized game:
- **Save money** → Hero advances forward on the map
- **Spend money** → Hero pushed backward with visual penalties
- **Maintain streaks** → Battle demons of debt
- **Learn lessons** → Financial literacy academy with AI-generated content

## ✨ Key Features

### Core Gameplay
- **JRPG-style interface** with pixel art and retro aesthetics
- **Dynamic world map** with hero movement animations
- **Spending penalties** with screen shake, toast notifications, and backward movement
- **Demon battles** powered by saving streaks
- **Companion system** with progress tracking

### Financial Features
- **Goal-aware spending thresholds** — penalties scale relative to savings goal
- **Dynamic ETA** based on actual progress and deadlines
- **Bank integration** (Plaid) for real transaction data
- **Commitment tracking** for recurring expenses
- **Safe-to-spend calculations**

### Learning System
- **AI-powered financial lessons** using Anthropic Claude
- **Weekly curriculum** with quizzes and XP rewards
- **Investment guidance** from the Guide Fairy
- **Personalized advice** based on spending patterns

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, Next.js
- **Styling**: Tailwind CSS, custom pixel art
- **State**: Zustand-like global store
- **AI**: Anthropic Claude for lessons and advice
- **Banking**: Plaid API integration
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Plaid API keys (optional for full features)
- Anthropic API key (for AI features)

### Setup

1. **Clone and install**
```bash
git clone <repository-url>
cd tartanhack-1/journey
npm install
```

2. **Environment variables**
```bash
cp .env.example .env
# Add your API keys to .env:
ANTHROPIC_API_KEY=your_key_here
PLAID_CLIENT_ID=your_id_here
PLAID_SECRET=your_secret_here
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

3. **Run development server**
```bash
npm run dev
```

4. **Open** [http://localhost:3000](http://localhost:3000)

## 🎯 How It Works

### 1. Set Your Quest
- Choose a savings goal and deadline
- Connect bank account (optional) or use demo data
- Set spending commitments

### 2. Start Your Journey
- Your hero appears at the beginning of the map
- Each tile represents progress toward your goal
- Demons block key tiles — defeat them with saving streaks

### 3. Play the Game
- **Save money**: Hero walks forward, gains XP and gold
- **Spend money**: Hero pushed back with dramatic penalties
- **Maintain streaks**: Powers up your attacks against demons
- **Learn**: Complete weekly lessons for bonus rewards

### 4. Track Progress
- Dynamic ETA updates based on actual savings rate
- Visual progress bars show goal completion
- On-track status (blue) vs behind (red) indicators

## 🎨 Design Philosophy

- **JRPG aesthetics**: Pixel art, retro fonts, game-like UI
- **Immediate feedback**: Every action has visual consequences
- **Gamification without gimmicks**: Core mechanics reinforce good habits
- **Inclusive design**: Works with or without bank integration

## 🔧 Architecture

```
journey/
├── app/                    # Next.js app router
│   ├── api/               # API routes (AI, banking, etc.)
│   └── globals.css        # Global styles and animations
├── components/
│   ├── screens/           # Main game screens
│   ├── ui/               # Reusable UI components
│   └── icons/            # Custom SVG icons
├── data/
│   └── mock-bank.ts      # Demo transaction data
├── store/
│   └── journey-store.tsx # Global state management
└── types/
    └── journey.ts        # TypeScript definitions
```

## 🤝 Team

- **Radhika Danda** — Product & Design
- **Rajashekar CS** — Engineering & AI Integration
- **Public Policy Majors** — Impact & Policy Framework
- **Engineering Management** — Project Coordination

## 📸 Screenshots
<img width="429" height="991" alt="Screenshot 2026-02-09 at 5 48 53 PM" src="https://github.com/user-attachments/assets/29361a10-0dcc-45aa-8cd2-b8d4fe3382bb" />

<img width="429" height="714" alt="Screenshot 2026-02-09 at 5 49 50 PM" src="https://github.com/user-attachments/assets/caf896af-7711-4df4-a809-83524bbaad9a" />

<img width="429" height="956" alt="Screenshot 2026-02-09 at 5 51 05 PM" src="https://github.com/user-attachments/assets/05888a6d-6f94-41bd-862d-328d8d30bbb2" />

<img width="429" height="956" alt="Screenshot 2026-02-09 at 6 11 46 PM" src="https://github.com/user-attachments/assets/1e6e9704-01a8-46e1-b92f-7b811942bda8" />

<img width="429" height="956" alt="Screenshot 2026-02-09 at 6 12 12 PM" src="https://github.com/user-attachments/assets/269fdb0e-e1f2-40ac-81d1-7ca6d39a3400" />
<img width="429" height="956" alt="Screenshot 2026-02-09 at 6 12 08 PM" src="https://github.com/user-attachments/assets/aef2a252-7bb3-420d-9807-1cafbbb7a686" />

<img width="429" height="956" alt="Screenshot 2026-02-09 at 6 12 01 PM" src="https://github.com/user-attachments/assets/bb86b8af-3bab-4f57-a674-8be9fe9e1ccb" />


## 🎮 Demo Video

*(Add demo video link when available)*

## 🚀 Deployment

Deploy to Vercel:
```bash
npm run build
npx vercel --prod
```

## 📝 License

MIT License — see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Contact

Built with ❤️ at TartanHacks 2026

---

*"Transforming financial literacy from a chore into an adventure"*
