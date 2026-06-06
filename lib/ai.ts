export function buildSystemPrompt(stageContext: string): string {
  return `You are the AI planning agent for Automation Command Center.
Your job is to produce a single, well-structured Markdown document as defined below.

Rules:
- Output only valid Markdown. No JSON unless the spec requires it.
- Be specific and concrete. Vague descriptions are not acceptable.
- Never invent credential values, API keys, or secret values.
- Never skip a required section.
- If information is missing, flag it as [MISSING: describe what is needed].
- Write for a human reviewer who will approve this document.

Stage context:
${stageContext}`
}

export async function generateStageArtifact(
  systemPrompt: string,
  userContent: string,
  maxTokens = 2000
): Promise<string> {
  const baseUrl = process.env.BIFROST_BASE_URL
  const apiKey  = process.env.BIFROST_API_KEY
  const model   = process.env.BIFROST_MODEL

  if (!baseUrl || !apiKey || !model) {
    throw new Error('BIFROST_BASE_URL, BIFROST_API_KEY, and BIFROST_MODEL env vars must be set')
  }

  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      }),
      signal: controller.signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error('LiteLLM request timed out after 30s')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Bifrost error ${response.status}: ${body}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content

  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new Error('Empty response from LiteLLM')
  }

  return content
}
