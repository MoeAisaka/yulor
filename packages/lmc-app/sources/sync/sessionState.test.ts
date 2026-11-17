import {it,expect} from 'vitest';
import {resolveSessionState} from './sessionState';

it('restores working state from durable runtime state after browser reconnect', () => {
    expect(resolveSessionState({ isOnline: true, thinking: false, agentState: { runtime: { phase: 'working', pid: 123, updatedAt: 10 } } as any })).toBe('thinking');
});


it.each(['codex', 'claude'])('queues plain sends using durable working state for %s', async flavor => {
    const { resolveSessionSendIntent } = await import('./sessionState');
    const session = { thinking: false, agentState: { runtime: { phase: 'working' } }, metadata: { flavor, sessionCapabilities: { turnQueue: true } } } as any;
    expect(resolveSessionSendIntent(session, 'chat')).toBe('queue');
    expect(resolveSessionSendIntent(session, 'option')).toBe('queue');
    expect(resolveSessionSendIntent(session, 'chat', 'steer')).toBe('steer');
    expect(resolveSessionSendIntent(session, 'chat', 'interrupt')).toBe('interrupt');
});

it('keeps idle, unsupported and explicit send policies intact', async () => {
    const { resolveSessionSendIntent } = await import('./sessionState');
    const idle = { thinking: false, agentState: { runtime: { phase: 'idle' } }, metadata: { sessionCapabilities: { turnQueue: true } } } as any;
    expect(resolveSessionSendIntent(idle, 'chat')).toBeUndefined();
    expect(resolveSessionSendIntent({ ...idle, thinking: true }, 'chat')).toBe('queue');
    expect(resolveSessionSendIntent({ ...idle, thinking: true, metadata: {} }, 'chat')).toBeUndefined();
    expect(resolveSessionSendIntent({ ...idle, thinking: true }, 'system')).toBeUndefined();
    expect(resolveSessionSendIntent({ ...idle, thinking: true }, 'native-answer')).toBeUndefined();
    expect(resolveSessionSendIntent(idle, 'chat', 'queue')).toBe('queue');
});
