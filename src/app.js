import express from 'express';
import { requireAuth } from "./middleware/auth.js";
import { tasksRouter } from "./routes/tasks.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const app = express();

app.use(express.json());

const currentDir = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.resolve(currentDir, '../public')));

app.get('/login/', (req, res) => {
    res.type('text/plain').send(process.env.MOODLE_LOGIN)
});

const api = express.Router();

api.use(requireAuth);

api.get('/author/', (req, res) => {
    res.json({
        login: process.env.MOODLE_LOGIN,
        fullName: process.env.MOODLE_FULL_NAME,
    });
});

api.use('/tasks/', tasksRouter);

app.use('/api/', api);

app.use(errorHandler);