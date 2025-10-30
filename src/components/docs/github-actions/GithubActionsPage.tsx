import React from "react";
import { TextBlock } from "../../tools/TextBlock";
import { CodeSnippet } from "../../tools/CodeSnippet";
import { Quiz } from "../../tools/Quiz";
import { Resources } from "../../tools/Resources";
import { MermaidDiagram } from "../../tools/MermaidDiagram";

const GithubActionsPage: React.FC = () => {
  return (
    <div className="space-y-8 p-6">
      <h1 className="text-4xl font-bold mb-8 text-white">
        Pierwsze kroki GitHub Actions: Automatyzacja przepływu pracy w repozytoriach
      </h1>

      <TextBlock
        header="Problem space: Wyzwania tradycyjnych procesów CI/CD"
        text="Przed GitHub Actions, zespoły deweloperskie borykały się z fragmentacją narzędzi CI/CD. Konfiguracja często wymagała oddzielnych kont w Jenkins, CircleCI, czy Travis CI, co prowadziło do:

**Problemy z synchronizacją**:
- Brak natywnej integracji z pull requests i GitHub flow
- Trudności w mapowaniu permission model między GitHub a zewnętrznym CI
- Opóźnienia w propagacji webhooków między systemami

**Wyzwania operacyjne**:
- Wysokie koszty utrzymania self-hosted runnerów lub płatnych planów w wielu serwisach
- Złożoność konfiguracji secrets i environment variables w różnych systemach
- Brak visibility - statusy buildów często ukryte poza GitHub UI

**GitHub Actions rozwiązuje te problemy**:
- Natywna integracja - workflows jako kod w tym samym repozytorium (Infrastructure as Code)
- Unified permissions - wykorzystanie GitHub tokens i RBAC
- GitHub-hosted runners z gotowym tooling (Node.js, Python, Docker, kubectl, etc.)
- Rich marketplace z 20,000+ reusable actions
- Darmowy tier: 2000 minut/miesiąc dla prywatnych repo, unlimited dla public"
      />

      <MermaidDiagram
        diagramPath="/diagrams/github-actions-flow.mmd"
        caption="Architektura i przepływ pracy GitHub Actions"
      />

      <TextBlock
        header="Conceptual architecture: Kluczowe komponenty"
        text="GitHub Actions opiera się na event-driven architecture z hierarchiczną strukturą:

**Warstwa wykonawcza**:
1. **Runner** - Serwer (GitHub-hosted lub self-hosted) wykonujący workflows
   - GitHub-hosted: Ubuntu, Windows, macOS z preinstalled toolchain
   - Self-hosted: Własne maszyny za firewall, custom hardware (GPU), brak limitu minut
2. **Runner Context** - Izolowane środowisko dla każdego joba (clean VM/container)

**Struktura workflow**:
3. **Workflow** - Plik YAML w `.github/workflows/`, może zawierać multiple jobs
4. **Event triggers** - Push, pull_request, schedule (cron), workflow_dispatch (manual), repository_dispatch (API)
5. **Job** - Grupa steps, domyślnie równoległa (parallel) z innymi jobs, chyba że `needs: [job-name]`
6. **Step** - Atomowa operacja: `uses:` (action) lub `run:` (shell command)
7. **Action** - Reusable unit: JavaScript action (runs on runner), Docker action (containerized), Composite action (group of steps)

**Mechanizmy zaawansowane**:
- **Matrix builds** - Równoległa kompilacja na różnych wersjach (node: [18, 20, 22], os: [ubuntu, windows])
- **Artifacts** - Pliki współdzielone między jobs (build output, test reports, coverage)
- **Caching** - Dependency caching (npm, pip, maven) dla przyśpieszenia
- **Environments** - Protected deployments z approval gates i secrets per environment"
      />

      <CodeSnippet
        language="yaml"
        fileName="hello-world.yml"
        code={`name: Hello World Workflow

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  hello:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Say Hello
        run: echo "Hello, GitHub Actions!"`}
      />

      <TextBlock
        header="Practical implementation: Produkcyjny workflow z testami i deployment"
        text="Real-world workflows łączą multiple stages: build, test, security scanning, i deployment. Kluczowe praktyki:

**Separation of concerns**:
- Osobne jobs dla build, test, lint - równoległość skraca czas wykonania
- Conditional execution: `if: github.ref == 'refs/heads/main'` tylko dla production branch
- Job dependencies: `needs: [build, test]` - deploy dopiero po sukcesie testów

**Secrets management**:
- Repository secrets: `\${{ secrets.NPM_TOKEN }}` - nigdy w plain text
- Environment secrets: per-environment (staging vs production) różne credentials
- GITHUB_TOKEN: auto-generated, scoped permissions (read repo, write packages)

**Artifact lifecycle**:
- Upload artifacts po build: `actions/upload-artifact@v4`
- Download w kolejnych jobs: `actions/download-artifact@v4`
- Retention: default 90 dni, konfigurowalne per workflow

**Performance optimization**:
- Cache dependencies: `actions/cache@v4` z key opartym o lock file hash
- Concurrency control: `concurrency: ci-\${{ github.ref }}` - cancel in-progress runs
- Matrix strategy: test against node [18, 20, 22] w parallel"
      />

      <CodeSnippet
        language="yaml"
        fileName="production-workflow.yml"
        code={`name: Production CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
          retention-days: 30

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        if: matrix.node-version == '20'
        with:
          token: \${{ secrets.CODECOV_TOKEN }}

  deploy:
    needs: [build, test]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://myapp.example.com
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/
      
      - name: Deploy to production
        run: |
          echo "Deploying to production server..."
          # rsync, scp, or cloud provider CLI
        env:
          DEPLOY_KEY: \${{ secrets.DEPLOY_SSH_KEY }}`}
      />

      <TextBlock
        header="Advanced patterns: Reusable workflows i Composite actions"
        text="Dla organizacji z wieloma repozytoriami, DRY principle jest kluczowy:

**Reusable workflows** (workflow_call):
- Pełny workflow jako template wywoływany z innego workflow
- Input parameters i secrets przekazywane explicite
- Centralizacja logic - jedna zmiana propaguje się na wszystkie consuming repos
- Use case: Standardowy build-test-deploy dla microservices

**Composite actions**:
- Grupa steps jako reusable action (alternatywa dla JavaScript/Docker action)
- Lżejsze od pełnego workflow, wygodniejsze od copy-paste steps
- Use case: Setup environment (install tools, configure credentials)

**Example composite action structure**:
```yaml
# .github/actions/setup-env/action.yml
name: Setup Development Environment
description: Installs Node.js, caches dependencies
inputs:
  node-version:
    required: true
runs:
  using: composite
  steps:
    - uses: actions/setup-node@v4
    - run: npm ci
```

**Security best practices**:
- Pin actions to specific SHA: `actions/checkout@<full-sha>` zamiast `@v4` w produkcji
- Review third-party actions przed użyciem - supply chain attacks
- Minimal permissions: `permissions: contents: read` zamiast default write
- Separate runners dla untrusted code (forks, external contributors)"
      />

      <Quiz
        title="Sprawdź swoją wiedzę - Podstawy"
        question={{
          question: "Jaka jest główna zaleta używania matrix strategy w GitHub Actions?",
          options: [
            { id: "A", text: "Zmniejsza zużycie minut w limicie" },
            {
              id: "B",
              text: "Umożliwia równoległe testowanie na różnych wersjach dependencies/OS",
            },
            { id: "C", text: "Automatycznie naprawia błędy w testach" },
            { id: "D", text: "Ogranicza liczbę runnerów" },
          ],
          correctAnswer: "B",
          explanation:
            "Matrix strategy pozwala na równoległe wykonanie tego samego joba z różnymi parametrami (np. node: [18, 20, 22], os: [ubuntu, windows]). To kluczowe dla zapewnienia kompatybilności aplikacji z różnymi środowiskami.",
        }}
      />

      <Quiz
        title="Test praktyczny - Artifacts"
        question={{
          question: "Jak przekazać build artifacts z joba 'build' do joba 'deploy' w tym samym workflow?",
          options: [
            { id: "A", text: "Artifacts są automatycznie dostępne między jobami" },
            { id: "B", text: "Użyć actions/upload-artifact w build i actions/download-artifact w deploy" },
            { id: "C", text: "Zapisać do shared volume" },
            { id: "D", text: "Użyć environment variables" },
          ],
          correctAnswer: "B",
          explanation:
            "Każdy job działa w izolowanym runner environment. Aby przekazać pliki między jobami, należy użyć actions/upload-artifact@v4 do publikacji i actions/download-artifact@v4 do pobrania w kolejnym jobie. To standard workflow pattern w CI/CD.",
        }}
      />

      <Quiz
        title="Test zaawansowany - Security"
        question={{
          question: "Dlaczego warto pinować actions do konkretnego SHA zamiast używać version tags (@v4)?",
          options: [
            { id: "A", text: "SHA są szybsze w wykonaniu" },
            { id: "B", text: "Chroni przed supply chain attacks - tag może być przeniesiony na malicious commit" },
            { id: "C", text: "Version tags nie działają w private repos" },
            { id: "D", text: "SHA automatycznie aktualizują się do najnowszej wersji" },
          ],
          correctAnswer: "B",
          explanation:
            "Git tags są mutable - owner repo może przenieść tag @v4 na inny commit, potencjalnie malicious. SHA (commit hash) jest immutable. W środowiskach produkcyjnych best practice to: actions/checkout@<full-40-char-sha>. To defense against supply chain attacks, szczególnie istotne dla third-party actions.",
        }}
      />

      <Resources
        title="Dodatkowe materiały"
        links={[
          {
            title: "GitHub Actions Documentation",
            url: "https://docs.github.com/en/actions",
            description: "Oficjalna dokumentacja z comprehensive guides, syntax reference i troubleshooting tips",
          },
          {
            title: "GitHub Actions Marketplace",
            url: "https://github.com/marketplace?type=actions",
            description: "20,000+ community actions - od AWS/Azure deployment po Slack notifications i security scanning",
          },
          {
            title: "Actions Quickstart Guide",
            url: "https://docs.github.com/en/actions/quickstart",
            description: "Hands-on tutorial: od pierwszego workflow do deployment w 10 minut",
          },
          {
            title: "Workflow Syntax Reference",
            url: "https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions",
            description: "Complete YAML syntax reference: events, jobs, steps, expressions, contexts",
          },
          {
            title: "Security Hardening for GitHub Actions",
            url: "https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions",
            description: "Best practices: secrets management, OIDC federation, minimal permissions, supply chain security",
          },
          {
            title: "Awesome Actions - Curated List",
            url: "https://github.com/sdras/awesome-actions",
            description: "Community-curated collection najlepszych actions, workflows i learning resources",
          },
        ]}
      />
    </div>
  );
};

export default GithubActionsPage;
