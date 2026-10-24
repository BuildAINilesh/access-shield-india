import { describe, expect, it } from 'vitest';
import {
  interpolateCreds,
  journeyDefinitionSchema,
  slugifyJourneyName,
} from './journey-dsl';

describe('journey-dsl', () => {
  it('validates a login journey', () => {
    const parsed = journeyDefinitionSchema.safeParse({
      startUrl: 'https://example.com/login',
      steps: [
        { id: 'u', action: 'fill', selector: '#email', value: '{{creds.username}}' },
        { id: 'p', action: 'fill', selector: '#password', value: '{{creds.password}}' },
        { id: 'go', action: 'click', selector: 'button[type=submit]' },
        { id: 'axe', action: 'axe' },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it('interpolates credential placeholders', () => {
    expect(interpolateCreds('hi {{creds.username}}', { username: 'a@b.com' })).toBe(
      'hi a@b.com',
    );
  });

  it('slugifies names', () => {
    expect(slugifyJourneyName('Login → Dashboard')).toBe('login-dashboard');
  });
});
