import pg from 'pg';

function loadCa() {
    if (process.env.DB_CA_B64) {
        return Buffer.from(process.env.DB_CA_B64.trim(), 'base64').toString('utf8');
    }
    if (process.env.DB_CA) {
        return process.env.DB_CA.replace(/\\n/g, '\n');
    }
    return undefined;
}

const ca = loadCa();
const useSSL = process.env.DB_SSL === 'true';

const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete('sslmode');

export const pool = new pg.Pool({
    connectionString: url.toString(),
    ssl: useSSL
        ? (ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false })
        : false,
    connectionTimeoutMillis: 5000,
});