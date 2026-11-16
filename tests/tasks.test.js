import 'dotenv/config';

import test from 'node:test';
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const BASE_URL = 'http://localhost:3000';
const TOKEN = process.env.API_TOKEN;

const headers = {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
};

test('GET /login/ returns Moodle login', async () => {
    const response = await fetch(`${BASE_URL}/login/`);

    assert.equal(response.status, 200);
    assert.match(
        response.headers.get('content-type'),
        /^text\/plain/
    );

    assert.equal(
        await response.text(),
        process.env.MOODLE_LOGIN,
    );
});

test('API requires Bearer token', async () => {
    const response = await fetch(`${BASE_URL}/api/author/`);

    assert.equal(response.status, 401);
    assert.deepEqual(
        await response.json(),
        { error: 'Unauthorized' }
    );
});

test('GET /api/author returns author information', async () => {
    const response = await fetch(`${BASE_URL}/api/author/`, {
        headers
    });

    assert.equal(response.status, 200);

    assert.deepEqual(await response.json(), {
        login: process.env.MOODLE_LOGIN,
        fullName: process.env.MOODLE_FULL_NAME
    });
});

test('Task lifecycle: create, read, update, delete', async () => {
    const runId = `test_${randomUUID().replace(/-/g, '')}`;

    const createResponse = await fetch(`${BASE_URL}/api/tasks/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            title: 'Auto Test',
            runId
        })
    });

    assert.equal(createResponse.status, 201);

    const task = await createResponse.json();

    assert.match(
        task.id,
        /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
    );
    assert.equal(task.ownerLogin, process.env.MOODLE_LOGIN);
    assert.equal(task.title, 'Auto Test');
    assert.equal(task.done, false);
    assert.equal(task.runId, runId);
    assert.equal(
        new Date(task.createdAt ?? '').toISOString(),
        task.createdAt
    )
    const taskUrl = `${BASE_URL}/api/tasks/${task.id}`;

    try {
        const getResponse = await fetch(taskUrl, { headers });

        assert.equal(getResponse.status, 200);
        assert.equal((await getResponse.json()).id, task.id);

        const listResponse = await fetch(
            `${BASE_URL}/api/tasks/?runId=${task.runId}`,
            { headers }
        );

        assert.equal(listResponse.status, 200);

        const tasks = await listResponse.json();

        assert.equal(task.runId, runId);
        assert.equal(tasks.length, 1);
        assert.equal(tasks[0].id, task.id);

        const patchResponse = await fetch(taskUrl, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                title: 'Task Updated',
                done: true,
            })
        });

        assert.equal(patchResponse.status, 200);

        const updated = await patchResponse.json();

        assert.equal(updated.title, 'Task Updated');
        assert.equal(updated.done, true);

        const deleteResponse = await fetch(taskUrl, {
            method: 'DELETE',
            headers
        });

        assert.equal(deleteResponse.status, 204);
        assert.equal(await deleteResponse.text(), '');

        const missingResponse = await fetch(taskUrl, {
            headers
        });

        assert.equal(missingResponse.status, 404);
    } finally {
        await fetch(taskUrl, {
            method: 'DELETE',
            headers
        });
    }
});

test('POST /api/tasks/ rejects invalid data', async () => {
    const invalidBodies = [
        {},
        { title: '', runId: 'test' },
        { title: '   ', runId: 'test' },
        { title: 'A'.repeat(201), runId: 'test' },
        { title: 'Valid title', runId: 'invalid!' },
        { title: 'Valid title', runId: '' },
        { title: 'Valid title', runId: 'a'.repeat(65) },
        { title: 123, runId: 'test' },
        { title: 'Valid title', runId: 'test', done: true },
        { title: 'Valid title', runId: 'test', ownerLogin: 'other' }
    ];

    for (const body of invalidBodies) {
        const response = await fetch(`${BASE_URL}/api/tasks/`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        assert.equal(
            response.status,
            400,
            `Unexpected status for ${JSON.stringify(body)}`
        );

        const result = await response.json();
        assert.equal(typeof result.error, 'string');
    }
});

test('GET /api/tasks/ validate query parameters', async () => {
    const invalidUrls = [
        '/api/tasks/',
        '/api/tasks/?runId=',
        '/api/tasks/?runId=invalid!',
        '/api/tasks/?runId=abc&runId=def'
    ];

    for (const path of invalidUrls) {
        const response = await fetch(`${BASE_URL}${path}`, {
            headers
        });

        assert.equal(response.status, 400, path);
    }

    const response = await fetch(
        `${BASE_URL}/api/tasks/?runId=nonexistent_test`,
        { headers }
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), []);
});

test('PATCH /api/tasks/:id/ rejects invalid input', async () => {
    const id = randomUUID();
    const url = `${BASE_URL}/api/tasks/${id}/`;

    const invalidBodies = [
        {},
        { done: 'true' },
        { done: 1 },
        { title: '' },
        { title: '   ' },
        { title: 'A'.repeat(201) },
        { runId: 'other' },
        { title: 'Valid', id: randomUUID() }
    ];

    for (const body of invalidBodies) {
        const response = await fetch(url, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(body),
        });

        assert.equal(
            response.status,
            400,
            `Unexpected status for ${JSON.stringify(body)}`
        );
    }
});

test('API rejects malformed JSON', async () => {
    const response = await fetch(`${BASE_URL}/api/tasks/`, {
        method: 'POST',
        headers,
        body: '{"title":'
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
        error: 'Invalid JSON'
    });
});

test('API returns 400 for invalid UUID and 404 for missing task', async () => {
    const invalidResponse = await fetch(
        `${BASE_URL}/api/tasks/not-a-uuid/`,
        { headers }
    );

    assert.equal(invalidResponse.status, 400);

    const id = randomUUID();
    const url = `${BASE_URL}/api/tasks/${id}/`;

    for (const method of ['GET', 'PATCH', 'DELETE']) {
        const options = {
            method,
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                ...(method === 'PATCH' ?
                    { 'Content-Type': 'application/json' } :
                        {}
                )
            },
        };

        if (method === 'PATCH') {
            options.body = JSON.stringify({ done: true });
        }

        const response = await fetch(url, options);

        assert.equal(
            response.status,
            404,
            `${method}: ${await response.text()}`
        );
    }
})

test('PATCH updates only provided fields', async () => {
    const createResponse = await fetch(`${BASE_URL}/api/tasks/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            title: 'Partial Task Updated',
            runId: 'partial_test',
        })
    });

    assert.equal(createResponse.status, 201);

    const task = await createResponse.json();
    const url = `${BASE_URL}/api/tasks/${task.id}/`;

    try {
        const response = await fetch(url, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ done: true }),
        });

        assert.equal(response.status, 200);

        const updated = await response.json();

        assert.equal(updated.title, task.title);
        assert.equal(updated.done, true);
        assert.equal(updated.runId, task.runId);

        const resetResponse = await fetch(url, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ done: false }),
        });

        assert.equal(resetResponse.status, 200);
        assert.equal((await resetResponse.json()).done, false);
    } finally {
        await fetch(url, {
            method: 'DELETE',
            headers
        });
    }
});

test('API rejects invalid Bearer token', async () => {
    const response = await fetch(`${BASE_URL}/api/tasks/?runId=test`, {
        headers: {
            Authorization: 'Bearer inten-invalid-token'
        }
    });

    assert.equal(response.status, 401);
    assert.equal((await response.json()).error,'Unauthorized');
});