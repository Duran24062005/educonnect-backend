import app from './app.js';
import appConfig from './config/config.js';

const port = appConfig.app.port;

async function startServer() {
    try {
        await appConfig.connectDatabase();
        app.listen(port, () => {
            console.log(`Server running on port ${port} - http://localhost:8000/`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

if (process.env.VERCEL !== '1') {
    startServer();
}

export default app;
