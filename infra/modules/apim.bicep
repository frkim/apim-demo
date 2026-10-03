// Azure API Management (v2 tier) with system-assigned managed identity and loggers.
param apimName string
param location string
param sku string
param publisherEmail string
param logAnalyticsId string
param appInsightsId string
param appInsightsInstrumentationKey string
param tags object

resource apim 'Microsoft.ApiManagement/service@2024-06-01-preview' = {
  name: apimName
  location: location
  tags: tags
  sku: {
    name: sku
    capacity: 1
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    publisherEmail: publisherEmail
    publisherName: 'AI Gateway demo'
  }
}

resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: apim
  name: 'apim-to-log-analytics'
  properties: {
    workspaceId: logAnalyticsId
    logAnalyticsDestinationType: 'Dedicated'
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

// Azure Monitor logger: gateway + LLM request/response logs (ApiManagementGatewayLlmLog table).
resource azureMonitorLogger 'Microsoft.ApiManagement/service/loggers@2024-06-01-preview' = {
  parent: apim
  name: 'azuremonitor'
  properties: {
    loggerType: 'azureMonitor'
    isBuffered: false
  }
}

// Application Insights logger: traces + custom token metrics from llm-emit-token-metric.
resource appInsightsLogger 'Microsoft.ApiManagement/service/loggers@2024-06-01-preview' = {
  parent: apim
  name: 'appinsights-logger'
  properties: {
    loggerType: 'applicationInsights'
    description: 'Application Insights logger'
    resourceId: appInsightsId
    isBuffered: false
    credentials: {
      instrumentationKey: appInsightsInstrumentationKey
    }
  }
}

output id string = apim.id
output name string = apim.name
output principalId string = apim.identity.principalId
output gatewayUrl string = apim.properties.gatewayUrl
output azureMonitorLoggerId string = azureMonitorLogger.id
output appInsightsLoggerId string = appInsightsLogger.id
