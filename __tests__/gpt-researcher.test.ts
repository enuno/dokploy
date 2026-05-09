/**
 * gpt-researcher blueprint validation tests
 *
 * Tests real file behavior: existence, content conventions, and structural
 * requirements for the Dokploy template. RED = files don't exist yet.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

const BLUEPRINT_DIR = path.join(__dirname, '..', 'blueprints', 'gpt-researcher');
const COMPOSE_FILE = path.join(BLUEPRINT_DIR, 'docker-compose.yml');
const TOML_FILE = path.join(BLUEPRINT_DIR, 'template.toml');
const README_FILE = path.join(BLUEPRINT_DIR, 'README.md');

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

describe('gpt-researcher blueprint', () => {
  describe('file existence', () => {
    test('blueprint directory exists', () => {
      expect(fs.existsSync(BLUEPRINT_DIR)).toBe(true);
    });

    test('docker-compose.yml exists', () => {
      expect(fs.existsSync(COMPOSE_FILE)).toBe(true);
    });

    test('template.toml exists', () => {
      expect(fs.existsSync(TOML_FILE)).toBe(true);
    });

    test('README.md exists', () => {
      expect(fs.existsSync(README_FILE)).toBe(true);
    });
  });

  describe('docker-compose.yml — structure', () => {
    test('defines gpt-researcher service', () => {
      const content = readFile(COMPOSE_FILE);
      expect(content).toContain('gpt-researcher:');
    });

    test('defines gptr-nextjs service', () => {
      const content = readFile(COMPOSE_FILE);
      expect(content).toContain('gptr-nextjs:');
    });

    test('all services have restart: always', () => {
      const content = readFile(COMPOSE_FILE);
      const restartCount = (content.match(/restart:\s*always/g) || []).length;
      expect(restartCount).toBeGreaterThanOrEqual(2);
    });

    test('defines gptr-net internal network', () => {
      const content = readFile(COMPOSE_FILE);
      expect(content).toContain('gptr-net:');
    });

    test('defines dokploy-network as external', () => {
      const content = readFile(COMPOSE_FILE);
      expect(content).toMatch(/dokploy-network:\s*\n\s*external:\s*true/);
    });

    test('defines required named volumes', () => {
      const content = readFile(COMPOSE_FILE);
      expect(content).toContain('gptr-docs:');
      expect(content).toContain('gptr-outputs:');
      expect(content).toContain('gptr-logs:');
    });

    test('both services have health checks', () => {
      const content = readFile(COMPOSE_FILE);
      const healthcheckCount = (content.match(/healthcheck:/g) || []).length;
      expect(healthcheckCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('docker-compose.yml — Traefik routing', () => {
    test('backend routed to api subdomain on port 8000', () => {
      const content = readFile(COMPOSE_FILE);
      expect(content).toContain('gptr-api');
      expect(content).toContain('api.');
      expect(content).toContain('server.port=8000');
    });

    test('frontend routed to main domain on port 3000', () => {
      const content = readFile(COMPOSE_FILE);
      expect(content).toContain('gptr-web');
      expect(content).toContain('server.port=3000');
    });

    test('both routers use websecure entrypoint', () => {
      const content = readFile(COMPOSE_FILE);
      const websecureCount = (content.match(/entrypoints=websecure/g) || []).length;
      expect(websecureCount).toBeGreaterThanOrEqual(2);
    });

    test('both routers use letsencrypt certresolver', () => {
      const content = readFile(COMPOSE_FILE);
      const certCount = (content.match(/certresolver=letsencrypt/g) || []).length;
      expect(certCount).toBeGreaterThanOrEqual(2);
    });

    test('traefik.docker.network=dokploy-network present for both services', () => {
      const content = readFile(COMPOSE_FILE);
      const networkLabelCount = (content.match(/traefik\.docker\.network=dokploy-network/g) || []).length;
      expect(networkLabelCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('docker-compose.yml — security', () => {
    test('OPENAI_API_KEY uses required variable syntax', () => {
      const content = readFile(COMPOSE_FILE);
      expect(content).toMatch(/OPENAI_API_KEY:.*\$\{OPENAI_API_KEY:\?/);
    });

    test('TAVILY_API_KEY uses required variable syntax', () => {
      const content = readFile(COMPOSE_FILE);
      expect(content).toMatch(/TAVILY_API_KEY:.*\$\{TAVILY_API_KEY:\?/);
    });

    test('no hardcoded secret values', () => {
      const content = readFile(COMPOSE_FILE);
      // Passwords/keys must use variable syntax, not bare values
      expect(content).not.toMatch(/(?:PASSWORD|SECRET|KEY):\s+[a-zA-Z0-9]{8,}/);
    });

    test('NEXT_PUBLIC_GPTR_API_URL points to api subdomain', () => {
      const content = readFile(COMPOSE_FILE);
      expect(content).toMatch(/NEXT_PUBLIC_GPTR_API_URL.*api\./);
    });
  });

  describe('template.toml — structure', () => {
    test('has [variables] section with domain', () => {
      const content = readFile(TOML_FILE);
      expect(content).toContain('[variables]');
      expect(content).toContain('domain = "${domain}"');
    });

    test('has api_domain variable derived from domain', () => {
      const content = readFile(TOML_FILE);
      expect(content).toContain('api_domain');
    });

    test('has two [[config.domains]] entries', () => {
      const content = readFile(TOML_FILE);
      const domainCount = (content.match(/\[\[config\.domains\]\]/g) || []).length;
      expect(domainCount).toBe(2);
    });

    test('frontend domain entry maps gptr-nextjs on port 3000', () => {
      const content = readFile(TOML_FILE);
      expect(content).toContain('serviceName = "gptr-nextjs"');
      expect(content).toContain('port = 3000');
    });

    test('backend domain entry maps gpt-researcher on port 8000', () => {
      const content = readFile(TOML_FILE);
      expect(content).toContain('serviceName = "gpt-researcher"');
      expect(content).toContain('port = 8000');
    });

    test('has [config.env] section', () => {
      const content = readFile(TOML_FILE);
      expect(content).toContain('[config.env]');
    });

    test('NEXT_PUBLIC_GPTR_API_URL in config.env references api_domain', () => {
      const content = readFile(TOML_FILE);
      expect(content).toMatch(/NEXT_PUBLIC_GPTR_API_URL.*api_domain/);
    });

    test('openai_api_key and tavily_api_key are blank for user input', () => {
      const content = readFile(TOML_FILE);
      expect(content).toMatch(/openai_api_key\s*=\s*""/);
      expect(content).toMatch(/tavily_api_key\s*=\s*""/);
    });
  });

  describe('docker-compose.yml — YAML syntax', () => {
    test('docker compose config parses without hard YAML errors', () => {
      // Variable substitution warnings are expected (correct behavior for templates).
      // Only real YAML/structural errors should fail this test.
      try {
        execFileSync('docker', ['compose', '-f', COMPOSE_FILE, 'config'], {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } catch (err: unknown) {
        const error = err as { stdout?: string; stderr?: string };
        const combined = (error.stdout ?? '') + (error.stderr ?? '');
        // Missing env vars are expected in test environments
        if (combined.includes('variable is not set') || combined.includes('required variable')) {
          return;
        }
        throw new Error(`docker compose config failed:\n${combined}`);
      }
    });
  });

  describe('blueprints/README.md index', () => {
    test('gpt-researcher entry exists in blueprints index', () => {
      const indexPath = path.join(__dirname, '..', 'blueprints', 'README.md');
      const content = readFile(indexPath);
      expect(content).toContain('[gpt-researcher]');
    });

    test('gpt-researcher entry appears after goaccess-npm', () => {
      const indexPath = path.join(__dirname, '..', 'blueprints', 'README.md');
      const content = readFile(indexPath);
      const goaccessPos = content.indexOf('goaccess-npm');
      const gptPos = content.indexOf('gpt-researcher');
      expect(gptPos).toBeGreaterThan(goaccessPos);
    });

    test('gpt-researcher entry appears before grafana-observability', () => {
      const indexPath = path.join(__dirname, '..', 'blueprints', 'README.md');
      const content = readFile(indexPath);
      const gptPos = content.indexOf('gpt-researcher');
      const grafanaPos = content.indexOf('grafana-observability');
      expect(gptPos).toBeLessThan(grafanaPos);
    });
  });
});
