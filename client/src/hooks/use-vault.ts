import { useState, useEffect, useCallback, useRef } from "react";
import { useImportMarkdown } from "./use-collections";

export interface VaultFile {
  name: string;
  relativePath: string;
  content: string;
}

export interface VaultStatus {
  connected: boolean;
  dirName: string | null;
  lastSync: Date | null;
  fileCount: number;
  newFiles: number;
  isSyncing: boolean;
  error: string | null;
}

const DB_NAME = "prompt-vault-idb";
const STORE_NAME = "vault";
const POLL_INTERVAL = 30_000;

async function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openIdb();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => resolve(null);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openIdb();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
  });
}

async function scanDirectory(
  handle: FileSystemDirectoryHandle,
  depth = 0,
  maxDepth = 4,
  prefix = ""
): Promise<VaultFile[]> {
  if (depth > maxDepth) return [];
  const files: VaultFile[] = [];
  for await (const [name, entry] of handle.entries()) {
    if (entry.kind === "file" && name.toLowerCase().endsWith(".md")) {
      const file = await (entry as FileSystemFileHandle).getFile();
      const content = await file.text();
      files.push({ name, relativePath: prefix ? `${prefix}/${name}` : name, content });
    } else if (entry.kind === "directory" && depth < maxDepth) {
      const sub = await scanDirectory(
        entry as FileSystemDirectoryHandle,
        depth + 1,
        maxDepth,
        prefix ? `${prefix}/${name}` : name
      );
      files.push(...sub);
    }
  }
  return files;
}

export function useVault() {
  const [status, setStatus] = useState<VaultStatus>({
    connected: false,
    dirName: null,
    lastSync: null,
    fileCount: 0,
    newFiles: 0,
    isSyncing: false,
    error: null,
  });

  const handleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const importMarkdown = useImportMarkdown();

  const syncVault = useCallback(async (handle: FileSystemDirectoryHandle) => {
    setStatus((s) => ({ ...s, isSyncing: true, error: null }));
    try {
      const perm = await handle.queryPermission({ mode: "read" });
      if (perm === "denied") throw new Error("Permission denied for vault folder");
      if (perm === "prompt") {
        const granted = await handle.requestPermission({ mode: "read" });
        if (granted !== "granted") throw new Error("Permission not granted");
      }
      const files = await scanDirectory(handle);
      setStatus((s) => ({ ...s, fileCount: files.length }));
      const result = await importMarkdown.mutateAsync({ files });
      setStatus((s) => ({
        ...s,
        isSyncing: false,
        lastSync: new Date(),
        newFiles: result.imported,
        error: result.errors.length ? result.errors.slice(0, 3).join("; ") : null,
      }));
    } catch (e) {
      setStatus((s) => ({ ...s, isSyncing: false, error: (e as Error).message }));
    }
  }, [importMarkdown]);

  const startPolling = useCallback((handle: FileSystemDirectoryHandle) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => syncVault(handle), POLL_INTERVAL);
  }, [syncVault]);

  // Restore vault handle on mount
  useEffect(() => {
    (async () => {
      const stored = await idbGet<FileSystemDirectoryHandle>("handle");
      if (!stored) return;
      const perm = await stored.queryPermission({ mode: "read" });
      if (perm === "granted") {
        handleRef.current = stored;
        const name = stored.name;
        setStatus((s) => ({ ...s, connected: true, dirName: name }));
        await syncVault(stored);
        startPolling(stored);
      } else {
        // Stored but no permission yet — show as connected but needing re-auth
        setStatus((s) => ({ ...s, connected: true, dirName: stored.name, error: "Click 'Sync' to re-authorize vault access" }));
        handleRef.current = stored;
      }
    })();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const openVault = useCallback(async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: "read" });
      handleRef.current = handle;
      await idbSet("handle", handle);
      setStatus((s) => ({ ...s, connected: true, dirName: handle.name, error: null }));
      await syncVault(handle);
      startPolling(handle);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setStatus((s) => ({ ...s, error: (e as Error).message }));
      }
    }
  }, [syncVault, startPolling]);

  const syncNow = useCallback(async () => {
    if (!handleRef.current) return;
    await syncVault(handleRef.current);
  }, [syncVault]);

  const disconnectVault = useCallback(async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    handleRef.current = null;
    await idbDelete("handle");
    setStatus({ connected: false, dirName: null, lastSync: null, fileCount: 0, newFiles: 0, isSyncing: false, error: null });
  }, []);

  const isSupported = typeof window !== "undefined" && "showDirectoryPicker" in window;

  return { status, openVault, syncNow, disconnectVault, isSupported };
}
