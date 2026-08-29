import { fileURLToPath } from 'node:url';
import { runSeed } from './seed-demo.js';

const RESET_CONFIRMATION = 'EDUCONNECT-RESET';

const printUsage = (): void => {
    console.log(`Uso:
  SEED_RESET_CONFIRM=${RESET_CONFIRMATION} yarn seed:reset
  yarn seed:reset -- --help

Este comando elimina la base indicada por DATABASE_URL y vuelve a crear el dataset demo.
No se puede ejecutar con NODE_ENV=production.`);
};

const runReset = async (): Promise<void> => {
    if (process.env.SEED_RESET_CONFIRM !== RESET_CONFIRMATION) {
        throw new Error(`Reset bloqueado. Define SEED_RESET_CONFIRM=${RESET_CONFIRMATION} para confirmar el borrado total.`);
    }

    await runSeed({ reset: true });
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        printUsage();
    } else {
        runReset().catch((error) => {
            console.error('Error ejecutando seed reset:', error);
            process.exitCode = 1;
        });
    }
}
