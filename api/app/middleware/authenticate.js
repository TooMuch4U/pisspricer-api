const db = require('../../config/db');
const tools = require('../services/tools');

async function findUserIdByToken(token) {
    const findSQL = 'SELECT * FROM User WHERE auth_token = ?';

    if (!token) {
        // No token provided, hence can't fetch matching user
        return null;
    }

    try {
        const rows = await db.getPool().query(findSQL, token);
        if (rows.length < 1) {
            // No matching user for that token
            return null;
        } else {
            // Return matching user
            return tools.toCamelCase(rows[0]);
        }
    } catch (err) {
        tools.logSqlError(err);
        throw err;
    }
}

exports.loginRequired = async function (req, res, next) {
    const token = req.header('X-Authorization');

    try {
        const result = await findUserIdByToken(token);
        if (result === null) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
        } else {
            req.authenticatedUserId = result.userId.toString();
            next();
        }
    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
};

exports.setAuthenticatedUser = async function (req, res, next) {
    const token = req.header('X-Authorization');

    try {
        const result = await findUserIdByToken(token);
        if (result !== null) {
            req.authenticatedUserId = result.userId.toString();
            req.userPermission = result.permission;
        }
        else {
            req.userPermission = 0;
        }
        next();
    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
};

exports.adminRequired = async function (req, res, next) {
    const token = req.header('X-Authorization');

    try {
        const user = await findUserIdByToken(token);
        if (user === null) {
            res.status(401).send()
        }
        else if (user.permission < 5) {
            res.status(403).send()
        }
        else {
            req.authenticatedUserId = user.userId.toString();
            next();
        }
    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
};