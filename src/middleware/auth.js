const expectedToken = process.env.API_TOKEN;

export function requireAuth(req, res, next) {
    if (!expectedToken) {
        return res.status(503).json({
            error: "Server authentication is not configured"
        })
    }

    const auth = req.get('Authorization');

    if (auth !== `Bearer ${expectedToken}`) {
        return res.status(401).json({
            error: "Unauthorized",
        });
    }

    next();
}