# Supply Chain Control Tower - User Interface (`scct_ui`)

The **Face** of the operation. A modern, comprehensive dashboard for supply chain managers to monitor events, review agent decisions, and access compliance documents.

## Technology Stack

- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Key Features

- **Control Tower Dashboard**: Real-time view of shipments, exceptions, and resolution stats.
- **Agent Trace**: Transparent view of the AI's reasoning process (Thought -> Tool -> Action).
- **Data Lab**:
  - **Synthetic Data Generator**: Create realistic supply chain scenarios.
  - **Client-Side PDF Engine**: Generates 12 high-fidelity compliance PDFs directly in the browser (zero backend dependency) using `SimplePDF`.

## Project Structure

- `components/`: Reusable UI components (`Dashboard`, `AgentTrace`, `SettingsView`).
- `src/utils/`: core logic including `simplePdf.ts` (PDF generation) and `simpleZip.ts`.
- `app/`: Next.js App Router pages.

## Development

Run dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).
