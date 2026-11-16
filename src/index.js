import 'dotenv/config'
import { app } from './app.js';
import { pool } from './db/pool.js';

const port = Number(process.env.PORT) || 3000;

async function start() {
    try {
        await pool.query('SELECT 1');

        app.listen(port, () => {
            process.stdout.write(`Server started on port ${port}\n`);
        });
    } catch (error) {
        process.stderr.write(`Database connection failed: ${error.message}\n`);
        process.exitCode = 1;
        await pool.end();
    }
}

void start();