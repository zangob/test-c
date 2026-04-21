/**
 * Python Bridge Client for Qwen Integration
 * Calls the local Python bridge server to interact with Qwen web interface
 */
import { randomUUID } from 'crypto'

export interface BridgeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface BridgeUsage {
  input_tokens: number
  output_tokens: number
  total_tokens: number
}

export interface BridgeResponse {
  id: string
  model: string
  content: Array<{
    type: 'text' | 'tool_use'
    text?: string
    id?: string
    name?: string
    input?: any
  }>
  role: 'assistant'
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use'
  usage: BridgeUsage
}

export interface BridgeError {
  error: {
    type: string
    message: string
  }
}

export class PythonBridgeClient {
  private baseUrl: string
  private enabled: boolean

  constructor(baseUrl = 'http://127.0.0.1:8000') {
    this.baseUrl = baseUrl
    this.enabled = true
  }

  async health(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      return response.ok
    } catch {
      return false
    }
  }

  async sendMessage(
    messages: BridgeMessage[],
    model: string = 'qwen/from-ehab'
  ): Promise<BridgeResponse | BridgeError> {
    if (!this.enabled) {
      return {
        error: {
          type: 'bridge_disabled',
          message: 'Python bridge is disabled',
        },
      }
    }

    // Check if bridge is healthy
    const isHealthy = await this.health()
    if (!isHealthy) {
      return {
        error: {
          type: 'bridge_unavailable',
          message: 'Python bridge server is not running. Please run: python save.py then python bridge_server.py',
        },
      }
    }

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()
    if (!lastUserMessage) {
      return {
        error: {
          type: 'invalid_request',
          message: 'No user message found',
        },
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: lastUserMessage.content,
          platform: 'qwen',
        }),
        signal: AbortSignal.timeout(120000), // 2 minute timeout
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        return {
          error: {
            type: 'bridge_error',
            message: data.error || 'Unknown bridge error',
          },
        }
      }

      // Convert bridge response to Anthropic-compatible format
      return {
        id: `bridge-${randomUUID()}`,
        model: model,
        content: [
          {
            type: 'text',
            text: data.response,
          },
        ],
        role: 'assistant',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
        },
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        error: {
          type: 'connection_error',
          message: `Failed to connect to bridge: ${errorMessage}`,
        },
      }
    }
  }

  async *streamMessage(
    messages: BridgeMessage[],
    model: string = 'qwen/from-ehab'
  ): AsyncGenerator<{
    type: 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_start' | 'message_delta' | 'message_stop'
    index?: number
    content_block?: { type: 'text'; text: string }
    delta?: { type: 'text_delta'; text: string }
    usage_output_tokens?: number
    stop_reason?: string
  }> {
    const response = await this.sendMessage(messages, model)

    if ('error' in response) {
      throw new Error(response.error.message)
    }

    yield {
      type: 'message_start',
      message: {
        id: response.id,
        model: response.model,
        role: 'assistant',
        content: [],
        stop_reason: null,
        usage: { input_tokens: 0, output_tokens: 0 },
      },
    }

    yield {
      type: 'content_block_start',
      index: 0,
      content_block: {
        type: 'text',
        text: '',
      },
    }

    const text = response.content[0].text || ''
    const chunkSize = 20
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize)
      yield {
        type: 'content_block_delta',
        index: 0,
        delta: {
          type: 'text_delta',
          text: chunk,
        },
      }
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    yield {
      type: 'content_block_stop',
      index: 0,
    }

    yield {
      type: 'message_delta',
      delta: {
        stop_reason: response.stop_reason,
      },
      usage: {
        output_tokens: Math.ceil(text.length / 4),
      },
    }

    yield {
      type: 'message_stop',
    }
  }

  disable() {
    this.enabled = false
  }

  enable() {
    this.enabled = true
  }
}

// Singleton instance
let bridgeClient: PythonBridgeClient | null = null

export function getBridgeClient(): PythonBridgeClient {
  if (!bridgeClient) {
    bridgeClient = new PythonBridgeClient()
  }
  return bridgeClient
}

export function isBridgeEnabled(): boolean {
  const client = getBridgeClient()
  return client.enabled
}