import React from "react";
import { TextBlock } from "../../tools/TextBlock";
import { CodeSnippet } from "../../tools/CodeSnippet";
import { Quiz } from "../../tools/Quiz";
import { Resources } from "../../tools/Resources";
import { MermaidDiagram } from "../../tools/MermaidDiagram";

const AzureCicdPage: React.FC = () => {
  return (
    <div className="space-y-8 p-6">
      <h1 className="text-4xl font-bold mb-8 text-white">
        Pierwsze kroki z CI/CD w AZURE: Automatyzacja pipeline'ów w chmurze Microsoft
      </h1>

      <TextBlock
        header="Problem space: Wyzwania enterprise CI/CD przed Azure DevOps"
        text="Organizacje korzystające z ekosystemu Microsoft borykały się z fragmentacją narzędzi przed wprowadzeniem Azure DevOps:

**Problemy z integracją**:
- Rozproszenie między Team Foundation Server (TFS), Visual Studio Team Services (VSTS) i zewnętrznymi CI/CD
- Brak natywnej integracji z Azure Resource Manager (ARM) i Microsoft Entra ID (dawniej Azure AD)
- Złożoność w zarządzaniu permissions między on-premises a cloud workloads
- Limited visibility w deployment pipelines dla multi-cloud/hybrid scenarios

**Wyzwania operacyjne**:
- Wysokie koszty utrzymania self-hosted TFS z dedykowanymi build agents
- Brak unified dashboard dla code, builds, tests, i deployments
- Trudności w orchestration Infrastructure as Code (Bicep, ARM templates)
- Manualna konfiguracja service connections do Azure subscriptions

**Azure DevOps i Azure Pipelines rozwiązują te problemy**:
- Unified platform - repos, boards, pipelines, artifacts w jednym miejscu
- Native Azure integration - service principals, managed identities, RBAC
- Microsoft-hosted agents z preinstalowanym tooling (Azure CLI, PowerShell, .NET SDK)
- YAML pipelines as code z multi-stage approval gates
- Darmowy tier: 1800 minut/miesiąc Microsoft-hosted parallel jobs, unlimited dla public projects
- Enterprise-grade security: Azure Key Vault integration, secret scanning, policy compliance"
      />

      <MermaidDiagram
        diagramPath="/diagrams/azure-pipelines-architecture.mmd"
        caption="Architektura Azure DevOps Pipelines i przepływ deployment"
      />

      <TextBlock
        header="Conceptual architecture: Komponenty Azure Pipelines"
        text="Azure Pipelines opiera się na cloud-native architecture z głęboką integracją z Azure:

**Warstwa wykonawcza**:
1. **Agent pools** - Microsoft-hosted (Ubuntu, Windows, macOS) lub self-hosted agents
   - Microsoft-hosted: preinstalled Azure CLI, PowerShell 7, Terraform, kubectl
   - Self-hosted: behind firewall, access to on-premises resources, custom software
   - Scale sets: auto-scaling agents based on queue demand
2. **Service connections** - Secured identity management
   - Service Principal: app registration w Microsoft Entra ID
   - Managed Identity: RBAC-based access bez credentials storage
   - ARM service endpoint: scope do subscription/resource group level

**Pipeline struktura (YAML)**:
3. **Pipeline** - Definicja w azure-pipelines.yml w repo root
4. **Stages** - Logiczne grouping (Build, Test, Deploy-Staging, Deploy-Production)
5. **Jobs** - Execution unit na agencie, domyślnie parallel między stages
6. **Steps** - Atomic tasks: PowerShell scripts, Azure CLI, ARM/Bicep deployment
7. **Tasks** - Prebuilt extensions z Marketplace (Docker, Kubernetes, npm, Maven)

**Azure-specific features**:
- **Environments** - Target environments (dev/staging/prod) z approval policies
- **Variable groups** - Reusable secrets/configs, integration z Azure Key Vault
- **Artifacts** - Universal packages (NuGet, npm) hosted w Azure Artifacts
- **Gates** - Pre/post deployment checks (Azure Monitor queries, REST API health checks)
- **Multi-stage YAML** - Single pipeline file z dev->staging->prod progression

**Infrastructure as Code integration**:
- Bicep/ARM template deployment via AzureResourceManagerTemplateDeployment task
- Terraform with Azure backend (storage account for state)
- Azure Policy compliance checks przed deployment"
      />

      <CodeSnippet
        language="yaml"
        fileName="azure-pipelines-hello.yml"
        code={`# Minimal Azure Pipeline - Hello World
trigger:
  branches:
    include:
    - main

pool:
  vmImage: 'ubuntu-latest'

steps:
- script: echo "Hello, Azure Pipelines!"
  displayName: 'Run hello world script'

- task: AzureCLI@2
  displayName: 'Azure CLI - List Resource Groups'
  inputs:
    azureSubscription: 'MyAzureConnection'
    scriptType: 'bash'
    scriptLocation: 'inlineScript'
    inlineScript: |
      az group list --output table`}
      />

      <TextBlock
        header="Practical implementation: Multi-stage pipeline z ARM deployment"
        text="Production-ready Azure Pipeline łączy CI/CD dla aplikacji i infrastruktury:

**Multi-stage pattern**:
- Separation of concerns: Build -> Test -> Deploy Infrastructure -> Deploy App
- Stage dependencies: `dependsOn: [Build, Test]` zapewnia sequential execution
- Manual approvals: environment-level gates dla production deployments
- Conditional execution: `condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))`

**ARM/Bicep Infrastructure as Code**:
- Deployment task: `AzureResourceManagerTemplateDeployment@3`
- Incremental mode: update tylko zmienione resources
- Validation: `deploymentMode: 'Validation'` przed actual deployment
- Output variables: ARM outputs przekazane do kolejnych stages

**Azure App Service deployment**:
- Slot deployment: deploy do staging slot, swap do production (zero downtime)
- AzureWebApp task: supports .NET, Node.js, Python, Java
- Connection string injection: secure configuration via variable groups

**Security best practices**:
- Service connection z Managed Identity zamiast Service Principal z secret
- Variable groups linked to Azure Key Vault: automatic secret refresh
- Artifact signing: code signing certificates stored w Key Vault
- Branch policies: require build validation before PR merge

**Cost optimization**:
- Self-hosted agents dla long-running jobs (>60min) zamiast Microsoft-hosted
- Parallel jobs: matrix strategy dla multi-region deployments
- Artifact retention policies: cleanup old builds after 30 days"
      />

      <CodeSnippet
        language="yaml"
        fileName="azure-pipelines-multistage.yml"
        code={`# Production Multi-Stage Pipeline
trigger:
  branches:
    include:
    - main
    - develop

variables:
  azureSubscription: 'Production-ServiceConnection'
  resourceGroupName: 'rg-myapp-prod'
  webAppName: 'webapp-myapp-prod'
  location: 'West Europe'

stages:
- stage: Build
  displayName: 'Build Application'
  jobs:
  - job: BuildJob
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '20.x'
      displayName: 'Install Node.js'
    
    - script: |
        npm ci
        npm run build
        npm test
      displayName: 'npm install, build and test'
    
    - task: ArchiveFiles@2
      displayName: 'Archive build artifacts'
      inputs:
        rootFolderOrFile: '$(System.DefaultWorkingDirectory)/dist'
        includeRootFolder: false
        archiveType: 'zip'
        archiveFile: '$(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip'
    
    - publish: '$(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip'
      artifact: drop
      displayName: 'Publish build artifacts'

- stage: DeployInfrastructure
  displayName: 'Deploy Azure Infrastructure'
  dependsOn: Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - job: DeployARM
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: AzureResourceManagerTemplateDeployment@3
      displayName: 'Validate ARM Template'
      inputs:
        deploymentScope: 'Resource Group'
        azureResourceManagerConnection: '$(azureSubscription)'
        subscriptionId: '$(subscriptionId)'
        action: 'Create Or Update Resource Group'
        resourceGroupName: '$(resourceGroupName)'
        location: '$(location)'
        templateLocation: 'Linked artifact'
        csmFile: '$(System.DefaultWorkingDirectory)/infrastructure/main.bicep'
        csmParametersFile: '$(System.DefaultWorkingDirectory)/infrastructure/main.parameters.json'
        deploymentMode: 'Validation'
    
    - task: AzureResourceManagerTemplateDeployment@3
      displayName: 'Deploy ARM Template'
      inputs:
        deploymentScope: 'Resource Group'
        azureResourceManagerConnection: '$(azureSubscription)'
        subscriptionId: '$(subscriptionId)'
        action: 'Create Or Update Resource Group'
        resourceGroupName: '$(resourceGroupName)'
        location: '$(location)'
        templateLocation: 'Linked artifact'
        csmFile: '$(System.DefaultWorkingDirectory)/infrastructure/main.bicep'
        csmParametersFile: '$(System.DefaultWorkingDirectory)/infrastructure/main.parameters.json'
        deploymentMode: 'Incremental'

- stage: DeployApp
  displayName: 'Deploy Application to Azure'
  dependsOn: DeployInfrastructure
  jobs:
  - deployment: DeployWeb
    displayName: 'Deploy to App Service'
    pool:
      vmImage: 'ubuntu-latest'
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - download: current
            artifact: drop
          
          - task: AzureWebApp@1
            displayName: 'Deploy to Staging Slot'
            inputs:
              azureSubscription: '$(azureSubscription)'
              appType: 'webAppLinux'
              appName: '$(webAppName)'
              deployToSlotOrASE: true
              resourceGroupName: '$(resourceGroupName)'
              slotName: 'staging'
              package: '$(Pipeline.Workspace)/drop/$(Build.BuildId).zip'
          
          - task: AzureAppServiceManage@0
            displayName: 'Swap Staging to Production'
            inputs:
              azureSubscription: '$(azureSubscription)'
              action: 'Swap Slots'
              webAppName: '$(webAppName)'
              resourceGroupName: '$(resourceGroupName)'
              sourceSlot: 'staging'
              targetSlot: 'production'`}
      />

      <TextBlock
        header="Advanced patterns: Multi-repo pipelines i Template reusability"
        text="Enterprise-scale Azure DevOps wymaga shared pipeline logic:

**Template repositories**:
- Centralized YAML templates w dedykowanym repo
- Resource reference: `repository: templates` + `template: templates/build.yml@templates`
- Versioning: pin do specific commit/tag dla stability
- Use case: Organizational standards - security scans, compliance checks

**Multi-repo triggers**:
- Orchestration pipeline trigger'owany z multiple source repos
- Use case: Microservices deployment - shared infrastructure repo + app repos
- Pipeline coordination: `resources.repositories` z trigger filters

**Variable templates i Key Vault integration**:
```yaml
variables:
- group: 'prod-secrets'  # Variable group linked to Azure Key Vault
- template: /templates/common-vars.yml@templates
```

**Deployment strategies**:
- **Blue-Green**: Deploy do separate slot/environment, swap traffic
- **Canary**: Gradual rollout - 10% traffic -> 50% -> 100% based on metrics
- **Rolling**: Update instances incrementally (Kubernetes rolling update)

**Monitoring i rollback automation**:
- Azure Monitor integration: query Application Insights metrics post-deployment
- Automated rollback: `gates` z Azure Monitor query - if error rate > threshold, fail deployment
- Notifications: integration z Microsoft Teams, Slack via Webhooks

**Example gate configuration**:
```yaml
environment: production
gates:
- task: AzureMonitor@1
  inputs:
    azureSubscription: '$(azureSubscription)'
    resourceGroup: '$(resourceGroupName)'
    resourceType: 'Microsoft.Insights/components'
    resourceName: 'appinsights-myapp'
    metricName: 'requests/failed'
    timeRange: 'PT5M'
    threshold: '5'
```

**Self-hosted agents with scale sets**:
- Azure VM Scale Sets as agent pools - auto-scaling based on queue
- Private networking: agents with access to on-premises databases/APIs
- Custom images: pre-baked VMs z proprietary software, certificates"
      />

      <Quiz
        title="Sprawdź swoją wiedzę - Podstawy"
        question={{
          question: "Jaka jest główna różnica między Microsoft-hosted a self-hosted agents w Azure Pipelines?",
          options: [
            { id: "A", text: "Microsoft-hosted są zawsze szybsze" },
            {
              id: "B",
              text: "Self-hosted agents mogą uzyskać dostęp do zasobów on-premises i nie mają limitu minut",
            },
            { id: "C", text: "Microsoft-hosted nie obsługują Windows" },
            { id: "D", text: "Self-hosted są darmowe dla wszystkich" },
          ],
          correctAnswer: "B",
          explanation:
            "Self-hosted agents to własne maszyny (on-premises lub VM) z zainstalowanym Azure Pipelines Agent. Główne zalety: dostęp do zasobów za firewall, brak limitu minut wykonania, możliwość instalacji custom software. Microsoft-hosted oferują convenience i preinstalled tooling, ale mają limit minut i brak dostępu do private networks.",
        }}
      />

      <Quiz
        title="Test praktyczny - Service Connections"
        question={{
          question: "Która metoda uwierzytelniania do Azure subscription jest najbezpieczniejsza w production environments?",
          options: [
            { id: "A", text: "Service Principal z secretem w Variable Group" },
            { id: "B", text: "Managed Identity z RBAC permissions" },
            { id: "C", text: "Azure CLI z shared credentials" },
            { id: "D", text: "Personal Access Token (PAT)" },
          ],
          correctAnswer: "B",
          explanation:
            "Managed Identity eliminuje potrzebę przechowywania credentials (secrets). Self-hosted agent z managed identity automatycznie otrzymuje token z Azure Instance Metadata Service. RBAC (Role-Based Access Control) na poziomie subscription/resource group zapewnia principle of least privilege. Dla Microsoft-hosted agents, Service Principal z federated credentials (workload identity) jest drugim najlepszym wyborem.",
        }}
      />

      <Quiz
        title="Test zaawansowany - Deployment Strategies"
        question={{
          question: "W jakim scenariuszu deployment do Azure App Service staging slot z późniejszym swap jest lepszy od direct production deployment?",
          options: [
            { id: "A", text: "Zawsze - staging slot jest szybszy" },
            {
              id: "B",
              text: "Gdy potrzebujemy zero-downtime deployment i możliwości instant rollback",
            },
            { id: "C", text: "Tylko dla aplikacji .NET" },
            { id: "D", text: "Staging slots są wymagane przez Azure Policy" },
          ],
          correctAnswer: "B",
          explanation:
            "Deployment do staging slot pozwala na warm-up aplikacji (init connections, cache preload) przed przyjęciem traffic. Slot swap to atomic operation (~30s) z instant rollback capability - wystarczy swap z powrotem. Direct production deployment powoduje cold start i downtime podczas update. Production-grade apps zawsze używają slot swap pattern. Dodatkowo, staging slot może mieć smoke tests przed swapem.",
        }}
      />

      <CodeSnippet
        language="bicep"
        fileName="main.bicep"
        code={`// Example Bicep template deployed by Azure Pipeline
param location string = resourceGroup().location
param appName string
param environment string

var appServicePlanName = 'asp-\${appName}-\${environment}'
var webAppName = 'webapp-\${appName}-\${environment}'

resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'P1v3'
    tier: 'PremiumV3'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
    }
    httpsOnly: true
  }
}

resource stagingSlot 'Microsoft.Web/sites/slots@2023-01-01' = {
  parent: webApp
  name: 'staging'
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
    }
  }
}

output webAppUrl string = 'https://\${webApp.properties.defaultHostName}'
output stagingSlotUrl string = 'https://\${stagingSlot.properties.defaultHostName}'`}
      />

      <Resources
        title="Dodatkowe materiały"
        links={[
          {
            title: "Azure Pipelines Documentation",
            url: "https://learn.microsoft.com/en-us/azure/devops/pipelines/",
            description: "Oficjalna dokumentacja Microsoft z complete reference dla YAML syntax, tasks, i best practices",
          },
          {
            title: "Azure DevOps Labs",
            url: "https://azuredevopslabs.com/",
            description: "Hands-on labs z step-by-step tutorials dla Azure Boards, Repos, Pipelines, Test Plans",
          },
          {
            title: "Azure Pipelines YAML Schema",
            url: "https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema/",
            description: "Complete YAML schema reference z wszystkimi keywords, stages, jobs, tasks, templates",
          },
          {
            title: "Azure Bicep Documentation",
            url: "https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/",
            description: "Infrastructure as Code dla Azure - bardziej czytelna alternatywa dla ARM templates JSON",
          },
          {
            title: "Azure Pipeline Tasks Marketplace",
            url: "https://marketplace.visualstudio.com/azuredevops",
            description: "Thousands of extensions - Docker, Kubernetes, Terraform, security scanning, notifications",
          },
          {
            title: "Azure DevOps Security Best Practices",
            url: "https://learn.microsoft.com/en-us/azure/devops/organizations/security/security-best-practices",
            description: "Enterprise security: service connections, secrets management, pipeline permissions, compliance",
          },
          {
            title: "Azure Monitor with Pipelines",
            url: "https://learn.microsoft.com/en-us/azure/devops/pipelines/integrations/azure-monitor",
            description: "Integration z Application Insights dla automated deployment gates i monitoring",
          },
        ]}
      />
    </div>
  );
};

export default AzureCicdPage;

