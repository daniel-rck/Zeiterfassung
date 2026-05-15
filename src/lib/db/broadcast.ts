export const BROADCAST_CHANNEL = 'zeiterfassung-db'

export type BroadcastMessage =
  | { type: 'project-changed'; id: string }
  | { type: 'project-deleted'; id: string }
  | { type: 'tag-changed'; id: string }
  | { type: 'tag-deleted'; id: string }
  | { type: 'entry-changed'; id: string }
  | { type: 'entry-deleted'; id: string }
  | { type: 'timer-started'; id: string }
  | { type: 'timer-stopped'; id: string }
  | { type: 'invoice-changed'; id: string }
  | { type: 'invoice-deleted'; id: string }
  | { type: 'breaks-changed' }
  | { type: 'settings-changed' }
  | { type: 'db-cleared' }

export function broadcast(message: BroadcastMessage): void {
  if (typeof BroadcastChannel === 'undefined') return
  const channel = new BroadcastChannel(BROADCAST_CHANNEL)
  channel.postMessage(message)
  channel.close()
}

export function subscribe(
  listener: (message: BroadcastMessage) => void,
): () => void {
  if (typeof BroadcastChannel === 'undefined') {
    return () => {}
  }
  const channel = new BroadcastChannel(BROADCAST_CHANNEL)
  const handler = (event: MessageEvent<BroadcastMessage>) => {
    listener(event.data)
  }
  channel.addEventListener('message', handler)
  return () => {
    channel.removeEventListener('message', handler)
    channel.close()
  }
}
