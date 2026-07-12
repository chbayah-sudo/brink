type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem" | "clear" | "key"> & {
  length: number;
};

function createSafeStorage(): StorageLike {
  return {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
    key: () => null,
    length: 0,
  };
}

export function installSafeStorage() {
  if (typeof globalThis === "undefined") return;

  const scope = globalThis as typeof globalThis & {
    localStorage?: StorageLike;
    sessionStorage?: StorageLike;
  };

  const isUsableStorage = (storage?: StorageLike) =>
    Boolean(
      storage &&
        typeof storage.getItem === "function" &&
        typeof storage.setItem === "function" &&
        typeof storage.removeItem === "function"
    );

  if (!isUsableStorage(scope.localStorage)) {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      writable: true,
      value: createSafeStorage(),
    });
  }

  if (!isUsableStorage(scope.sessionStorage)) {
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      writable: true,
      value: createSafeStorage(),
    });
  }
}

installSafeStorage();
