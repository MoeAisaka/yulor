import * as React from 'react';
import { View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';
import { Text } from '@/components/StyledText';
import { FileViewPanel } from '@/components/FileViewPanel';
import { AllFilesDiffView } from '@/components/AllFilesDiffView';
import { BaseModal } from '@/modal/components/BaseModal';
import { Modal } from '@/modal';
import { UtilityDialog } from './UtilityDialog';
import { t } from '@/text';

type PreviewProps = {
    sessionId: string;
    filePath?: string;
    diffFile?: string | null;
    onClose?: () => void;
};

/** Both entry points own their controls; the chat header stays untouched. */
export function SessionPreviewContent({ sessionId, filePath, diffFile, onClose }: PreviewProps) {
    const { theme } = useUnistyles();
    const [controls, setControls] = React.useState<React.ReactNode>(null);
    const title = filePath ? filePath.split(/[/\\]/).pop() || filePath : t('files.changes');
    return <UtilityDialog title={title} onClose={onClose} maxWidth={1100} testID="session-preview-dialog">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8,
            paddingHorizontal: 16, paddingVertical: 8, minHeight: 44,
            borderBottomWidth: 1, borderBottomColor: theme.colors.divider, backgroundColor: theme.colors.surface }}>
            <Text selectable numberOfLines={1} style={{ flexGrow: 1, flexShrink: 1, minWidth: 100,
                fontSize: 12, color: theme.colors.textSecondary }}>{filePath || diffFile || title}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>{controls}</View>
        </View>
        <View style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden', backgroundColor: theme.colors.surface }}>
            {filePath
                ? <FileViewPanel key={filePath} sessionId={sessionId} filePath={filePath} onHeaderRightSlotChange={setControls} />
                : <AllFilesDiffView sessionId={sessionId} scrollToFile={diffFile} onHeaderRightSlotChange={setControls} />}
        </View>
    </UtilityDialog>;
}

/** A native modal portal keeps even fixed chat chrome below the preview. */
export function SessionPreviewDialog(props: PreviewProps) {
    return <BaseModal visible onClose={props.onClose} blurBackdrop>
        <SessionPreviewContent {...props} />
    </BaseModal>;
}

/** Embedded transcripts can preview files without pushing a full-page route. */
export function openSessionFileDialog(sessionId: string, filePath: string): boolean {
    return !!Modal.show({ component: SessionPreviewContent, props: { sessionId, filePath }, blurBackdrop: true });
}
