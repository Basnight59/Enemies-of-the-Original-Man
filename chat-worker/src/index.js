// eotom-chat: Cloudflare Worker behind the chat widget on enemiesoftheoriginalman.com.
// The browser POSTs { messages: [{ role, content }, ...] }; the reply streams back as plain text.
// The Anthropic API key lives only here, as a Worker secret (ANTHROPIC_API_KEY).
import Anthropic from '@anthropic-ai/sdk';
import { KNOWLEDGE } from './knowledge.js';

const MODEL = 'claude-opus-5-5';
const MAX_TURNS = 12;          // most recent messages forwarded to Claude
const MAX_MESSAGE_CHARS = 1500;

const PERSONA = `You are the official guide to the book "Enemies of the Original Man: A Clinical and Legal Framework for Reparative Justice" by Abdullah Hakim Kenneth Basnight, answering visitors in a chat window on the book's website.

Rules:
- Answer only from the KNOWLEDGE section below. If something isn't covered there, say you don't have that information and suggest booking a consultation with the author.
- Keep the book's evidentiary distinctions: PTCS and PTSMS are proposed analytical frameworks and the DDM is a proposed research agenda. Never describe any of them as a DSM diagnosis or an established clinical condition.
- Give no medical, psychological, or legal advice and never diagnose anyone. Suggest a qualified professional for personal concerns; the author's consultations are for discussing the framework and research.
- When it helps the visitor, point them to buying the book (buying direct is preferred once it is live; booksellers are available now), booking a consultation, or requesting a speaking engagement. Use markdown links, and only URLs that appear in KNOWLEDGE.
- Keep answers short: two to five sentences unless the visitor asks for more detail. Plain prose, no headings.
- Stay courteous and calm with hostile, off-topic, or provocative messages; briefly steer back to the book.
- Speak about the author in the third person; you are an assistant, not the author.`;

const REFUSAL_REPLY = "I'm not able to help with that here. I can answer questions about the book and its frameworks, or help you buy a copy or book time with the author.";

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const cors = allowed.includes(origin)
      ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' }
      : null;

    if (!cors) return new Response('Forbidden', { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });

    const text = (body, status) =>
      new Response(body, { status, headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' } });

    if (env.CHAT_LIMITER) {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const { success } = await env.CHAT_LIMITER.limit({ key: ip });
      if (!success) return text("You're sending messages quickly. Please wait a minute and try again.", 429);
    }

    let messages;
    try {
      messages = cleanMessages((await request.json()).messages);
    } catch (e) {
      return text('Bad request.', 400);
    }
    if (!messages) return text('Bad request.', 400);

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const encoder = new TextEncoder();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const run = async () => {
      try {
        const stream = client.beta.messages.stream({
          model: MODEL,
          max_tokens: 1024,
          output_config: { effort: 'low' },
          // a safety-classifier decline is retried server-side on Anthropic's recommended model
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          system: [
            { type: 'text', text: PERSONA },
            // the large fixed block is cached, so repeat visitors pay about a tenth for it
            { type: 'text', text: '<KNOWLEDGE>\n' + KNOWLEDGE + '\n</KNOWLEDGE>', cache_control: { type: 'ephemeral' } },
          ],
          messages,
        });
        let sent = false;
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            sent = true;
            await writer.write(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === 'refusal') {
          await writer.write(encoder.encode((sent ? '\n\n' : '') + REFUSAL_REPLY));
        }
        console.log(JSON.stringify({ usage: final.usage, stop_reason: final.stop_reason, model: final.model }));
      } catch (err) {
        let reply = 'Sorry, something went wrong. Please try again in a moment.';
        if (err instanceof Anthropic.RateLimitError) reply = 'The assistant is busy right now. Please try again in a minute.';
        else if (err instanceof Anthropic.APIConnectionError) reply = "Sorry, I couldn't reach the assistant. Please try again.";
        console.error(err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : String(err));
        await writer.write(encoder.encode(reply)).catch(() => {});
      } finally {
        await writer.close().catch(() => {});
      }
    };
    run();

    return new Response(readable, {
      headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  },
};

// Keep only well-formed user/assistant text turns, trimmed to the recent window, starting with a user turn.
function cleanMessages(input) {
  if (!Array.isArray(input)) return null;
  const out = input
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
    .slice(-MAX_TURNS);
  while (out.length && out[0].role !== 'user') out.shift();
  if (!out.length || out[out.length - 1].role !== 'user') return null;
  return out;
}
