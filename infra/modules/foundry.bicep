// Microsoft Foundry resource (current platform, not classic) with a Foundry project and one model deployment.
// A Foundry resource is a Microsoft.CognitiveServices account of kind AIServices with project management enabled;
// the project makes it visible and usable in the current Foundry portal (https://ai.azure.com).
// Local (key) auth is disabled: API Management calls the models with its managed identity.
param accountName string
param projectName string
param location string
param modelName string
param modelVersion string
param modelCapacity int
param apimPrincipalId string
param logAnalyticsId string
param tags object

@description('Optional principal (for example the deployment identity) granted Foundry User + Speech User for demo tooling.')
param operatorPrincipalId string = deployer().objectId

var roles = {
  cognitiveServicesUser: 'a97b65f3-24c7-4388-baec-2e87135dc908'
  cognitiveServicesOpenAIUser: '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'
  cognitiveServicesSpeechUser: 'f2dc8367-1007-4938-bd23-fe263f013447'
  foundryUser: '53ca6127-db72-4b80-b1b0-d745d6d5456d'
}

resource account 'Microsoft.CognitiveServices/accounts@2026-07-01' = {
  name: accountName
  location: location
  tags: tags
  kind: 'AIServices'
  sku: {
    name: 'S0'
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    customSubDomainName: accountName
    disableLocalAuth: true
    publicNetworkAccess: 'Enabled'
    // Required for a Foundry resource: enables Foundry projects (current Foundry portal and APIs).
    allowProjectManagement: true
  }
}

resource project 'Microsoft.CognitiveServices/accounts/projects@2026-07-01' = {
  parent: account
  name: projectName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    displayName: 'Zava AI Gateway (${location})'
    description: 'Foundry project for the Azure API Management AI Gateway demo.'
  }
}

resource deployment 'Microsoft.CognitiveServices/accounts/deployments@2026-07-01' = {
  parent: account
  name: modelName
  sku: {
    name: 'GlobalStandard'
    capacity: modelCapacity
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: modelName
      version: modelVersion
    }
    versionUpgradeOption: 'OnceNewDefaultVersionAvailable'
  }
  dependsOn: [
    project
  ]
}

// APIM → models (OpenAI data plane) and APIM → content safety (Cognitive Services data plane).
resource apimOpenAIUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: account
  name: guid(account.id, apimPrincipalId, roles.cognitiveServicesOpenAIUser)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.cognitiveServicesOpenAIUser)
    principalId: apimPrincipalId
    principalType: 'ServicePrincipal'
  }
}

resource apimCognitiveServicesUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: account
  name: guid(account.id, apimPrincipalId, roles.cognitiveServicesUser)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.cognitiveServicesUser)
    principalId: apimPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// Lets the operator open the project in the Foundry portal and use it (playground, evaluations).
resource operatorFoundryUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(operatorPrincipalId)) {
  scope: account
  name: guid(account.id, operatorPrincipalId, roles.foundryUser)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.foundryUser)
    principalId: operatorPrincipalId
  }
}

// Lets the operator generate the demo video narration with Azure AI Speech (Entra ID, no keys).
resource operatorSpeechUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(operatorPrincipalId)) {
  scope: account
  name: guid(account.id, operatorPrincipalId, roles.cognitiveServicesSpeechUser)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.cognitiveServicesSpeechUser)
    principalId: operatorPrincipalId
  }
}

resource diagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: account
  name: 'foundry-to-log-analytics'
  properties: {
    workspaceId: logAnalyticsId
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

output id string = account.id
output name string = account.name
@description('Cognitive Services endpoint, used for Azure AI Content Safety and Speech.')
output endpoint string = account.properties.endpoint
@description('Foundry endpoint that serves the OpenAI v1 API (/openai/v1).')
output foundryEndpoint string = 'https://${accountName}.services.ai.azure.com/'
@description('Foundry project endpoint for the Foundry SDK and Agent Service.')
output projectEndpoint string = 'https://${accountName}.services.ai.azure.com/api/projects/${project.name}'
output projectName string = project.name
output deploymentName string = deployment.name
