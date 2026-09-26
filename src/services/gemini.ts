/**
 * Client-Side Service for Server-Side Gemini API Endpoints
 * All requests are routed securely to the server proxy.
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function generateIntelligentText(
  prompt: string,
  taskType: 'fast' | 'general' | 'complex' = 'general',
  systemInstruction?: string
): Promise<{ text: string; model: string }> {
  const res = await fetch('/api/gemini/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, taskType, systemInstruction }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate intelligent content');
  }
  return await res.json();
}

export async function sendChatMessage(
  messages: ChatMessage[],
  systemInstruction?: string,
  model: string = 'gemini-3.5-flash'
): Promise<{ text: string; model: string }> {
  const res = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, systemInstruction, model }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to get chat response');
  }
  return await res.json();
}

export async function runHighThinking(
  prompt: string,
  systemInstruction?: string
): Promise<{ text: string; model: string }> {
  const res = await fetch('/api/gemini/thinking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemInstruction }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to complete high-thinking reasoning');
  }
  return await res.json();
}

export async function analyzeImage(
  base64Data: string,
  mimeType: string = 'image/jpeg',
  prompt: string = 'Analyze this school document or photo in detail.'
): Promise<{ text: string; model: string }> {
  const res = await fetch('/api/gemini/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Data, mimeType, prompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to analyze image with Gemini Pro');
  }
  return await res.json();
}

export async function analyzeVideo(
  base64Data: string,
  mimeType: string = 'video/mp4',
  prompt: string = 'Summarize key educational concepts, classroom actions, or events from this video.'
): Promise<{ text: string; model: string }> {
  const res = await fetch('/api/gemini/analyze-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Data, mimeType, prompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to analyze video with Gemini Pro');
  }
  return await res.json();
}

export async function transcribeAudio(
  base64Audio: string,
  mimeType: string = 'audio/webm'
): Promise<{ text: string; model: string }> {
  const res = await fetch('/api/gemini/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Audio, mimeType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to transcribe audio with Gemini 3.5');
  }
  return await res.json();
}
