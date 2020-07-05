const db = require('../../config/db');
const passwords = require('../services/passwords');
const tools = require('../services/tools');
const randtoken = require('rand-token');

exports.getAllByCatId = async function (catId) {
    const sql = `SELECT subcategory_id, name as subcategory
                 FROM subcategory
                 WHERE parent_id = ?`;
    try {
        const rows = await db.getPool().query(sql, [catId]);
        return tools.toCamelCase(rows);
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.getByName = async function (catId, subcatName) {
    const sql = `SELECT name as subcategory, subcategory_id, parent_id as category_id
                 FROM subcategory
                 WHERE parent_id = ? AND name = ?`;
    try {
        const rows = await db.getPool().query(sql, [catId, subcatName]);
        return rows.length < 1 ? null : tools.toCamelCase([0])
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.insert = async function (subcat) {
    const sql = `INSERT INTO subcategory SET ?`;
    try {
        const result = await db.getPool().query(sql, [subcat]);
        return result.insertId
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.getBySubId = async function (catId, subId) {
    const sql = `SELECT subcategory_id, name as subcategory
                 FROM subcategory
                 WHERE subcategory_id = ? AND parent_id = ?`;
    try {
        const rows = await db.getPool().query(sql, [subId, catId]);
        return rows.length < 1 ? null : tools.toCamelCase(rows[0])
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.delete = async function (catId, subId) {
    const sql = `DELETE FROM subcategory WHERE parent_id = ? AND subcategory_id = ?`;
    try {
        const result = await db.getPool().query(sql, [catId, subId]);
        if (result.affectedRows != 1) {
            throw Error(`Should have been 1 subcategory deleted, but instead ${result.changedRows}`);
        }
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err)
    }
};