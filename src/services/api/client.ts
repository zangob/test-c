import Anthropic, { type ClientOptions } from '@anthropic-ai/sdk'
import { randomUUID } from 'crypto'
import {
  getAPIProvider,
  isFirstPartyAnthropicBaseUrl,
} from 'src/utils/model/providers.js'
import { getUserAgent } from 'src/utils/http.js'
import { getProxyFetchOptions } from 'src/utils/proxy.js'
import { getSessionId } from '../../bootstrap/state.js'
import { isDebugToStdErr, logForDebugging } from '../../utils/debug.js'
import { isEnvTruthy } from '../../utils/envUtils.js'

export const CLIENT_REQUEST_ID_HEADER = 'x-client-request-id';
function createStderrLogger(): ClientOptions['logger'] {
  return {
    error: (msg, ...args) => console.error('[Anthropic SDK ERROR]', msg, ...args),
    warn: (msg, ...args) => console.error('[Anthropic SDK WARN]', msg, ...args),
    info: (msg, ...args) => console.error('[Anthropic SDK INFO]', msg, ...args),
    debug: (msg, ...args) => console.error('[Anthropic SDK DEBUG]', msg, ...args),
  }
}

function getCustomHeaders(): Record<string, string> {
  const customHeaders: Record<string, string> = {}
  const customHeadersEnv = process.env.ANTHROPIC_CUSTOM_HEADERS
  if (!customHeadersEnv) return customHeaders
  const headerStrings = customHeadersEnv.split(/\n|\r\n/)
  for (const headerString of headerStrings) {
    if (!headerString.trim()) continue
    const colonIdx = headerString.indexOf(':')
    if (colonIdx === -1) continue
    const name = headerString.slice(0, colonIdx).trim()
    const value = headerString.slice(colonIdx + 1).trim()
    if (name) {
      customHeaders[name] = value
    }
  }
  return customHeaders
}

