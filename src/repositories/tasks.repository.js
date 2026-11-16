import { randomUUID } from 'node:crypto';
import { pool } from '../db/pool.js';

export async function createTask({title, runId, ownerLogin}) {
    const id = randomUUID();

    const result = await pool.query(
        `
        INSERT INTO tasks (
                           id,
                           owner_login,
                           title,
                           done,
                           run_id
        )
        VALUES ($1, $2, $3, FALSE, $4)
        RETURNING 
            id,
            owner_login AS "ownerLogin",
            title,
            done,
            run_id AS "runId",
            created_at AS "createdAt"
        `,
        [id, ownerLogin, title.trim(), runId],
    );

    return result.rows[0];
}

export async function getTasksByRunId(ownerLogin, runId) {
    const result = await pool.query(
        `
            SELECT id,
                   owner_login AS "ownerLogin",
                   title,
                   done,
                   run_id      AS "runId",
                   created_at  AS "createdAt"
            FROM tasks
            WHERE owner_login = $1
              AND run_id = $2
            ORDER BY created_at, id
        `,
        [ownerLogin, runId],
    );

    return result.rows;
}

export async function getTaskById(ownerLogin, id) {
    const result = await pool.query(
        `
        SELECT
            id,
            owner_login AS "ownerLogin",
            title,
            done,
            run_id AS "runId",
            created_at AS "createdAt"
        FROM tasks
        WHERE owner_login = $1
            AND id = $2
        `,
        [ownerLogin, id],
    )

    return result.rows[0] ?? null;
}

export async function updateTask(ownerLogin, id, changes) {
    const hasTitle = Object.hasOwn(changes, 'title');
    const hasDone = Object.hasOwn(changes, 'done');

    const result = await pool.query(
        `
        UPDATE tasks 
        SET 
            title = CASE 
                WHEN $3::boolean THEN $4::varchar
                ELSE title
            END,
            done = CASE
                WHEN $5::boolean THEN $6::boolean
                ELSE done
            END
        WHERE owner_login = $1
            AND id = $2
        RETURNING 
            id,
            owner_login AS "ownerLogin",
            title,
            done,
            run_id AS "runId",
            created_at AS "createdAt"
        `,
        [
            ownerLogin,
            id,
            hasTitle,
            hasTitle ? changes.title : null,
            hasDone,
            hasDone ? changes.done : null
        ],
    );

    return result.rows[0] ?? null;
}

export async function deleteTask(ownerLogin, id) {
    const result = await pool.query(
        `
        DELETE FROM tasks
        WHERE owner_login = $1
            AND id = $2
        RETURNING id
        `,
        [ownerLogin, id]
    );

    return result.rowCount > 0;
}