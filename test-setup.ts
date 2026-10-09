import "fake-indexeddb/auto";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

class IntersectionObserverStub {
  callback: ObserverCallback;

  constructor(callback: ObserverCallback) {
    this.callback = callback;
    const registry = (globalThis as Record<string, unknown>)
      .__intersectionObservers as IntersectionObserverStub[];
    registry.push(this);
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

(globalThis as Record<string, unknown>).__intersectionObservers = [];

(globalThis as Record<string, unknown>).IntersectionObserver =
  IntersectionObserverStub;

(globalThis as Record<string, unknown>).ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(() => {
  cleanup();
  (globalThis as Record<string, unknown>).__intersectionObservers = [];
});
