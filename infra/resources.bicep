// Workload resources for the AI Gateway demo (resource-group scope).
targetScope = 'resourceGroup'

param workload string
param environmentName string
param location string
param foundryBackends array
param modelName string
param modelVersion string
param modelCapacity int
param apimSku string
param publisherEmail string
param tags object

var suffix = take(uniqueString(subscription().id, resourceGroup().id), 6)

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring'
  params: {
    logAnalyticsName: 'log-${workload}-${environmentName}-${suffix}'
    appInsightsName: 'appi-${workload}-${environmentName}-${suffix}'
    location: location
    tags: tags
  }
}

module apim 'modules/apim.bicep' = {
  name: 'apim'
  params: {
    apimName: 'apim-${workload}-${environmentName}-${suffix}'
    location: location
    sku: apimSku
    publisherEmail: publisherEmail
    logAnalyticsId: monitoring.outputs.logAnalyticsId
    appInsightsId: monitoring.outputs.appInsightsId
    appInsightsInstrumentationKey: monitoring.outputs.appInsightsInstrumentationKey
    tags: tags
  }
}

module foundry 'modules/foundry.bicep' = [for backend in foundryBackends: {
  name: 'foundry-${backend.name}'
  params: {
    accountName: 'ais-${workload}-${environmentName}-${suffix}-${backend.name}'
    projectName: 'proj-${workload}-${backend.name}'
    location: backend.location
    modelName: modelName
    modelVersion: modelVersion
    modelCapacity: modelCapacity
    apimPrincipalId: apim.outputs.principalId
    logAnalyticsId: monitoring.outputs.logAnalyticsId
    tags: tags
  }
}]

module gateway 'modules/ai-gateway.bicep' = {
  name: 'ai-gateway'
  params: {
    apimName: apim.outputs.name
    backends: [for (backend, i) in foundryBackends: {
      name: 'foundry-${backend.name}'
      endpoint: foundry[i].outputs.foundryEndpoint
      priority: backend.priority
      weight: backend.weight
    }]
    contentSafetyEndpoint: foundry[0].outputs.endpoint
    appInsightsLoggerId: apim.outputs.appInsightsLoggerId
    azureMonitorLoggerId: apim.outputs.azureMonitorLoggerId
  }
}

output apimName string = apim.outputs.name
output apimGatewayUrl string = apim.outputs.gatewayUrl
output inferenceBaseUrl string = '${apim.outputs.gatewayUrl}/${gateway.outputs.inferenceApiPath}/v1'
output mcpEndpoint string = gateway.outputs.mcpEndpoint
output modelDeploymentName string = modelName
output foundryEndpoints array = [for (backend, i) in foundryBackends: {
  name: backend.name
  location: backend.location
  endpoint: foundry[i].outputs.foundryEndpoint
  projectEndpoint: foundry[i].outputs.projectEndpoint
}]
output primaryFoundryId string = foundry[0].outputs.id
output primaryFoundryProjectEndpoint string = foundry[0].outputs.projectEndpoint
output primaryFoundryLocation string = foundryBackends[0].location
output appInsightsName string = monitoring.outputs.appInsightsName
output logAnalyticsCustomerId string = monitoring.outputs.logAnalyticsCustomerId
