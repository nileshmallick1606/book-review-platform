import '@testing-library/jest-dom';

// Extend jest matchers with jest-dom matchers
declare global {
  namespace jest {
    // Add missing Jest DOM matchers to the Jest interface
    interface Matchers<R, T = any> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toBeNull(): R;
      toHaveBeenCalledTimes(count: number): R;
      toHaveBeenCalledWith(...args: any[]): R;
    }
  }
}
