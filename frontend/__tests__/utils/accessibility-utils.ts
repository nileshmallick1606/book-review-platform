// __tests__/utils/accessibility-utils.ts
import { render, RenderOptions } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React, { ReactElement } from 'react';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// A custom render function that includes accessibility testing
export const renderWithAxe = async (
  ui: ReactElement, 
  options?: RenderOptions
) => {
  const renderResult = render(ui, options);
  const axeResults = await axe(renderResult.container);
  
  return {
    ...renderResult,
    axeResults
  };
};
