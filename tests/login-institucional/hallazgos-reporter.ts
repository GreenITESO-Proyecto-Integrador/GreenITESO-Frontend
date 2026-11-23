/**
 * Reporter de Playwright para las pruebas del login institucional: junta las pruebas con
 * la anotación `hallazgo` y escribe un reporte en Markdown por integrante.
 *
 * Referencia: ID01 ("Identidad 1" en la división de trabajo del equipo) = login
 * institucional con Microsoft (mock y Entra ID), dominio @iteso.mx, alta o
 * actualización del usuario y rol según el puesto.
 *
 * Uso:
 *   HALLAZGOS_REPORT=docs/pruebas/hallazgos-id01-front.md \
 *     pnpm exec playwright test tests/login-institucional --reporter=line,./tests/login-institucional/hallazgos-reporter.ts
 *
 * Sin HALLAZGOS_REPORT solo imprime el resumen en la terminal.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import type { Hallazgo } from './login-helpers';

interface Entry extends Hallazgo {
  prueba: string;
  estado: 'pendiente' | 'resuelto (quitar test.fail)';
}

const SEVERITY_ORDER = { alta: 0, media: 1, baja: 2 } as const;

class HallazgosReporter implements Reporter {
  private readonly entries = new Map<string, Entry>();

  onTestEnd(test: TestCase, result: TestResult): void {
    const annotation = test.annotations.find(item => item.type === 'hallazgo');
    if (!annotation?.description || result.status === 'skipped') return;
    const data = JSON.parse(annotation.description) as Hallazgo;
    // Same test in several browsers: one entry, and "pendiente" wins.
    const estado = test.outcome() === 'expected' ? 'pendiente' : 'resuelto (quitar test.fail)';
    const previous = this.entries.get(test.title);
    if (previous?.estado === 'pendiente') return;
    this.entries.set(test.title, { ...data, prueba: test.title, estado });
  }

  onEnd(): void {
    const entries = [...this.entries.values()].sort(
      (a, b) =>
        SEVERITY_ORDER[a.severidad] - SEVERITY_ORDER[b.severidad] ||
        a.integrante.localeCompare(b.integrante),
    );
    if (entries.length === 0) return;

    console.log('\nHallazgos ID01: login institucional (frontend)');
    for (const entry of entries) {
      console.log(
        `[${entry.severidad.toUpperCase()}] ${entry.estado} ${entry.integrante}: ${entry.titulo}`,
      );
    }

    const path = process.env['HALLAZGOS_REPORT'];
    if (!path) return;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, toMarkdown(entries), 'utf-8');
    console.log(`Reporte escrito en ${path}`);
  }

  printsToStdio(): boolean {
    return false;
  }
}

function toMarkdown(entries: Entry[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    '# Hallazgos ID01: login institucional (frontend)',
    '',
    'ID01 = Identidad 1 en la división de trabajo: login con Microsoft (mock y Entra ID),',
    'dominio @iteso.mx, alta o actualización del usuario y rol por puesto.',
    '',
    `Generado por Playwright el ${today}. Cada hallazgo tiene una prueba que afirma el`,
    'comportamiento correcto y usa `test.fail()` mientras el problema siga ahí.',
    '',
    '## Resumen por integrante',
    '',
    '| Integrante | Pendientes | Resueltos |',
    '|---|---|---|',
  ];
  for (const integrante of [...new Set(entries.map(entry => entry.integrante))].sort()) {
    const mine = entries.filter(entry => entry.integrante === integrante);
    const pending = mine.filter(entry => entry.estado === 'pendiente').length;
    lines.push(`| ${integrante} | ${pending} | ${mine.length - pending} |`);
  }
  lines.push('', '## Detalle', '');
  entries.forEach((entry, index) => {
    lines.push(
      `### ${index + 1}. ${entry.titulo}`,
      '',
      `- **Integrante:** ${entry.integrante}`,
      `- **Severidad:** ${entry.severidad}`,
      `- **Estado:** ${entry.estado}`,
      `- **Qué pasa:** ${entry.detalle}`,
      `- **Qué hacer:** ${entry.recomendacion}`,
      `- **Prueba:** \`tests/login-institucional/hallazgos.spec.ts\` › ${entry.prueba}`,
      '',
    );
  });
  return lines.join('\n');
}

export default HallazgosReporter;
