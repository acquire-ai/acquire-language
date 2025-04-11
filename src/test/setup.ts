import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { fetch, Request, Response } from 'cross-fetch';

// Use fetch globally
global.fetch = fetch;
global.Request = Request;
global.Response = Response;

// Clean up after each test
afterEach(() => {
  cleanup();
}); 