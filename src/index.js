import app from './app.js';
import appConfig from './config/config.js';

const port = appConfig.app.port;

async function startServer() {
    try {
        await appConfig.connectDatabase();
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();

export default app;
