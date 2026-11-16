import { beforeEach, describe, expect, it, vi } from 'vitest';
const fallback = vi.hoisted(() => vi.fn(() => true));
vi.mock('./SessionPreviewDialog', () => ({ openSessionFileDialog: fallback }));
import { openSessionFile, useToolOverlay } from './toolOverlayStore';
beforeEach(() => { vi.clearAllMocks(); useToolOverlay.getState().setFileOpener(null); });
describe('file preview routing', () => {
    it('preserves the mounted session host instead of navigating away', () => {
        const open = vi.fn(); useToolOverlay.getState().setFileOpener(open, 'claude');
        expect(openSessionFile('/project/report.md', 'claude')).toBe(true);
        expect(open).toHaveBeenCalledWith('/project/report.md');
        expect(fallback).not.toHaveBeenCalled();
    });
    it('uses a floating fallback when no session host is mounted', () => {
        expect(openSessionFile('/project/report.md', 'codex')).toBe(true);
        expect(fallback).toHaveBeenCalledWith('codex', '/project/report.md');
    });
    it('never reads a file through another mounted session', () => {
        const otherHost = vi.fn(); useToolOverlay.getState().setFileOpener(otherHost, 'claude');
        expect(openSessionFile('/project/report.md', 'codex')).toBe(true);
        expect(otherHost).not.toHaveBeenCalled();
        expect(fallback).toHaveBeenCalledWith('codex', '/project/report.md');
    });
    it('does not guess a session for a contextless path', () => {
        expect(openSessionFile('/project/report.md')).toBe(false);
        expect(fallback).not.toHaveBeenCalled();
    });
});
