/**
 * Shared types for Bedrock modules.
 * Kept separate to avoid circular imports between bedrock.ts and bedrock-stream.ts.
 */

export interface BedrockUsage {
  inputTokens: number;
  outputTokens: number;
  model: string;
}
