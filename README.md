# Applica

Applica is an AI-powered CV/Resume editor and application tracker designed to help candidates tailor their resumes and cover letters to target job descriptions. All data is stored locally, and it supports both cloud-based LLMs (Google Gemini) and locally-hosted LLMs (Ollama, LM Studio) to ensure full privacy.

---

## Key Features

- **Local-First Privacy**: All profiles, resumes, and application histories are stored in a local SQLite database. No personal data is sent to external servers unless using cloud AI.
- **AI-Powered JD Analysis**: Paste a job description or URL, and Applica will automatically extract key responsibilities, qualifications, required skills, and salary/location details.
- **ATS Scoring & Match Analysis**: Scores your resume against the job description, identifies missing keywords, and offers concrete recommendations to pass automated screens.
- **Rich Text Editor**: A tailored editor built on TipTap with structural sections (header, experience, education, skills, certifications) and live side-by-side preview.
- **Automated Resume Tailoring**: Generates tailored bullet points and professional summaries aligned with your candidate profile and the target job description.
- **Cover Letter Generator**: Drafts customized cover letters matching your writing tone and experiences to the role.
- **Multiple AI Providers**: Set up cloud-based Google Gemini or run local models (Ollama, LM Studio) for completely free, private generation.
- **Export Formats**: Programmatic export to standard PDF and fully styled Microsoft Word (.docx) formats.

---

## Getting Started

### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **C++ Build Tools**: Required on your host machine to compile the native SQLite module (`better-sqlite3`).
  - *Windows*: Visual Studio Build Tools (with C++ Desktop development) or run `npm install --global windows-build-tools` from an elevated shell.
  - *macOS*: Xcode Command Line Tools (`xcode-select --install`).
  - *Linux*: `build-essential`.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/santosh-limbu/applica.git
   cd applica
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. **Rebuild Native Modules** (Crucial Step):
   Compile the SQLite binary (`better-sqlite3`) to match your specific Electron runtime version:
   ```bash
   npm run rebuild
   ```

### Running the App
Start the development server for both the Electron main process and Vite renderer:
```bash
npm run dev
```

### Building Installers
Package Applica into production installers for your operating system:
- **Windows**: `npm run build:win`
- **macOS**: `npm run build:mac`
- **Linux**: `npm run build:linux`

---

## AI Configuration Guide

Applica supports multiple AI backends, which can be configured during the first-run onboarding or anytime via **Settings**.

### 1. Google Gemini (Cloud)
- Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
- Enter the key in Settings and choose your model (e.g. `gemini-2.5-flash` or `gemini-2.5-pro`).

### 2. Ollama (Local)
- Download and run [Ollama](https://ollama.com/).
- Download a model (e.g., `llama3.2`, `mistral`, or `phi3`):
  ```bash
  ollama run llama3.2
  ```
- Select **Ollama** in Applica Settings. The application will auto-detect and display all models installed on your machine.

### 3. OpenAI-Compatible API (Local/Custom)
- For toolsets like **LM Studio**, start a local inference server.
- Select **OpenAI-Compatible** in Applica Settings.
- Input the server endpoint (e.g. `http://localhost:1234/v1`) and the exact model identifier.

---

## Troubleshooting

### Windows Execution Policy Errors
If you run into an execution policy error when trying to run npm scripts in PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Native SQLite Module Failure
If the application loads to a white screen or throws a "better-sqlite3.node was compiled against a different Node.js version" error:
1. Delete `node_modules`.
2. Run `npm install`.
3. Run `npm run rebuild`.

---

## License

This project is licensed under the MIT License.
