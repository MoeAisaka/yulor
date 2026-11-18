import { Text } from '@/components/StyledText';
/**
 * Draft attachments and in-flight uploads share the space above the composer.
 */
import * as React from 'react';
import { ActivityIndicator, Platform, ScrollView, View, type ViewStyle } from 'react-native';
import { InteractionPressable as Pressable } from '@/components/InteractionPressable';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { AttachmentPreview } from '@/sync/attachmentTypes';
import { useAttachmentUploadState, type AttachmentUpload } from '@/sync/attachmentUploadState';
import { usePersonalizationMotion } from '@/hooks/usePersonalizationMotion';
import { motionDuration } from '@/sync/personalization';
import { thumbhashToDataUri } from '@/utils/thumbhash';
import { t } from '@/text';

const THUMB_SIZE = 64;
const BORDER_RADIUS = 8;
const FILE_CARD_WIDTH = 200;
const STRIP_GAP = 8;

interface AgentInputAttachmentStripProps {
    sessionId?: string;
    images?: AttachmentPreview[];
    onRemove?: (id: string) => void;
}

export function AgentInputAttachmentStrip({ sessionId, images = [], onRemove }: AgentInputAttachmentStripProps) {
    const { theme } = useUnistyles();
    const uploads = useAttachmentUploadState(state => sessionId ? state.bySession.get(sessionId) : undefined);
    const scrollRef = React.useRef<ScrollView>(null);
    const motion = usePersonalizationMotion();
    const activeIndex = uploads?.findIndex(upload => upload.state.status === 'uploading') ?? -1;

    React.useEffect(() => {
        if (activeIndex >= 0) {
            scrollRef.current?.scrollTo({ x: activeIndex * (FILE_CARD_WIDTH + STRIP_GAP), animated: motion !== 'off' });
        }
    }, [activeIndex, motion, sessionId]);

    if (!images.length && !uploads?.length) return null;

    return (
        <ScrollView
            ref={scrollRef}
            testID="agent-input-attachments"
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.strip}
            contentContainerStyle={styles.stripContent}
            keyboardShouldPersistTaps="always"
        >
            {uploads?.map(upload => <UploadCard key={`upload-${upload.batchId}-${upload.id}`} upload={upload} />)}
            {images.map((img) => (
                <AttachmentThumbnail
                    key={img.id}
                    image={img}
                    onRemove={onRemove}
                    theme={theme}
                />
            ))}
        </ScrollView>
    );
}

