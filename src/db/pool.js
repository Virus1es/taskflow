import pg from 'pg';

const { Pool } = pg;

function loadCa() {
    if (process.env.DB_CA_B64) {
        return Buffer.from(process.env.DB_CA_B64, 'base64').toString('utf8');
    }
    if (process.env.DB_CA) {
        return process.env.DB_CA.replace(/\\n/g, '\n');
    }
    return undefined;
}

const ca = loadCa();

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: ca ?
        { ca, rejectUnauthorized: true } :
        { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 5000,
});