export async function getAnthropicClient({
  apiKey,
  maxRetries,
  model,
  fetchOverride,
  source,
}: {
  apiKey?: string
  maxRetries: number
  model?: string
  fetchOverride?: ClientOptions['fetch']
  source?: string
}): Promise<Anthropic> {
  const containerId = process.env.CLAUDE_CODE_CONTAINER_ID
  const remoteSessionId = process.env.CLAUDE_CODE_REMOTE_SESSION_ID
  const clientApp = process.env.CLAUDE_AGENT_SDK_CLIENT_APP

  const customHeaders = getCustomHeaders()
  const defaultHeaders: { [key: string]: string } = {
    'x-app': 'cli',
    'User-Agent': getUserAgent(),
    'X-Claude-Code-Session-Id': getSessionId(),
    ...customHeaders,
    ...(containerId ? { 'x-claude-remote-container-id': containerId } : {}),
    ...(remoteSessionId ? { 'x-claude-remote-session-id': remoteSessionId } : {}),
    ...(clientApp ? { 'x-client-app': clientApp } : {}),
  }

  const additionalProtectionEnabled = isEnvTruthy(process.env.CLAUDE_CODE_ADDITIONAL_PROTECTION)
  if (additionalProtectionEnabled) {
    defaultHeaders['x-anthropic-additional-protection'] = 'true'
  }

  const resolvedFetch = fetchOverride ?? globalThis.fetch

  // ============================================================================
  // QWEN BRIDGE PROVIDER - MUST BE FIRST
  // ============================================================================
  if (getAPIProvider() === 'qwen_bridge') {
    logForDebugging('[Qwen Bridge] Using local Python bridge client')

    const bridgeFetch: ClientOptions['fetch'] = async (url, init) => {
      const urlStr = url.toString()

      // Only intercept /v1/messages requests
      if (urlStr.includes('/v1/messages')) {
        try {
          const body = JSON.parse(init?.body as string)
          const lastUserMessage = body.messages
            .filter((m: any) => m.role === 'user')
            .pop()

          if (!lastUserMessage) {
            throw new Error('No user message found')
          }

          const messageContent = Array.isArray(lastUserMessage.content)
            ? lastUserMessage.content.map((c: any) => c.text || '').join('')
            : lastUserMessage.content

          logForDebugging(`[Qwen Bridge] Sending to Python: ${messageContent.substring(0, 50)}...`)

          // Call Python bridge
          const response = await fetch('http://127.0.0.1:8000/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: messageContent,
              platform: 'qwen',
            }),
            signal: AbortSignal.timeout(120000),
          })

          const data = await response.json()

          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Bridge request failed')
          }

          logForDebugging(`[Qwen Bridge] Received response: ${data.response.substring(0, 50)}...`)

          // Construct Anthropic-compatible response
          const responseBody = {
            id: `bridge-${randomUUID()}`,
            type: 'message',
            role: 'assistant',
            content: [{ type: 'text', text: data.response }],
            model: model || 'qwen/from Ehab',
            stop_reason: 'end_turn',
            stop_sequence: null,
            usage: {
              input_tokens: 0,
              output_tokens: Math.ceil(data.response.length / 4),
            },
          }

          return new Response(JSON.stringify(responseBody), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'x-request-id': randomUUID(),
            },
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown bridge error'
          logForDebugging(`[Qwen Bridge] Error: ${errorMessage}`)

          const errorBody = {
            type: 'error',
            error: { type: 'bridge_error', message: errorMessage },
          }

          return new Response(JSON.stringify(errorBody), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }

      // Pass through other requests
      return resolvedFetch(url, init)
    }

    const clientConfig: ConstructorParameters<typeof Anthropic>[0] = {
      apiKey: apiKey || 'qwen-bridge-dummy-key',
      baseURL: 'https://api.anthropic.com', // Dummy URL, fetch interceptor handles everything
      defaultHeaders,
      maxRetries,
      timeout: parseInt(process.env.API_TIMEOUT_MS || String(600 * 1000), 10),
      dangerouslyAllowBrowser: true,
      fetch: bridgeFetch,
      fetchOptions: getProxyFetchOptions({ forAnthropicAPI: true }) as ClientOptions['fetchOptions'],
      ...(isDebugToStdErr() && { logger: createStderrLogger() }),
    }

    return new Anthropic(clientConfig)
  }

  // ============================================================================
  // POE PROVIDER
  // ============================================================================
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_POE)) {
    const poeApiKey = process.env.POE_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY || apiKey
    const poeBaseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.poe.com/v1'

    const poeFetch: ClientOptions['fetch'] = async (url, init) => {
      const urlStr = url.toString()
      if (urlStr.includes('/messages')) {
        const body = JSON.parse(init?.body as string)
        const openAIParams = {
          model: body.model,
          messages: body.messages.map((m: any) => ({
            role: m.role,
            content: Array.isArray(m.content) ? m.content.map((c: any) => c.text || '').join('') : m.content
          })),
          stream: body.stream,
          max_tokens: body.max_tokens,
          temperature: body.temperature,
          stop: body.stop_sequences,
        }

        const newUrl = urlStr.replace('/messages', '/chat/completions')
        const headers = new Headers(init?.headers)
        const apiKeyValue = headers.get('x-api-key')
        if (apiKeyValue) {
          headers.set('Authorization', `Bearer ${apiKeyValue}`)
          headers.delete('x-api-key')
        }

        const newInit = { ...init, headers, body: JSON.stringify(openAIParams) }
        const response = await (resolvedFetch || globalThis.fetch)(newUrl, newInit)

        if (!response.ok) {
          try {
            const errorText = await response.clone().text()
            console.error(`[Poe API Error] ${response.status}: ${errorText}`)
          } catch (e) { }
        }

        if (body.stream && response.ok) {
          const reader = response.body?.getReader()
          const encoder = new TextEncoder()
          const decoder = new TextDecoder()

          const transformStream = new ReadableStream({
            async start(controller) {
              if (!reader) return controller.close()
              let isFirst = true
              try {
                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break
                  const chunk = decoder.decode(value)
                  const lines = chunk.split('\n')
                  for (const line of lines) {
                    if (line.startsWith('data: ')) {
                      const dataStr = line.slice(6).trim()
                      if (dataStr === '[DONE]') continue
                      try {
                        const data = JSON.parse(dataStr)
                        const content = data.choices[0]?.delta?.content
                        if (content) {
                          if (isFirst) {
                            controller.enqueue(encoder.encode(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: data.id, role: 'assistant', content: [], model: data.model, usage: { input_tokens: 0, output_tokens: 0 } } })}\n\n`))
                            isFirst = false
                          }
                          controller.enqueue(encoder.encode(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: content } })}\n\n`))
                        }
                      } catch (e) { }
                    }
                  }
                }
                controller.enqueue(encoder.encode('event: message_stop\ndata: {"type":"message_stop"}\n\n'))
              } finally {
                controller.close()
              }
            }
          })

          return new Response(transformStream, {
            headers: response.headers,
            status: response.status,
            statusText: response.statusText,
          })
        }
        return response
      }
      return (resolvedFetch || globalThis.fetch)(url, init)
    }

    const clientConfig: ConstructorParameters<typeof Anthropic>[0] = {
      apiKey: poeApiKey || '',
      baseURL: poeBaseUrl,
      defaultHeaders,
      maxRetries,
      timeout: parseInt(process.env.API_TIMEOUT_MS || String(600 * 1000), 10),
      dangerouslyAllowBrowser: true,
      fetchOptions: getProxyFetchOptions({ forAnthropicAPI: true }) as ClientOptions['fetchOptions'],
      fetch: poeFetch,
      ...(isDebugToStdErr() && { logger: createStderrLogger() }),
    }
    return new Anthropic(clientConfig)
  }

  // ============================================================================
  // OTHER PROVIDERS (OpenRouter, Z.ai, LM Studio, Bedrock, Vertex, Foundry)
  // ============================================================================
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_OPENROUTER)) {
    const openrouterApiKey = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY || apiKey
    return new Anthropic({
      apiKey: openrouterApiKey || '',
      baseURL: process.env.ANTHROPIC_BASE_URL || 'https://openrouter.ai/api',
      defaultHeaders,
      maxRetries,
      timeout: parseInt(process.env.API_TIMEOUT_MS || String(600 * 1000), 10),
      dangerouslyAllowBrowser: true,
      fetchOptions: getProxyFetchOptions({ forAnthropicAPI: true }) as ClientOptions['fetchOptions'],
      ...(resolvedFetch && { fetch: resolvedFetch }),
      ...(isDebugToStdErr() && { logger: createStderrLogger() }),
    })
  }

  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_ZAI)) {
    const zaiApiKey = process.env.ZAI_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY || apiKey
    return new Anthropic({
      apiKey: zaiApiKey || '',
      baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic',
      defaultHeaders,
      maxRetries,
      timeout: parseInt(process.env.API_TIMEOUT_MS || String(600 * 1000), 10),
      dangerouslyAllowBrowser: true,
      fetchOptions: getProxyFetchOptions({ forAnthropicAPI: true }) as ClientOptions['fetchOptions'],
      ...(resolvedFetch && { fetch: resolvedFetch }),
      ...(isDebugToStdErr() && { logger: createStderrLogger() }),
    })
  }

  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_LMSTUDIO)) {
    const lmstudioApiKey = process.env.LM_STUDIO_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY || apiKey || 'not-needed'
    return new Anthropic({
      apiKey: lmstudioApiKey,
      baseURL: process.env.ANTHROPIC_BASE_URL || 'http://localhost:1234/',
      defaultHeaders,
      maxRetries,
      timeout: parseInt(process.env.API_TIMEOUT_MS || String(600 * 1000), 10),
      dangerouslyAllowBrowser: true,
      fetchOptions: getProxyFetchOptions({ forAnthropicAPI: true }) as ClientOptions['fetchOptions'],
      ...(resolvedFetch && { fetch: resolvedFetch }),
      ...(isDebugToStdErr() && { logger: createStderrLogger() }),
    })
  }

  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK)) {
    const { AnthropicBedrock } = await import('@anthropic-ai/bedrock-sdk')
    const awsRegion = process.env.AWS_REGION || 'us-east-1'
    const bedrockArgs: ConstructorParameters<typeof AnthropicBedrock>[0] = {
      awsRegion,
      defaultHeaders,
      maxRetries,
      timeout: parseInt(process.env.API_TIMEOUT_MS || String(600 * 1000), 10),
      dangerouslyAllowBrowser: true,
      ...(isDebugToStdErr() && { logger: createStderrLogger() }),
    }
    if (process.env.AWS_BEARER_TOKEN_BEDROCK) {
      bedrockArgs.defaultHeaders = {
        ...bedrockArgs.defaultHeaders,
        Authorization: `Bearer ${process.env.AWS_BEARER_TOKEN_BEDROCK}`,
      }
    }
    return new AnthropicBedrock(bedrockArgs) as unknown as Anthropic
  }

  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)) {
    const { AnthropicFoundry } = await import('@anthropic-ai/foundry-sdk')
    const foundryArgs: ConstructorParameters<typeof AnthropicFoundry>[0] = {
      defaultHeaders,
      maxRetries,
      timeout: parseInt(process.env.API_TIMEOUT_MS || String(600 * 1000), 10),
      dangerouslyAllowBrowser: true,
      ...(isDebugToStdErr() && { logger: createStderrLogger() }),
    }
    return new AnthropicFoundry(foundryArgs) as unknown as Anthropic
  }

  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX)) {
    const [{ AnthropicVertex }, { GoogleAuth }] = await Promise.all([
      import('@anthropic-ai/vertex-sdk'),
      import('google-auth-library'),
    ])
    const googleAuth = isEnvTruthy(process.env.CLAUDE_CODE_SKIP_VERTEX_AUTH)
      ? ({ getClient: () => ({ getRequestHeaders: () => ({}) }) } as any)
      : new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] })

    const vertexArgs: ConstructorParameters<typeof AnthropicVertex>[0] = {
      region: process.env.CLOUD_ML_REGION || 'us-central1',
      googleAuth,
      defaultHeaders,
      maxRetries,
      timeout: parseInt(process.env.API_TIMEOUT_MS || String(600 * 1000), 10),
      dangerouslyAllowBrowser: true,
      ...(isDebugToStdErr() && { logger: createStderrLogger() }),
    }
    return new AnthropicVertex(vertexArgs) as unknown as Anthropic
  }

  // ============================================================================
  // DEFAULT FIRST-PARTY ANTHROPIC
  // ============================================================================
  const { checkAndRefreshOAuthTokenIfNeeded } = await import('src/utils/auth.js')
  const { isClaudeAISubscriber, getClaudeAIOAuthTokens, getAnthropicApiKey } = await import('src/utils/auth.js')

  await checkAndRefreshOAuthTokenIfNeeded()

  const clientConfig: ConstructorParameters<typeof Anthropic>[0] = {
    apiKey: isClaudeAISubscriber() ? null : apiKey || getAnthropicApiKey(),
    authToken: isClaudeAISubscriber() ? getClaudeAIOAuthTokens()?.accessToken : undefined,
    defaultHeaders,
    maxRetries,
    timeout: parseInt(process.env.API_TIMEOUT_MS || String(600 * 1000), 10),
    dangerouslyAllowBrowser: true,
    fetchOptions: getProxyFetchOptions({ forAnthropicAPI: true }) as ClientOptions['fetchOptions'],
    ...(isDebugToStdErr() && { logger: createStderrLogger() }),
  }

  return new Anthropic(clientConfig)
}