/**
 * Bedrock Streaming → SSE bridge
 *
 * Converts Bedrock's streaming response into Server-Sent Events
 * for consumption by Next.js API routes / Route Handlers.
 *
 * Usage in a Route Handler:
 *   export async function GET(req: Request) {
 *     const stream = narrateGTMScoreStream(company, benchmarks, metrics);
 *     return bedrockSSEResponse(stream);
 *   }
 */

import type { BedrockUsage } from "./bedrock-types";

// Re-export the usage type for consumers
export type { BedrockUsage };

/**
 * Wraps a Bedrock streaming generator into a standard SSE ReadableStream Response.
 */
export function bedrockSSEResponse(
  generator: AsyncGenerator<string, BedrockUsage | void>
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let result = await generator.next();

        while (!result.done) {
          const chunk = result.value;
          // SSE format: data: <payload>\n\n
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
          );
          result = await generator.next();
        }

        // Send usage data as final event
        if (result.value) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, usage: result.value })}\n\n`
            )
          );
        } else {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          );
        }

        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Streaming error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: message })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * Collects the full text from a Bedrock streaming generator.
 * Useful for server-side usage where you don't need SSE.
 */
export async function collectStream(
  generator: AsyncGenerator<string, BedrockUsage | void>
): Promise<{ text: string; usage: BedrockUsage | undefined }> {
  const chunks: string[] = [];
  let result = await generator.next();

  while (!result.done) {
    chunks.push(result.value);
    result = await generator.next();
  }

  return {
    text: chunks.join(""),
    usage: result.value ?? undefined,
  };
}
