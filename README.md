============================================================
AMPLIFYED PULSE UI
Front-End Interface for the AmplifyEd Platform
OVERVIEW

AmplifyEd Pulse UI is the front-end–only version of the
AmplifyEd Thread Simulator and emotional intelligence display.

This project contains a clean React + Vite interface designed to
support:

• Thread Simulation UI
• Emotion bars and trendlines
• Facilitator visualization panels
• Interpreter overlays
• WebSocket-driven live data (future feature)

The UI is intentionally isolated from all backend, engine, and
AI systems to keep development fast, modern, and maintainable.

TECH STACK

• React 18
• Vite 7
• Styled Components
• Socket.io Client
• ES Modules

PROJECT STRUCTURE

amplifyed-pulse-ui/
src/
api/
components/
hooks/
pages/
utils/
styles/
public/
scripts/
archive/
index.html
package.json
vite.config.js

This structure is flat, predictable, and aligns with modern
industry standards used by professional React teams.

GETTING STARTED

Install dependencies:
npm install

Start the development server:
npm run dev

Open in browser:
http://localhost:5173/

Build for production:
npm run build

REQUIREMENTS

• Node.js 18 or higher
• NPM 9 or higher
• Modern web browser

BACKEND INTEGRATION

The UI is designed to connect to a WebSocket backend at:

ws://localhost:4001


If this service is not running, the UI may show temporary
connection errors. This is normal and expected during UI-only
development. Backend logic lives in a separate repository.

PROJECT GOALS

• Maintain a clean, isolated UI environment
• Remove all legacy sandbox and engine artifacts
• Establish a predictable architecture for future scaling
• Provide a stable foundation for:
- Live emotional signal streaming
- Facilitator overlays
- Multi-signal trendlines
- Pulse bar enhancements
- Full simulation interactions

STATUS

The project is stable and ready for Phase 3+ development work.
Backend and simulation engine integration will occur later.

LICENSE

Private / All rights reserved.

============================================================
END OF FILE — AMPLIFYED PULSE UI README