import test from 'node:test';
import assert from 'node:assert/strict';
import { detectImageMime, isAllowedImage } from '../lib/image-validation.mjs';

test('recognises PNG using its file signature', () => {
  const bytes = Uint8Array.from([137,80,78,71,13,10,26,10,0]);
  assert.equal(detectImageMime(bytes), 'image/png');
  assert.equal(isAllowedImage(bytes, 'image/png'), true);
});

test('recognises JPEG using its file signature', () => {
  const bytes = Uint8Array.from([255,216,255,224,0]);
  assert.equal(detectImageMime(bytes), 'image/jpeg');
  assert.equal(isAllowedImage(bytes, 'image/jpeg'), true);
});

test('recognises WebP using RIFF and WEBP markers', () => {
  const bytes = Uint8Array.from([82,73,70,70,0,0,0,0,87,69,66,80]);
  assert.equal(detectImageMime(bytes), 'image/webp');
  assert.equal(isAllowedImage(bytes, 'image/webp'), true);
});

test('rejects spoofed MIME types and unknown file signatures', () => {
  const bytes = Uint8Array.from([0,1,2,3,4,5,6,7,8,9,10,11]);
  assert.equal(detectImageMime(bytes), null);
  assert.equal(isAllowedImage(bytes, 'image/png'), false);
});
