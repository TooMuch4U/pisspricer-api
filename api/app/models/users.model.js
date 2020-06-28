const db = require('../../config/db');
const passwords = require('../services/passwords');
const tools = require('../services/tools');
const randtoken = require('rand-token');

exports.create = async function (user) {
    const createSQL = 'INSERT INTO USER (email, password, firstname, lastname) VALUES (?, ?, ?, ?)';

    const userData = [user.email, await passwords.hash(user.password), user.firstname, user.lastname];

    try {
        const result = await db.getPool().query(createSQL, userData);
        return result.insertId;
    } catch (err) {
        tools.logSqlError(err);
        throw err;
    }
};
exports.userByEmail = async function (email) {
    const sql = "SELECT * FROM user WHERE email = ?";
    try {
        let response = await db.getPool().query(sql, [email]);
        return response.length < 1 ? null : tools.toCamelCase(response[0])
    }
    catch (err) {
        tools.logSqlError(err);
        return null;
    }
};
exports.login = async function (userId) {
    const sql = "UPDATE user SET auth_token = ? WHERE user_id = ?";
    try {
        const authToken = randtoken.generate(32);
        const rows = await db.getPool().query(sql, [authToken, userId]);
        console.log(userId);
        return {userId, authToken};
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err)
    }
};
exports.logout = async function (userId) {
    const sql = "UPDATE user SET auth_token = null WHERE user_id = ?";
    try {
        await db.getPool().query(sql, [userId]);
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err);
    }
};