/**
 * Python Bridge Client for Qwen Integration - With Tool Support
 */

import { randomUUID } from 'crypto'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface BridgeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface BridgeTool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
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
    model: string = 'qwen/from-ehab',
    tools?: BridgeTool[]
  ): Promise<BridgeResponse | BridgeError> {
    if (!this.enabled) {
      return {
        error: {
          type: 'bridge_disabled',
          message: 'Python bridge is disabled',
        },
      }
    }

    const isHealthy = await this.health()
    if (!isHealthy) {
      return {
        error: {
          type: 'bridge_unavailable',
          message: 'Python bridge server is not running. Please run: python save.py',
        },
      }
    }

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
          tools: tools?.map(t => t.name), // Send tool names for Qwen to use
        }),
        signal: AbortSignal.timeout(120000),
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

      // Handle tool calls from Qwen
      if (data.tool_calls && Array.isArray(data.tool_calls)) {
        const toolContents = await Promise.all(
          data.tool_calls.map(async (toolCall: any) => {
            const result = await this.executeTool(toolCall.name, toolCall.input)
            return {
              type: 'tool_use' as const,
              id: toolCall.id || `toolu-${randomUUID()}`,
              name: toolCall.name,
              input: toolCall.input,
            }
          })
        )

        return {
          id: `bridge-${randomUUID()}`,
          model: model,
          content: toolContents,
          role: 'assistant',
          stop_reason: 'tool_use',
          usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
        }
      }

      // Regular text response
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

  private async executeTool(toolName: string, input: any): Promise<any> {
    // Execute file operations locally
    switch (toolName) {
      case 'Read':
        return await fs.readFile(input.path, 'utf-8')
      case 'Write':
        await fs.mkdir(path.dirname(input.path), { recursive: true })
        await fs.writeFile(input.path, input.content, 'utf-8')
        return { success: true }
      case 'Edit':
        const content = await fs.readFile(input.path, 'utf-8')
        const edited = content.replace(
          new RegExp(input.old_string, 'g'),
          input.new_string
        )
        await fs.writeFile(input.path, edited, 'utf-8')
        return { success: true }
      case 'Grep':
        // Simple grep implementation
        const files = await this.findFiles(input.path_pattern || '.')
        const results: string[] = []
        for (const file of files) {
          try {
            const content = await fs.readFile(file, 'utf-8')
            const lines = content.split('\n')
            lines.forEach((line, idx) => {
              if (line.includes(input.pattern)) {
                results.push(`${file}:${idx + 1}: ${line}`)
              }
            })
          } catch { }
        }
        return results.join('\n')
      case 'Glob':
        return await this.findFiles(input.pattern || '**/*')
      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }
  }

  private async findFiles(pattern: string): Promise<string[]> {
    // Simple glob implementation
    const results: string[] = []
    const searchDir = pattern.split('/')[0] || '.'

    async function search(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            await search(fullPath)
          } else if (entry.isFile()) {
            results.push(fullPath)
          }
        }
      } catch { }
    }

    await search(searchDir)
    return results
  }

  async *streamMessage(
    messages: BridgeMessage[],
    model: string = 'qwen/from-ehab',
    tools?: BridgeTool[]
  ): AsyncGenerator<any> {
    const response = await this.sendMessage(messages, model, tools)

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

    for (let i = 0; i < response.content.length; i++) {
      const block = response.content[i]

      yield {
        type: 'content_block_start',
        index: i,
        content_block: block,
      }

      if (block.type === 'text' && block.text) {
        const chunkSize = 20
        for (let j = 0; j < block.text.length; j += chunkSize) {
          const chunk = block.text.slice(j, j + chunkSize)
          yield {
            type: 'content_block_delta',
            index: i,
            delta: {
              type: 'text_delta',
              text: chunk,
            },
          }
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      yield {
        type: 'content_block_stop',
        index: i,
      }
    }

    yield {
      type: 'message_delta',
      delta: {
        stop_reason: response.stop_reason,
      },
      usage: {
        output_tokens: Math.ceil((response.content[0]?.text || '').length / 4),
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