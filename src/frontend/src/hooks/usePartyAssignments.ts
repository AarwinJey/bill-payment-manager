import { useCallback, useState } from "react";

const STORAGE_KEY = "bill-party-assignments";

function readStorage(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeStorage(data: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function usePartyAssignments() {
  const [, forceUpdate] = useState(0);

  const getParty = useCallback((billId: bigint): string => {
    return readStorage()[String(billId)] ?? "";
  }, []);

  const setParty = useCallback((billId: bigint, partyName: string) => {
    const data = readStorage();
    const key = String(billId);
    if (partyName.trim()) {
      data[key] = partyName.trim();
    } else {
      delete data[key];
    }
    writeStorage(data);
    forceUpdate((n) => n + 1);
  }, []);

  const getAllParties = useCallback((): string[] => {
    const data = readStorage();
    return [...new Set(Object.values(data))].sort();
  }, []);

  const getAssignments = useCallback((): Record<string, string> => {
    return readStorage();
  }, []);

  return { getParty, setParty, getAllParties, getAssignments };
}
