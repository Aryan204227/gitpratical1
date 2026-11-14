export type SupportedImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export function detectImageMime(bytes: Uint8Array): SupportedImageMime | null;
export function isAllowedImage(bytes: Uint8Array, declaredMime: string): boolean;
