/**
 * Three.js DOM Shim for Web Workers
 * Provides minimal DOM API stubs required by Three.js in worker context
 */

// Stub document object for texture creation
const document = {
 
  createElement: (tag: string): any => {
    if (tag === 'canvas') {
      // Return OffscreenCanvas in worker context
      return new OffscreenCanvas(1, 1);
    }
    // Return minimal stub for other elements
    return {
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      getContext: () => null,
    };
  },
 
  createElementNS: (_ns: string, tag: string): any => document.createElement(tag),
  body: {
    style: {},
    appendChild: () => {},
    removeChild: () => {},
  },
};

// Stub window object
const window = {
  devicePixelRatio: 1,
  innerWidth: 800,
  innerHeight: 600,
  addEventListener: () => {},
  removeEventListener: () => {},
  requestAnimationFrame: (callback: FrameRequestCallback) => setTimeout(callback, 16), // ~60 FPS
  cancelAnimationFrame: (id: number) => {
    clearTimeout(id);
  },
};

// Export as global in worker context
declare global {
  interface WorkerGlobalScope {
    document: typeof document;
    window: typeof window;
  }
}

// Inject into worker global scope
if (typeof self !== 'undefined') {
 
  (self as any).document = document;
 
  (self as any).window = window;
}

export { document, window };
