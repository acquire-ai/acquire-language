import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPlatformHandler } from '../factory';
import { YouTubePlatformHandler } from '../youtube';
import { isYouTubeVideoUrl } from '@/core/utils';

// Mock isYouTubeVideoUrl
vi.mock('@/core/utils', () => ({
    isYouTubeVideoUrl: vi.fn(),
}));

// Mock platform handlers
vi.mock('../youtube', () => ({
    YouTubePlatformHandler: vi.fn().mockImplementation(() => ({
        initialize: vi.fn(),
        createSubtitleHandler: vi.fn(),
    })),
}));

describe('Platform Factory Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create YouTubePlatformHandler for YouTube URL', () => {
        const url = 'https://www.youtube.com/watch?v=12345';

        // Mock isYouTubeVideoUrl to return true for this test
        (isYouTubeVideoUrl as any).mockReturnValue(true);

        const handler = createPlatformHandler(url);

        // Since handler is a mock, we can't use toBeInstanceOf
        expect(handler).toBeTruthy();
        expect(isYouTubeVideoUrl).toHaveBeenCalledWith(url);
        expect(YouTubePlatformHandler).toHaveBeenCalled();
    });

    it('should return null for unsupported URL', () => {
        const url = 'https://www.example.com';

        // Mock isYouTubeVideoUrl to return false for this test
        (isYouTubeVideoUrl as any).mockReturnValue(false);

        const handler = createPlatformHandler(url);

        expect(handler).toBeNull();
        expect(isYouTubeVideoUrl).toHaveBeenCalledWith(url);
        expect(YouTubePlatformHandler).not.toHaveBeenCalled();
    });
});
