const signatureMatches = (bytes, signature, offset = 0) =>
  bytes.length >= offset + signature.length && signature.every((value, index) => bytes[offset + index] === value);

export function detectImageMime(bytes) {
  if (signatureMatches(bytes, [137, 80, 78, 71, 13, 10, 26, 10])) return 'image/png';
  if (signatureMatches(bytes, [255, 216, 255])) return 'image/jpeg';
  if (
    bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) return 'image/webp';
  return null;
}

export function isAllowedImage(bytes, declaredMime) {
  return detectImageMime(bytes) === declaredMime;
}
