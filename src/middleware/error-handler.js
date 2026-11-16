/**
 * @type {import('express').ErrorRequestHandler}
 */
export const errorHandler = (err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        res.status(400).json({
            error: 'Invalid JSON',
        });
        return;
    }

    next(err);
}