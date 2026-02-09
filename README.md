# LogSight Live: Autonomous SRE Marathon Agent

LogSight Live is a production-grade incident analysis platform designed to act as an autonomous agentic force multiplier for SRE teams. It transforms the chaotic process of diagnosing outages into a structured, evidence-based marathon investigation.

## Gemini 3 Integration & Architecture

LogSight Live is built from the ground up to leverage the advanced reasoning and multimodal capabilities of the **Gemini 3** series. The integration is central to the application's "Marathon" diagnostic engine:

*   **Recursive Deep Reasoning**: In "Marathon Mode," the agent utilizes **Gemini 3 Pro Preview** with a significant **Thinking Budget**. This enables the model to perform deep-dive architectural probes, generating "Thought Signatures" that expose its internal logic, hypothesis testing, and self-correction steps.
*   **Multimodal Evidence Synthesis**: The agent natively processes disparate data types—synthesizing raw text logs and stack traces with visual evidence from dashboard screenshots. This allows it to correlate log-level errors with visual metric spikes that a text-only model would miss.
*   **Structured Investigation Ledger**: By enforcing a strict **Response Schema**, the model outputs a parseable investigation timeline. This ensures that every finding is categorized by confidence and status (PROBING, CONFIRMED, or REFUTED), providing a clear audit trail for human operators.
*   **Hybrid Intelligence Loop**: The application employs a dual-model strategy. While **Gemini 3 Pro** handles the heavy-lifting of root cause analysis, **Gemini 3 Flash Preview** powers the "Quick Triage" mode and the "Expert Advisor" chat interface, ensuring low-latency responses for interactive troubleshooting.

By combining recursive thinking with multimodal context, LogSight Live doesn't just summarize errors—it investigates them like a senior SRE.

## Core Features

- **Marathon Mode**: A deep-reasoning probe that tracks leads across a structured investigation ledger.
- **Thought Signatures**: Transparent views into the AI's internal reasoning process and self-corrections.
- **Multimodal Uploads**: Drag-and-drop logs and screenshots for a unified diagnostic context.
- **Validated Hypotheses**: High-fidelity root cause cards with confidence scoring and identified unknowns.
- **Expert SRE Chat**: Follow-up with the agent to drill down into specific leads or remediation steps.

## Deployment

The application is optimized for **Google Cloud Run** and is live at [logsight-live.cloudninjabd.com](https://logsight-live.cloudninjabd.com/).
