/**
 * Qwen Bridge API Client
 * 
 * Communicates with the Python bridge server at http://127.0.0.1:8000
 * Used when model 'qwen/from Ehab' is selected
 */

import { z } from 'zod/v4'

const MessageRequestSchema = z.object({
  message: z.string(),
  conversation_id: z.string().optional(),
})

const MessageResponseSchema = z.object({
  response: z.string(),
  success: z.boolean(),
  error: z.string().optional(),
  conversation_id: z.string().optional(),
})

export interface MessageRequest {
  message: string
  conversation_id?: string
}

export interface MessageResponse {
  response: string
  success: boolean
  error?: string
  conversation_id?: string
}

const BRIDGE_URL = process.env.QWEN_BRIDGE_URL || 'http://127.0.0.1:8000'

export class QwenBridgeClient {
  private baseUrl: string
  private healthCache: { healthy: boolean; timestamp: number } | null = null

  constructor(baseUrl: string = BRIDGE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Send a message to Qwen AI via the bridge server
   */
  async sendMessage(request: MessageRequest): Promise<MessageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Bridge server error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return MessageResponseSchema.parse(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        response: '',
        success: false,
        error: `Failed to communicate with Qwen Bridge: ${errorMessage}`,
      }
    }
  }

  /**
   * Check if the bridge server is healthy
   */
  async checkHealth(): Promise<boolean> {
    // Use cached health status for 5 seconds
    if (this.healthCache && Date.now() - this.healthCache.timestamp < 5000) {
      return this.healthCache.healthy
    }

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      })

      if (!response.ok) {
        this.healthCache = { healthy: false, timestamp: Date.now() }
        return false
      }

      const data = await response.json()
      const isHealthy = data.status === 'healthy'
      this.healthCache = { healthy: isHealthy, timestamp: Date.now() }
      return isHealthy
    } catch {
      this.healthCache = { healthy: false, timestamp: Date.now() }
      return false
    }
  }

  /**
   * Get bridge server info
   */
  async getInfo(): Promise<{ url: string; platform: string; healthy: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      })

      if (!response.ok) {
        return { url: this.baseUrl, platform: 'qwen/from Ehab', healthy: false }
      }

      const data = await response.json()
      return {
        url: data.url || this.baseUrl,
        platform: data.platform || 'qwen/from Ehab',
        healthy: data.status === 'healthy',
      }
    } catch {
      return { url: this.baseUrl, platform: 'qwen/from Ehab', healthy: false }
    }
  }
}

// Singleton instance
let qwenBridgeClientInstance: QwenBridgeClient | null = null

export function getQwenBridgeClient(): QwenBridgeClient {
  if (!qwenBridgeClientInstance) {
    qwenBridgeClientInstance = new QwenBridgeClient()
  }
  return qwenBridgeClientInstance
}
