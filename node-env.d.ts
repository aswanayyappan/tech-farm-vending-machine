/**
 * Root Ambient Type Declarations for Node.js Built-ins
 */

declare module 'node:crypto' {
  export function randomBytes(size: number): { toString(encoding: string): string };
  export function createHmac(algorithm: string, key: string | Uint8Array): {
    update(data: string | Uint8Array): {
      digest(encoding?: string): string;
    };
  };
  export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;
}

declare module 'crypto' {
  export * from 'node:crypto';
}

declare module 'node:buffer' {
  export class Buffer extends Uint8Array {
    static from(str: string, encoding?: string): Buffer;
    static from(array: ArrayLike<number>): Buffer;
    static alloc(size: number): Buffer;
    static concat(list: Uint8Array[], totalLength?: number): Buffer;
    writeUInt16BE(value: number, offset: number): number;
    copy(target: Uint8Array, targetStart?: number, sourceStart?: number, sourceEnd?: number): number;
  }
}

declare module 'buffer' {
  export * from 'node:buffer';
}

declare module 'node:process' {
  const process: {
    env: Record<string, string | undefined>;
    on(event: string, listener: (...args: any[]) => void): void;
    exit(code?: number): void;
  };
  export default process;
}

declare var process: {
  env: Record<string, string | undefined>;
};

