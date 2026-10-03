// Azure API Management AI Gateway demo — subscription-scope entry point.
// Creates the resource group and deploys every workload resource into it.
targetScope = 'subscription'

@description('Short workload name used in resource names.')
@maxLength(10)
param workload string = 'apimaigw'

@description('Environment name (dev, demo, test, prod).')
param environmentName string = 'demo'

@description('Primary region: API Management, monitoring and the priority-1 Foundry backend.')
param location string = 'swedencentral'

@description('Short code of the primary region used in the resource group name.')
param locationShort string = 'swc'

@description('Regions hosting Foundry (AI Services) model backends. The first entry hosts the content safety endpoint.')
param foundryBackends array = [
  { name: 'swc', location: 'swedencentral', priority: 1, weight: 50 }
  { name: 'frc', location: 'francecentral', priority: 1, weight: 50 }
]

@description('Model deployed on every Foundry backend.')
param modelName string = 'gpt-5.4-nano'

@description('Model version.')
param modelVersion string = '2026-03-17'

@description('Deployment capacity in thousands of tokens per minute (GlobalStandard).')
param modelCapacity int = 50

@description('API Management SKU. BasicV2 is the smallest v2 tier that supports the AI gateway and MCP features used here.')
@allowed([
  'BasicV2'
  'StandardV2'
  'PremiumV2'
  'Developer'
])
param apimSku string = 'BasicV2'

@description('API Management publisher e-mail.')
param publisherEmail string = 'apim-demo@contoso.com'

@description('Owner tag value.')
param owner string = 'apim-demo'

@description('Cost center tag value.')
param costCenter string = 'demo'

var tags = {
  env: environmentName
  workload: workload
  owner: owner
  costCenter: costCenter
  dataClassification: 'public'
}

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: 'rg-${workload}-${environmentName}-${locationShort}'
  location: location
  tags: tags
}

module workloadResources 'resources.bicep' = {
  scope: rg
  name: 'workload-${environmentName}'
  params: {
    workload: workload
    environmentName: environmentName
    location: location
    foundryBackends: foundryBackends
    modelName: modelName
    modelVersion: modelVersion
    modelCapacity: modelCapacity
    apimSku: apimSku
    publisherEmail: publisherEmail
    tags: tags
  }
}

output resourceGroupName string = rg.name
output apimName string = workloadResources.outputs.apimName
output apimGatewayUrl string = workloadResources.outputs.apimGatewayUrl
output inferenceBaseUrl string = workloadResources.outputs.inferenceBaseUrl
output mcpEndpoint string = workloadResources.outputs.mcpEndpoint
output modelDeploymentName string = workloadResources.outputs.modelDeploymentName
output foundryEndpoints array = workloadResources.outputs.foundryEndpoints
output primaryFoundryId string = workloadResources.outputs.primaryFoundryId
output primaryFoundryLocation string = workloadResources.outputs.primaryFoundryLocation
output appInsightsName string = workloadResources.outputs.appInsightsName
output logAnalyticsCustomerId string = workloadResources.outputs.logAnalyticsCustomerId
