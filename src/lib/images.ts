import { useEffect, useState } from "react";

/**
 * Pictures added to the sketch, kept in this browser (IndexedDB) by key so
 * they survive a reload. Share links carry only the key, so a link opened
 * elsewhere shows a placeholder. When storage is blocked (some private
 * windows), pictures still work until the page is closed.
 */

const DB = "ff-images";
const STORE = "images";
const memory = new Map<string, string>();

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = globalThis.indexedDB?.open(DB, 1);
      if (!req) return resolve(null);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  const db = await open();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const req = work(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** A fresh key for a new picture. */
export const newImageKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Keeps a picture (a data: URL); false when it could only be kept for this visit. */
export async function saveImage(key: string, dataUrl: string): Promise<boolean> {
  memory.set(key, dataUrl);
  return (await run("readwrite", (s) => s.put(dataUrl, key))) !== null;
}

export async function loadImage(key: string): Promise<string | null> {
  if (memory.has(key)) return memory.get(key)!;
  const found = await run<string>("readonly", (s) => s.get(key));
  if (typeof found === "string" && found.startsWith("data:image/")) {
    memory.set(key, found);
    return found;
  }
  return null;
}

/** The pictures for these keys, as they load; a key with no picture here is missing from the result. */
export function useImages(keys: string[]): Record<string, string> {
  const [found, setFound] = useState<Record<string, string>>(() => Object.fromEntries(keys.filter((k) => memory.has(k)).map((k) => [k, memory.get(k)!])));
  const want = [...new Set(keys)].filter((k) => k && !found[k]).join("|");
  useEffect(() => {
    if (!want) return;
    let live = true;
    for (const key of want.split("|")) {
      void loadImage(key).then((url) => {
        if (live && url) setFound((all) => ({ ...all, [key]: url }));
      });
    }
    return () => {
      live = false;
    };
  }, [want]);
  return found;
}
