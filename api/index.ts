import app from '../src/app.js';
import appConfig from '../src/config/config.js';

let databaseConnectionPromise: Promise<boolean> | null = null;

const ensureDatabaseConnection = async (): Promise<void> => {
    if (!databaseConnectionPromise) {
        databaseConnectionPromise = appConfig.connectDatabase().catch((error) => {
            databaseConnectionPromise = null;
            throw error;
        });
    }

    await databaseConnectionPromise;
};

export default async function handler(req: Parameters<typeof app>[0], res: Parameters<typeof app>[1]) {
    await ensureDatabaseConnection();
    return app(req, res);
}
