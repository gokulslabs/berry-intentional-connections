/**
 * Platform-agnostic screen-size adapter.
 * Web: uses window.innerWidth / matchMedia.
 * React Native: swap with Dimensions-based implementation.
 */

export interface ScreenAdapter {
  getWidth(): number;
  subscribe(callback: () => void): () => void;
}

const MOBILE_BREAKPOINT = 768;

/** Default web adapter. */
const webScreen: ScreenAdapter = {
  getWidth: () => (typeof window !== "undefined" ? window.innerWidth : 1024),
  subscribe: (callback) => {
    if (typeof window === "undefined") return () => {};
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  },
};

let _adapter: ScreenAdapter = webScreen;

/** Replace the screen backend (call once at app startup for RN). */
export function setScreenAdapter(adapter: ScreenAdapter) {
  _adapter = adapter;
}

export function getScreenAdapter(): ScreenAdapter {
  return _adapter;
}

export { MOBILE_BREAKPOINT };
