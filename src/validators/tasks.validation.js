export function validateCreateTask(body) {
    if (
        !body ||
        typeof body !== 'object' ||
        Array.isArray(body)
    ) {
        return 'Request body must be an object';
    }

    const keys = Object.keys(body);

    if (
        keys.length !== 2 ||
        !keys.includes('title') ||
        !keys.includes('runId')
    ) {
        return 'Only title and runId are allowed';
    }

    if (
        typeof body.title !== 'string' ||
        body.title.trim().length < 1 ||
        body.title.trim().length > 200
    ) {
        return 'Invalid title';
    }

    if (
        typeof body.runId !== 'string' ||
        !/^[A-Za-z0-9_-]{1,64}$/.test(body.runId)
    ) {
        return 'Invalid runId';
    }

    return null;
}

export function validateRunId(runId) {
    return typeof runId === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(runId);
}

export function validateUUID(id) {
    return typeof id === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function validateUpdateTask(body) {
    if (
        !body ||
        typeof body !== 'object' ||
        Array.isArray(body)
    ) {
        return 'Request body must be an object';
    }

    const keys = Object.keys(body);

    if (
        keys.length === 0 ||
        keys.some(key => !['title', 'done'].includes(key))
    ) {
        return 'Only title and done are allowed';
    }

    if ('title' in body) {
        if (
            typeof body.title !== 'string' ||
            body.title.trim().length < 1 ||
            body.title.trim().length > 200
        ) {
            return 'Invalid title';
        }
    }

    if ('done' in body && typeof body.done !== 'boolean') {
        return 'Invalid done';
    }

    return null;
}