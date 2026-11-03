import { createHash } from 'node:crypto';
export function nodeSha256(bytes) { return new Uint8Array(createHash('sha256').update(bytes).digest()); }
