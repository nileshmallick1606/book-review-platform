// __tests__/utils/viewport-utils.ts
/**
 * Utility functions for viewport/responsive design testing
 */

// Standard viewport sizes for testing
export const viewports = {
  mobile: {
    width: 375,
    height: 667
  },
  tablet: {
    width: 768,
    height: 1024
  },
  desktop: {
    width: 1280,
    height: 800
  },
  largeDesktop: {
    width: 1920,
    height: 1080
  }
};

// Types for viewport
type ViewportName = keyof typeof viewports;
type Viewport = typeof viewports[ViewportName];

/**
 * Set the viewport dimensions for testing
 * @param viewport Viewport name or custom dimensions
 */
export const setViewport = (viewport: ViewportName | Viewport): void => {
  const dimensions = typeof viewport === 'string' ? viewports[viewport] : viewport;
  
  if (!dimensions) {
    throw new Error(`Unknown viewport: ${viewport}`);
  }
  
  // Set viewport dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: dimensions.width
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: dimensions.height
  });
  
  // Trigger the resize event
  window.dispatchEvent(new Event('resize'));
};

/**
 * Reset the viewport to desktop size
 */
export const resetViewport = (): void => {
  setViewport('desktop');
};
