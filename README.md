# LogSight Live: Autonomous SRE Marathon Agent

**Built for the Google Gemini Hackathon**

LogSight Live is a production-grade incident analysis platform designed to act as an autonomous agentic force multiplier for SRE teams. It transforms the chaotic process of diagnosing outages into a structured, evidence-based marathon investigation.

🌐 **Live Demo**: [logsight-live.cloudninjabd.com](https://logsight-live.cloudninjabd.com/)

---

## 🚀 Gemini Integration & Architecture

LogSight Live is built from the ground up to leverage the advanced reasoning and multimodal capabilities of the **Gemini 3** series. The integration is central to the application's "Marathon" diagnostic engine:

### Recursive Deep Reasoning
In **Marathon Mode**, the agent utilizes **Gemini 3 Pro Preview** with a significant **Thinking Budget** (32,768 tokens). This enables the model to perform deep-dive architectural probes, generating "Thought Signatures" that expose its internal logic, hypothesis testing, and self-correction steps.

### Multimodal Evidence Synthesis
The agent natively processes disparate data types—synthesizing raw text logs and stack traces with visual evidence from dashboard screenshots. This allows it to correlate log-level errors with visual metric spikes that a text-only model would miss.

### Structured Investigation Ledger
By enforcing a strict **Response Schema**, the model outputs a parseable investigation timeline. This ensures that every finding is categorized by confidence and status (PROBING, CONFIRMED, or REFUTED), providing a clear audit trail for human operators.

### Hybrid Intelligence Loop
The application employs a dual-model strategy:
- **Gemini 3 Pro Preview** handles the heavy-lifting of root cause analysis in Marathon Mode
- **Gemini 3 Flash Preview** powers the "Quick Triage" mode and the "Expert Advisor" chat interface, ensuring low-latency responses for interactive troubleshooting

By combining recursive thinking with multimodal context, LogSight Live doesn't just summarize errors—it investigates them like a senior SRE.

---

## ✨ Core Features

- **🏃 Marathon Mode**: A deep-reasoning probe that tracks leads across a structured investigation ledger with extended thinking budget
- **⚡ Quick Triage**: Rapid incident assessment using Gemini 3 Flash for fast initial diagnosis
- **🧠 Thought Signatures**: Transparent views into the AI's internal reasoning process and self-corrections
- **📸 Multimodal Uploads**: Drag-and-drop logs and screenshots for a unified diagnostic context
- **✅ Validated Hypotheses**: High-fidelity root cause cards with confidence scoring and identified unknowns
- **💬 Expert SRE Chat**: Follow-up with the agent to drill down into specific leads or remediation steps
- **📊 Investigation Timeline**: Structured ledger showing TRIAGE → CORRELATION → DEEP_DIVE analysis levels

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | React 19 + TypeScript |
| **Styling** | TailwindCSS (CDN) |
| **Module System** | ESM (ES Modules) |
| **Server** | Express.js (Static File Server) |
| **AI Integration** | Google Gemini API (`@google/genai`) |
| **Build Tool** | Vite (development) |
| **Deployment** | Google Cloud Run |
| **CI/CD** | Google Cloud Build |

---

## 🏗️ Architecture

### Frontend Architecture
- **React Components**: Modular UI with `Button` and `HypothesisCard` components
- **ESM Import Maps**: Dependencies loaded via CDN (React, Gemini SDK)
- **No Build Step**: Production uses static file serving with ESM modules
- **Responsive Design**: Premium glassmorphic UI with dark mode aesthetics

### Backend Architecture
- **Express Server**: Serves static files from root directory
- **SPA Routing**: Catch-all route redirects to `index.html`
- **Port Configuration**: Defaults to 8080 (Cloud Run compatible)
- **Environment Variables**: `GEMINI_API_KEY` injected at runtime

### AI Service Layer
- **Structured Prompting**: System instructions enforce investigation methodology
- **Response Schema**: JSON schema validation ensures consistent output format
- **Thinking Budget**: Configurable deep reasoning for Marathon mode
- **Multimodal Input**: Supports text logs + base64-encoded images

---

## 🚀 Deployment

### Build-Time Configuration (Cloud Build Triggers)

The application uses **Vite** to bundle the React frontend. For production deployment, the API key is injected at **build time** using Docker build arguments.

1. **Configure Cloud Build Trigger**:
   - In the Google Cloud Console, go to **Cloud Build > Triggers**.
   - Under **Variables**, add:
     - **Name**: `_GEMINI_API_KEY`
     - **Value**: `your-gemini-api-key`

2. **Automated Injection**:
   - `cloudbuild.yaml` passes `_GEMINI_API_KEY` to the Docker build as a build-arg.
   - `Dockerfile` uses the build-arg to set an environment variable before running `npm run build`.
   - `vite.config.ts` bakes this value into the static production bundle.

---

## 💻 Local Development

### Prerequisites
- Node.js 20 or higher
- npm or yarn
- Gemini API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/sohagmahamud/LogSight-Live.git
   cd LogSight-Live
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set environment variables**
   Create a `.env` file in the root:
   ```env
   GEMINI_API_KEY=your-api-key-here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000)

---

## 🐳 Docker Deployment

### Build and Run Locally

```bash
# Build the Docker image with build-arg
docker build --build-arg GEMINI_API_KEY=your-key -t logsight-live .

# Run the container
docker run -p 8080:8080 logsight-live

# Access at http://localhost:8080
```

---

## 📖 How It Works

### Investigation Workflow

1. **Evidence Input**: User provides text logs and/or dashboard screenshots
2. **Mode Selection**: Choose between Quick Triage or Marathon Mode
3. **AI Analysis**: Gemini processes multimodal evidence with structured reasoning
4. **Investigation Ledger**: Timeline shows TRIAGE → CORRELATION → DEEP_DIVE steps
5. **Root Cause Hypotheses**: Confidence-scored hypotheses with supporting evidence
6. **Expert Chat**: Interactive follow-up to explore specific leads

### Response Schema

The AI returns structured JSON with:
- **Summary**: High-level investigation overview
- **Investigation Ledger**: Timestamped findings with thought signatures
- **Root Cause Hypotheses**: Ranked hypotheses with confidence scores
- **Active Leads**: Ongoing investigation threads
- **Next Actions**: Recommended remediation steps

---

## 🎯 Use Cases

- **Production Outages**: Rapid root cause analysis during incidents
- **Post-Mortem Analysis**: Deep-dive investigation of past failures
- **Log Analysis**: Automated parsing and correlation of complex log streams
- **Dashboard Correlation**: Link visual metric spikes to log-level errors
- **Knowledge Transfer**: Transparent reasoning helps junior SREs learn

---

## 🔒 Security & Privacy

- **API Key Management**: Environment variables for secure credential storage
- **No Data Persistence**: Logs and images processed in-memory only
- **HTTPS Only**: Cloud Run provides automatic SSL/TLS
- **Unauthenticated Access**: Public demo (configure authentication for production)

---

## 🤝 Contributing

This project was built for the Google Gemini Hackathon. Contributions, issues, and feature requests are welcome!

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- Built with **Google Gemini 3 Pro** and **Gemini 3 Flash** models
- Designed for the **Google Gemini Hackathon**
- Inspired by real-world SRE incident response workflows

---

**Made with ❤️ for SRE teams everywhere**
