import { describe, expect, it } from 'vitest';
import { beginAttachmentUpload, useAttachmentUploadState } from './attachmentUploadState';

describe('composer attachment uploads', () => {
    it('keeps overlapping batches and other sessions independent through progress and cleanup', () => {
        const file = { id: 'file', name: 'report.pdf' };
        const first = beginAttachmentUpload('session-a', [file, { id: 'next', name: 'slides.pptx' }]);
        const second = beginAttachmentUpload('session-a', [file]);
        const other = beginAttachmentUpload('session-b', [file]);
        const get = (id: string) => useAttachmentUploadState.getState().bySession.get(id);
        const otherUploads = get('session-b');

        try {
            first.update('file', { status: 'uploading', percent: 77 });
            expect(get('session-a')?.map(({ state }) => state)).toEqual([
                { status: 'uploading', percent: 77 },
                { status: 'waiting' },
                { status: 'waiting' },
            ]);
            expect(get('session-b')).toBe(otherUploads);

            second.update('file', { status: 'failed' });
            first.finish();
            first.update('file', { status: 'uploaded' });
            expect(get('session-a')?.map(({ state }) => state)).toEqual([{ status: 'failed' }]);
        } finally {
            first.finish();
            second.finish();
            other.finish();
        }
        expect(get('session-a')).toBeUndefined();
        expect(get('session-b')).toBeUndefined();
    });
});
