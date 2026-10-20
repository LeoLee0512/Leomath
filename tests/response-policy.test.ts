import { describe, it, expect } from 'vitest';
import { htmlResponsePolicy, localeRedirectPolicy, varyOn } from '../src/lib/response-policy';

describe('HTML and language redirect cache policy', () => {
  it('prevents storing personalised HTML and declares UTF-8 without losing compression negotiation', () => {
    const headers = new Headers({ 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=3600', Vary: 'Accept-Encoding' });
    htmlResponsePolicy(headers);
    expect(headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect(headers.get('Cache-Control')).toBe('private, no-store');
    expect(headers.get('Vary')).toBe('Accept-Encoding, Cookie');
  });
  it('language redirects vary by both preferences and never get reused for another reader', () => {
    const headers = new Headers({ Vary: 'cookie' });
    localeRedirectPolicy(headers);
    expect(headers.get('Vary')).toBe('cookie, Accept-Language');
    expect(headers.get('Cache-Control')).toBe('private, no-store');
    varyOn(headers, 'COOKIE');
    expect(headers.get('Vary')).toBe('cookie, Accept-Language');
  });
  it('preserves wildcard Vary', () => {
    const headers = new Headers({ Vary: '*' });
    htmlResponsePolicy(headers);
    expect(headers.get('Vary')).toBe('*');
  });
});
