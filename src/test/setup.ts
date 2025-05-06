import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { fetch, Request, Response } from 'cross-fetch';

// Use fetch globally
global.fetch = fetch;
global.Request = Request;
global.Response = Response;

// Mock browser object
(global as any).browser = {
    storage: {
        local: {
            get: vi.fn().mockResolvedValue({
                settings: {
                    nativeLanguage: 'zh-CN',
                },
            }),
            set: vi.fn().mockResolvedValue(undefined),
        },
    },
};

// Clean up after each test
afterEach(() => {
    cleanup();
});

// Clear all mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
});
