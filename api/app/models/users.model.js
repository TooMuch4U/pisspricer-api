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
