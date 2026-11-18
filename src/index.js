import 'dotenv/config'
import { app } from './app.js';
import { pool } from './db/pool.js';

const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, '0.0.0.0', () => {
    process.stdout.write(`Server started on port ${port}\n`);
});

server.on('error', (err) => {
    console.error('HTTP server failed: ', err);
    process.exitCode = 1;
});



async function checkDatabase() {
    try {
        await pool.query('SELECT 1');
        console.log(`Successfully connected to database`);
    } catch (error) {
        console.error('Database connection failed: ', {
            code: error.code,
            message: error.message
        });
    }
}

// void checkDatabase();