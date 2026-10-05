// AI gateway configuration: backends, load-balanced pool, inference API, products (token budgets),
// observability, and a REST API exposed as an MCP server.
param apimName string

@description('Foundry backends: name, endpoint, priority, weight.')
param backends array

@description('Endpoint used by llm-content-safety (a Foundry resource exposes the Content Safety API on its Cognitive Services endpoint).')
param contentSafetyEndpoint string

param appInsightsLoggerId string
param azureMonitorLoggerId string

@description('Token budgets per product (team).')
param products array = [
  {
    name: 'gold'
    displayName: 'Gold - Customer Support Copilot'
    tokensPerMinute: 20000
    tokenQuota: 5000000
  }
  {
    name: 'bronze'
    displayName: 'Bronze - Marketing Sandbox'
    tokensPerMinute: 300
    tokenQuota: 100000
  }
]

var inferenceApiPath = 'inference/openai'
var mcpPath = 'zava-mcp'

resource apim 'Microsoft.ApiManagement/service@2024-06-01-preview' existing = {
  name: apimName
}

// ---------- Backends ----------

resource foundryBackends 'Microsoft.ApiManagement/service/backends@2024-06-01-preview' = [for backend in backends: {
  parent: apim
  name: backend.name
  properties: {
    description: 'Foundry backend ${backend.name}'
    url: '${backend.endpoint}openai'
    protocol: 'http'
    circuitBreaker: {
      rules: [
        {
          name: 'trip-on-throttling'
          failureCondition: {
            count: 1
            interval: 'PT1M'
            statusCodeRanges: [
              {
                min: 429
                max: 429
              }
              {
                min: 500
                max: 503
              }
            ]
            errorReasons: [
              'Server errors'
            ]
          }
          tripDuration: 'PT1M'
          acceptRetryAfter: true
        }
      ]
    }
  }
}]

resource foundryPool 'Microsoft.ApiManagement/service/backends@2024-06-01-preview' = {
  parent: apim
  name: 'foundry-pool'
  // BCP035: url and protocol are not used by Pool backends.
  #disable-next-line BCP035
  properties: {
    description: 'Load-balanced pool of regional Foundry backends'
    type: 'Pool'
    pool: {
      services: [for (backend, i) in backends: {
        id: '/backends/${foundryBackends[i].name}'
        priority: backend.priority
        weight: backend.weight
      }]
    }
  }
}

resource contentSafetyBackend 'Microsoft.ApiManagement/service/backends@2024-06-01-preview' = {
  parent: apim
  name: 'content-safety'
  properties: {
    description: 'Azure AI Content Safety (Prompt Shields + harm categories)'
    url: contentSafetyEndpoint
    protocol: 'http'
    credentials: {
      #disable-next-line BCP037
      managedIdentity: {
        resource: 'https://cognitiveservices.azure.com'
      }
    }
  }
}

// ---------- Inference API (OpenAI v1 compatible pass-through) ----------

resource inferenceApi 'Microsoft.ApiManagement/service/apis@2025-03-01-preview' = {
  parent: apim
  name: 'inference-api'
  properties: {
    displayName: 'AI Gateway - Inference API'
    description: 'OpenAI v1 compatible endpoint fronting regional Microsoft Foundry deployments.'
    path: inferenceApiPath
    apiType: 'http'
    type: 'http'
    protocols: [
      'https'
    ]
    subscriptionRequired: true
    subscriptionKeyParameterNames: {
      header: 'api-key'
      query: 'api-key'
      #disable-next-line BCP037
      bearer: 'enabled'
    }
  }
}

resource inferencePost 'Microsoft.ApiManagement/service/apis/operations@2024-06-01-preview' = {
  parent: inferenceApi
  name: 'post-any'
  properties: {
    displayName: 'POST /*'
    method: 'POST'
    urlTemplate: '/*'
  }
}

resource inferenceGet 'Microsoft.ApiManagement/service/apis/operations@2024-06-01-preview' = {
  parent: inferenceApi
  name: 'get-any'
  properties: {
    displayName: 'GET /*'
    method: 'GET'
    urlTemplate: '/*'
  }
}

resource inferencePolicy 'Microsoft.ApiManagement/service/apis/policies@2024-06-01-preview' = {
  parent: inferenceApi
  name: 'policy'
  properties: {
    format: 'rawxml'
    value: loadTextContent('../policies/inference-api.xml')
  }
  dependsOn: [
    foundryPool
    contentSafetyBackend
  ]
}

// LLM logging (prompts + completions) to Log Analytics: ApiManagementGatewayLlmLog.
resource inferenceAzureMonitorDiagnostics 'Microsoft.ApiManagement/service/apis/diagnostics@2024-06-01-preview' = {
  parent: inferenceApi
  name: 'azuremonitor'
  properties: {
    alwaysLog: 'allErrors'
    verbosity: 'information'
    logClientIp: true
    loggerId: azureMonitorLoggerId
    sampling: {
      samplingType: 'fixed'
      percentage: 100
    }
    #disable-next-line BCP037
    largeLanguageModel: {
      logs: 'enabled'
      requests: {
        messages: 'all'
        maxSizeInBytes: 262144
      }
      responses: {
        messages: 'all'
        maxSizeInBytes: 262144
      }
    }
  }
}

