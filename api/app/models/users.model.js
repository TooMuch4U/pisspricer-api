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
function buildSearchSql(query) {
    const sql = `   SELECT firstname, lastname, U.user_id, permission, login_date, 
                            IFNULL(stores, 0) as store_count, 
                            IFNULL(locations, 0) as location_count
                    FROM            user U
                        LEFT JOIN   (SELECT user_id, count(store_id) as stores
                                     FROM user_access_store
                                     GROUP BY user_id) S ON U.user_id = S.user_id
                        LEFT JOIN   (SELECT user_id, count(store_loc_id) as locations
                                     FROM user_access_location
                                     GROUP BY user_id) L ON S.user_id = L.user_id
                                     `;
    return sql
}
exports.search = async function (query) {
    const sql = buildSearchSql(query);
    try {
        let rows = await db.getPool().query(sql);
        return tools.toCamelCase(rows);
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err);
    }
};
