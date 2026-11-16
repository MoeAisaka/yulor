import React from 'react';
// @ts-expect-error local renderer has no declarations
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const show = vi.hoisted(() => vi.fn(() => 'preview-modal'));
vi.mock('react-native', () => ({ View: 'View' }));
vi.mock('react-native-unistyles', () => ({ useUnistyles: () => ({ theme: { colors: {} } }) }));
vi.mock('@/components/StyledText', () => ({ Text: 'Text' }));
vi.mock('@/components/FileViewPanel', () => ({ FileViewPanel: 'FileViewPanel' }));
vi.mock('@/components/AllFilesDiffView', () => ({ AllFilesDiffView: 'AllFilesDiffView' }));
vi.mock('@/modal/components/BaseModal', () => ({ BaseModal: 'BaseModal' }));
vi.mock('@/modal', () => ({ Modal: { show } }));
vi.mock('./UtilityDialog', () => ({ UtilityDialog: 'UtilityDialog' }));
vi.mock('@/text', () => ({ t: (key: string) => key }));
import { SessionPreviewDialog, openSessionFileDialog } from './SessionPreviewDialog';
let tree: ReturnType<typeof create> | undefined;
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); });
afterEach(async () => { if (tree) await act(async () => tree!.unmount()); tree = undefined; vi.unstubAllGlobals(); });
describe('session preview window', () => {
    it.each(['claude', 'codex'])('hosts %s file controls inside a bounded native modal and closes through its owner', async sessionId => {
        const close = vi.fn();
        await act(async () => { tree = create(React.createElement(SessionPreviewDialog, { sessionId, filePath: 'D:\\Project\\report.md', onClose: close })); });
        const modal = tree!.root.findByType('BaseModal');
        const dialog = tree!.root.findByType('UtilityDialog');
        expect(modal.props.visible).toBe(true);
        expect(modal.props.blurBackdrop).toBe(true);
        expect(dialog.props.title).toBe('report.md');
        expect(dialog.props.maxWidth).toBe(1100);
        const panel = dialog.findByType('FileViewPanel');
        expect(panel.props.sessionId).toBe(sessionId);
        await act(async () => panel.props.onHeaderRightSlotChange(React.createElement('FileControls')));
        expect(dialog.findAllByType('FileControls')).toHaveLength(1);
        expect(dialog.findAllByType('AllFilesDiffView')).toHaveLength(0);
        await act(async () => modal.props.onClose());
        expect(close).toHaveBeenCalledOnce();
    });
    it('hosts change previews in the same window with their own toolbar', async () => {
        await act(async () => { tree = create(React.createElement(SessionPreviewDialog, { sessionId: 'codex', diffFile: 'src/main.ts' })); });
        const dialog = tree!.root.findByType('UtilityDialog');
        expect(dialog.props.title).toBe('files.changes');
        const diff = dialog.findByType('AllFilesDiffView');
        expect(diff.props.scrollToFile).toBe('src/main.ts');
        await act(async () => diff.props.onHeaderRightSlotChange(React.createElement('DiffControls')));
        expect(dialog.findAllByType('DiffControls')).toHaveLength(1);
        expect(dialog.findAllByType('FileViewPanel')).toHaveLength(0);
    });
    it('opens a floating file window for embedded transcript fallbacks', () => {
        expect(openSessionFileDialog('codex', '/project/report.md')).toBe(true);
        expect(show).toHaveBeenCalledWith(expect.objectContaining({ props: { sessionId: 'codex', filePath: '/project/report.md' }, blurBackdrop: true }));
    });
});
