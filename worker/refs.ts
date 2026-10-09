import type { Env } from "./env";

/**
 * Up to five reference images from the private bucket (scripts/upload-refs.py),
 * as data URLs, in the order asked. The director looks at these rather than
 * only reading about them. Any problem means none: it then works from text.
 */
export async function referenceImages(env: Env, ids: string[]): Promise<string[]> {
  if (!env.REFS) return [];
  try {
    const out: string[] = [];
    for (const id of ids) {
      if (out.length === 5) break;
      const object = await env.REFS.get(`${id}.jpg`);
      if (!object) continue;
      const bytes = new Uint8Array(await object.arrayBuffer());
      let binary = "";
      for (const b of bytes) binary += String.fromCharCode(b);
      out.push(`data:image/jpeg;base64,${btoa(binary)}`);
    }
    return out;
  } catch {
    return [];
  }
}
