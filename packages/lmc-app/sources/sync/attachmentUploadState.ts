import { create } from 'zustand';
import type { AttachmentPreview } from './attachmentTypes';

type UploadState =
    | { status: 'waiting' | 'uploaded' | 'failed' }
    | { status: 'uploading'; percent?: number };

export type AttachmentUpload = Pick<AttachmentPreview, 'id' | 'name'> & {
    batchId: number;
    state: UploadState;
};

export const useAttachmentUploadState = create<{
    bySession: ReadonlyMap<string, readonly AttachmentUpload[]>;
}>(() => ({ bySession: new Map() }));

let nextBatchId = 0;

export function beginAttachmentUpload(sessionId: string, attachments: readonly Pick<AttachmentPreview, 'id' | 'name'>[]) {
    const batchId = nextBatchId++;
    const entries: AttachmentUpload[] = attachments.map(({ id, name }) => ({
        id, name, batchId, state: { status: 'waiting' },
    }));

    const replace = (transform: (current: readonly AttachmentUpload[]) => readonly AttachmentUpload[]) => {
        useAttachmentUploadState.setState((store) => {
            const current = store.bySession.get(sessionId) ?? [];
            const next = transform(current);
            const bySession = new Map(store.bySession);
            if (next.length) bySession.set(sessionId, next);
            else bySession.delete(sessionId);
            return { bySession };
        });
    };

    replace(current => [...current, ...entries]);
    let finished = false;
    return {
        update(id: string, state: UploadState) {
            if (finished) return;
            replace(current => current.map(entry => (
                entry.batchId === batchId && entry.id === id ? { ...entry, state } : entry
            )));
        },
        finish() {
            if (finished) return;
            finished = true;
            replace(current => current.filter(entry => entry.batchId !== batchId));
        },
    };
}
