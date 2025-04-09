import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { fetch, Request, Response } from 'cross-fetch';

// 全局使用fetch
global.fetch = fetch;
global.Request = Request;
global.Response = Response;

// 每个测试后清理
afterEach(() => {
  cleanup();
}); 