// Application Insights: request telemetry + custom token metrics (metrics: true is required).
resource inferenceAppInsightsDiagnostics 'Microsoft.ApiManagement/service/apis/diagnostics@2024-06-01-preview' = {
  parent: inferenceApi
  name: 'applicationinsights'
  properties: {
    alwaysLog: 'allErrors'
    httpCorrelationProtocol: 'W3C'
    verbosity: 'information'
    logClientIp: true
    loggerId: appInsightsLoggerId
    metrics: true
    sampling: {
      samplingType: 'fixed'
      percentage: 100
    }
  }
}

// ---------- Retail REST API exposed as an MCP server ----------

resource retailApi 'Microsoft.ApiManagement/service/apis@2024-06-01-preview' = {
  parent: apim
  name: 'zava-retail-api'
  properties: {
    displayName: 'Zava Retail API'
    description: 'Product search and order tracking (mocked by API Management).'
    path: 'zava'
    apiType: 'http'
    protocols: [
      'https'
    ]
    subscriptionRequired: true
    subscriptionKeyParameterNames: {
      header: 'api-key'
      query: 'api-key'
    }
    format: 'openapi+json'
    value: loadTextContent('../specs/retail-api.openapi.json')
  }
}

resource retailPolicy 'Microsoft.ApiManagement/service/apis/policies@2024-06-01-preview' = {
  parent: retailApi
  name: 'policy'
  properties: {
    format: 'rawxml'
    value: loadTextContent('../policies/retail-api.xml')
  }
}

resource searchProductsOperation 'Microsoft.ApiManagement/service/apis/operations@2024-06-01-preview' existing = {
  parent: retailApi
  name: 'search-products'
}

resource orderStatusOperation 'Microsoft.ApiManagement/service/apis/operations@2024-06-01-preview' existing = {
  parent: retailApi
  name: 'get-order-status'
}

resource retailMcp 'Microsoft.ApiManagement/service/apis@2024-06-01-preview' = {
  parent: apim
  name: 'zava-retail-mcp'
  properties: {
    displayName: 'Zava Retail MCP server'
    description: 'MCP server generated by API Management from the Zava Retail REST API.'
    #disable-next-line BCP037
    type: 'mcp'
    path: mcpPath
    protocols: [
      'https'
    ]
    subscriptionRequired: true
    subscriptionKeyParameterNames: {
      header: 'api-key'
      query: 'api-key'
    }
    #disable-next-line BCP037
    mcpTools: [
      {
        name: searchProductsOperation.name
        operationId: searchProductsOperation.id
        description: 'Search Zava products by category (outdoor, kitchen, electronics).'
      }
      {
        name: orderStatusOperation.name
        operationId: orderStatusOperation.id
        description: 'Get the delivery status of a Zava order by order id.'
      }
    ]
  }
  dependsOn: [
    retailPolicy
  ]
}

resource retailMcpPolicy 'Microsoft.ApiManagement/service/apis/policies@2024-06-01-preview' = {
  parent: retailMcp
  name: 'policy'
  properties: {
    format: 'rawxml'
    value: loadTextContent('../policies/retail-mcp.xml')
  }
}

resource retailMcpDiagnostics 'Microsoft.ApiManagement/service/apis/diagnostics@2024-06-01-preview' = {
  parent: retailMcp
  name: 'applicationinsights'
  properties: {
    alwaysLog: 'allErrors'
    httpCorrelationProtocol: 'W3C'
    verbosity: 'information'
    logClientIp: true
    loggerId: appInsightsLoggerId
    metrics: true
    sampling: {
      samplingType: 'fixed'
      percentage: 100
    }
  }
}

// ---------- Products (teams) with token budgets + subscriptions ----------

resource product 'Microsoft.ApiManagement/service/products@2024-06-01-preview' = [for p in products: {
  parent: apim
  name: p.name
  properties: {
    displayName: p.displayName
    description: 'Token budget: ${p.tokensPerMinute} tokens/min, ${p.tokenQuota} tokens/month per subscription.'
    subscriptionRequired: true
    approvalRequired: false
    state: 'published'
  }
}]

resource productPolicy 'Microsoft.ApiManagement/service/products/policies@2024-06-01-preview' = [for (p, i) in products: {
  parent: product[i]
  name: 'policy'
  properties: {
    format: 'rawxml'
    value: replace(replace(loadTextContent('../policies/product-token-budget.xml'), '{tokens-per-minute}', string(p.tokensPerMinute)), '{token-quota}', string(p.tokenQuota))
  }
}]

resource productInferenceApi 'Microsoft.ApiManagement/service/products/apis@2024-06-01-preview' = [for (p, i) in products: {
  parent: product[i]
  name: inferenceApi.name
}]

resource productRetailApi 'Microsoft.ApiManagement/service/products/apis@2024-06-01-preview' = [for (p, i) in products: {
  parent: product[i]
  name: retailApi.name
}]

resource productRetailMcp 'Microsoft.ApiManagement/service/products/apis@2024-06-01-preview' = [for (p, i) in products: {
  parent: product[i]
  name: retailMcp.name
}]

resource subscription 'Microsoft.ApiManagement/service/subscriptions@2024-06-01-preview' = [for (p, i) in products: {
  parent: apim
  name: '${p.name}-team'
  properties: {
    displayName: '${p.displayName} (team key)'
    scope: product[i].id
    state: 'active'
    allowTracing: false
  }
}]

output inferenceApiPath string = inferenceApiPath
output mcpEndpoint string = '${apim.properties.gatewayUrl}/${mcpPath}/mcp'
output subscriptionNames array = [for (p, i) in products: subscription[i].name]