function UploadCard({ upload }: { upload: AttachmentUpload }) {
    const { theme } = useUnistyles();
    const motion = usePersonalizationMotion();
    const { state } = upload;
    const percent = state.status === 'uploading' ? state.percent : undefined;
    const status = state.status === 'uploading'
        ? t('lmc.common.attachmentUploading')
        : state.status === 'waiting'
            ? t('lmc.common.attachmentUploadWaiting')
            : state.status === 'uploaded' ? t('lmc.common.attachmentUploaded') : t('imageUpload.uploadFailedTitle');
    const fillTransition = Platform.OS === 'web'
        ? { transitionProperty: 'width', transitionDuration: `${motionDuration(motion, 180)}ms` } as ViewStyle
        : undefined;

    return (
        <View testID="agent-input-upload" style={styles.fileCard}>
            <Ionicons name="document-outline" size={20} color={theme.colors.textSecondary} />
            <View style={styles.fileDetails}>
                <Text numberOfLines={1} style={styles.fileName}>{upload.name}</Text>
                <View style={styles.uploadStatus}>
                    <Text numberOfLines={1} style={styles.fileStatus}>{status}</Text>
                    {percent !== undefined && <Text style={styles.uploadPercent}>{percent}%</Text>}
                    {state.status === 'uploading' && percent === undefined && motion !== 'off' && (
                        <ActivityIndicator size={12} color={theme.colors.textSecondary} />
                    )}
                </View>
                {percent !== undefined && (
                    <View accessibilityRole="progressbar" accessibilityLabel={`${status} ${upload.name}`}
                        accessibilityValue={{ min: 0, max: 100, now: percent }}
                        aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}
                        style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${percent}%` }, fillTransition]} />
                    </View>
                )}
            </View>
        </View>
    );
}

function AttachmentThumbnail({
    image,
    onRemove,
    theme,
}: {
    image: AttachmentPreview;
    onRemove?: (id: string) => void;
    theme: any;
}) {
    // Build placeholder from thumbhash if available
    const placeholder = React.useMemo(() => {
        if (!image.thumbhash) return undefined;
        const uri = thumbhashToDataUri(image.thumbhash);
        return uri ? { uri } : undefined;
    }, [image.thumbhash]);

    const isImage = image.mimeType.startsWith('image/');
    if (!isImage) {
        const kb = image.size > 0 ? (image.size >= 1024 * 1024 ? `${(image.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(image.size / 1024))} KB`) : '';
        return (
            <View testID="agent-input-attachment" style={styles.fileCard}>
                <Ionicons name="document-outline" size={20} color={theme.colors.textSecondary} />
                <View style={styles.fileDetails}>
                    <Text numberOfLines={1} style={styles.fileName}>{image.name}</Text>
                    <Text numberOfLines={1} style={styles.fileStatus}>{kb || t('lmc.common.attachedFile')} · {t('lmc.newSessionBar.sendToSessionMac')}</Text>
                </View>
                {onRemove && <Pressable onPress={() => onRemove(image.id)} hitSlop={4} style={(p) => [styles.removeButton, { backgroundColor: theme.colors.surfaceHigh, opacity: p.pressed ? 0.7 : 1 }]}>
                    <Ionicons name="close" size={10} color={theme.colors.text} />
                </Pressable>}
            </View>
        );
    }
    return (
        <View testID="agent-input-attachment" style={[
            styles.thumbContainer,
            { borderColor: theme.colors.divider }
        ]}>
            <Image
                source={{ uri: image.uri }}
                placeholder={placeholder}
                style={[{ width: THUMB_SIZE, height: THUMB_SIZE }, styles.thumb]}
                contentFit="cover"
                transition={150}
            />
            {/* Remove button */}
            {onRemove && <Pressable
                onPress={() => onRemove(image.id)}
                hitSlop={4}
                style={(p) => [
                    styles.removeButton,
                    { backgroundColor: theme.colors.surfaceHigh, opacity: p.pressed ? 0.7 : 1 }
                ]}
            >
                <Ionicons name="close" size={10} color={theme.colors.text} />
            </Pressable>}
        </View>
    );
}

const styles = StyleSheet.create(theme => ({
    strip: {
        marginBottom: 8,
        marginHorizontal: 8,
    },
    stripContent: {
        flexDirection: 'row',
        gap: STRIP_GAP,
        paddingHorizontal: 4,
    },
    thumbContainer: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: BORDER_RADIUS,
        overflow: 'visible',
        borderWidth: 1,
        position: 'relative',
    },
    thumb: {
        borderRadius: BORDER_RADIUS,
    },
    fileCard: {
        height: THUMB_SIZE,
        width: FILE_CARD_WIDTH,
        borderRadius: BORDER_RADIUS,
        borderWidth: 1,
        borderColor: theme.colors.divider,
        backgroundColor: theme.colors.surfaceHigh,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 10,
        position: 'relative',
    },
    fileDetails: { flex: 1, minWidth: 0 },
    fileName: { fontSize: 12, lineHeight: 17, color: theme.colors.text },
    fileStatus: { fontSize: 11, lineHeight: 15, color: theme.colors.textSecondary, flexShrink: 1 },
    uploadStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
    uploadPercent: { fontSize: 11, lineHeight: 15, color: theme.colors.textSecondary, fontVariant: ['tabular-nums'] },
    progressTrack: { height: 3, marginTop: 4, borderRadius: 2, backgroundColor: theme.colors.divider, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 2, backgroundColor: theme.colors.radio.active },
    removeButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
}));
