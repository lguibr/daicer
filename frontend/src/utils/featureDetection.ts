/**
 * Feature Detection Utilities
 * Detects browser support for OffscreenCanvas and other modern features
 */

/**
 * Check if browser supports OffscreenCanvas API
 * Safari/iOS have limited or no support currently
 */
export const supportsOffscreenCanvas = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    return typeof OffscreenCanvas !== 'undefined' && typeof OffscreenCanvas.prototype.getContext === 'function';
  } catch {
    return false;
  }
};

/**
 * Check if browser supports WebGL in workers
 * Required for Three.js rendering in OffscreenCanvas
 */
export const supportsWebGLInWorkers = (): boolean => {
  if (!supportsOffscreenCanvas()) return false;

  try {
    const canvas = new OffscreenCanvas(1, 1);
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    return gl !== null;
  } catch {
    return false;
  }
};

/**
 * Detect Safari browser (often lacks OffscreenCanvas support)
 */
export const isSafari = (): boolean => {
  if (typeof window === 'undefined') return false;

  const ua = window.navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(ua);
};

/**
 * Get recommended rendering mode based on browser capabilities
 */
export const getRecommendedRenderingMode = (): 'worker' | 'main-thread' => {
  if (supportsWebGLInWorkers()) {
    return 'worker';
  }

  if (isSafari()) {
    console.warn('[FeatureDetection] Safari detected: using main thread rendering');
  } else {
    console.warn('[FeatureDetection] OffscreenCanvas not supported: using main thread rendering');
  }

  return 'main-thread';
};

/**
 * Log browser capabilities for debugging
 */
export const logBrowserCapabilities = (): void => {
  console.info('[FeatureDetection] Browser Capabilities:', {
    offscreenCanvas: supportsOffscreenCanvas(),
    webglInWorkers: supportsWebGLInWorkers(),
    isSafari: isSafari(),
    recommendedMode: getRecommendedRenderingMode(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
  });
};
