
# PersonalityConvSim

A Next.js research tool for simulating and evaluating multi-turn opinion dynamics of LLM agents with distinct MBTI personalities. Characters debate a topic, and each agent's opinion strength is tracked and visualized over time.

## How It Works

- **Characters** are LLM agents assigned an MBTI personality type (e.g., INTJ, ENFP), a name, profession, and an initial opinion strength on a topic (ranging from -1 to +1).
- A **simulation** runs characters through a LangGraph `StateGraph` workflow where each character takes a turn responding to the conversation, conditioned by their personality prompt.
- After each message, the agent's opinion on the topic is rated by the LLM and plotted on a real-time chart.
- Simulations can be saved as JSON logs and reviewed later via the dashboard.

### Key Pages

| Route | Description |
|---|---|
| `/` | Dashboard — list saved simulation logs or start a new one |
| `/simulation` | Manual simulation — configure characters, topic, and run |
| `/auto_simulation` | Auto simulation — generates MBTI groups automatically and runs them sequentially |
| `/results` | Browse and review past simulation results |
| `/simulation/[sim_name]` | View a specific saved simulation log |

### LLM Backend

The simulation uses **OpenAI** (`gpt-4.1-mini` by default via `@langchain/openai`). Google Gemini and Anthropic Claude are also supported — see [src/lib/simulation.ts](src/lib/simulation.ts) for the commented-out alternatives.

---

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenAI API key (or Google / Anthropic key if you switch the LLM)

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Create a `.env.local` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
# GOOGLE_API_KEY=your_google_api_key_here   # if using Gemini
# ANTHROPIC_API_KEY=your_anthropic_key_here # if using Claude
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production

```bash
npm run build
npm run start
```

### 5. Lint

```bash
npm run lint
```

---

## Running Simulations

### Manual Simulation (`/simulation`)

1. Set a **debate topic** (e.g., "Climate change is real").
2. Configure **characters** — edit their name, profession, MBTI personality, initial opinion strength (-1 to 1), and any additional info.
3. Click **Start Simulation**. Messages stream in real time, and the opinion chart updates after each turn.
4. When complete, click **Save Simulation** to persist the run as a JSON log.

### Auto Simulation (`/auto_simulation`)

1. Set a **debate topic**.
2. Click **Start Now (Auto Groups)**. The system automatically generates MBTI personality groups (default: groups of 8) using [`src/utils/group_generator.ts`](src/utils/group_generator.ts) and runs them sequentially with a cooldown between runs.
3. Each simulation is saved automatically.

### Simulation Config

- **Message limit**: controlled by `messageLimit` in [`src/config/run_config.ts`](src/config/run_config.ts) (default: 24 messages per simulation).
- **Personality prompts**: defined in [`src/config/personalities.ts`](src/config/personalities.ts).
- **Default character roster**: defined in [`src/config/characters.ts`](src/config/characters.ts).

---

## Docker Setup

1. Copy the sample Docker Compose file:

```bash
cp docker-compose--sample.yml docker-compose.yml
```

2. Add your API key to `docker-compose.yml`:

```yaml
environment:
  - OPENAI_API_KEY=your_openai_api_key_here
```

3. Build and run:

```bash
docker-compose up --build
```

The app will be available at [http://localhost:3000](http://localhost:3000).
