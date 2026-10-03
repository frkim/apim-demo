// Microsoft Foundry (AI Services) account with one model deployment.
// Local (key) auth is disabled: API Management calls it with its managed identity.
param accountName string
param location string
param modelName string
param modelVersion string
param modelCapacity int
param apimPrincipalId string
param logAnalyticsId string
param tags object

@description('Optional principal (for example the deployment identity) granted Speech + OpenAI user roles for demo tooling.')
param operatorPrincipalId string = deployer().objectId

var roles = {
  cognitiveServicesUser: 'a97b65f3-24c7-4388-baec-2e87135dc908'
  cognitiveServicesOpenAIUser: '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'
  cognitiveServicesSpeechUser: 'f2dc8367-1007-4938-bd23-fe263f013447'
}

resource account 'Microsoft.CognitiveServices/accounts@2025-06-01' = {
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
    allowProjectManagement: true
  }
}

resource deployment 'Microsoft.CognitiveServices/accounts/deployments@2025-06-01' = {
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
output endpoint string = account.properties.endpoint
output deploymentName string = deployment.name
