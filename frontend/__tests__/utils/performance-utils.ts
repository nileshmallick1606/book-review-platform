// __tests__/utils/performance-utils.ts
/**
 * Utility functions for measuring component performance
 */

/**
 * Measure the time it takes to render a component
 * @param callback Function that renders the component
 * @param iterations Number of times to repeat the measurement
 * @returns Average render time in milliseconds
 */
export const measureRenderTime = (callback: () => void, iterations = 5): number => {
  // Warm up to avoid initial render skew
  callback();
  
  // Measure multiple iterations
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    callback();
    const end = performance.now();
    times.push(end - start);
  }
  
  // Calculate average
  const total = times.reduce((sum, time) => sum + time, 0);
  return total / iterations;
};

/**
 * Measures component render time
 * @param Component React component to render
 * @param props Props to pass to the component
 * @returns Object with render time in milliseconds
 */
export const measureComponentPerformance = <P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  props: P,
  renderFunction: (Component: React.ComponentType<P>, props: P) => void,
  iterations = 5
): { renderTime: number } => {
  const renderTime = measureRenderTime(() => {
    renderFunction(Component, props);
  }, iterations);
  
  return { renderTime };
};
