const db = require('../../config/db');
const passwords = require('../services/passwords');
const tools = require('../services/tools');
const randtoken = require('rand-token');

exports.getAll = async function () {
    const sql = `SELECT category_id, name as category
                 FROM category`;
    try {
        const rows = await db.getPool().query(sql);
        return tools.toCamelCase(rows)
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.getByName = async function (name) {
    const sql = `SELECT category_id, name as category
                 FROM category
                 WHERE name = ?`;
    try {
        const rows = await db.getPool().query(sql, [name]);
        return rows.length < 1 ? null : tools.toCamelCase(rows[0])
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.insert = async function (catData) {
    const sql = `INSERT INTO category SET ?`;
    try {
        const result = await db.getPool().query(sql, [catData]);
        return result.insertId;
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.getById = async function (catId) {
    const sql = `SELECT category_id, name as category
                 FROM category
                 WHERE category_id = ?`;
    try {
        const rows = await db.getPool().query(sql, [catId]);
        return rows.length < 1 ? null : tools.toCamelCase(rows[0])
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.update = async function (catData, catId) {
    const sql = `UPDATE category SET ? WHERE category_id = ?`;
    try {
        const result = await db.getPool().query(sql, [catData, catId]);
        if (result.affectedRows !== 1) {
            throw Error(`Meant to be 1 changed rows, but there were: ${result.changedRows}`);
        }
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.delete = async function (catId) {
    const sql = `DELETE FROM category WHERE category_id = ?`;
    try {
        const result = await db.getPool().query(sql, [catId]);
        if (result.affectedRows != 1) {
            throw Error(`Should have been 1 category deleted, but instead ${result.changedRows}`);
        }
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};