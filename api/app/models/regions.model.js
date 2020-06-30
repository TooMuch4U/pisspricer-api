const db = require('../../config/db');
const passwords = require('../services/passwords');
const tools = require('../services/tools');
const randtoken = require('rand-token');

exports.getById = async function (regionId) {
    const sql = `SELECT * 
                 FROM region
                 WHERE region_id = ?`;
    try {
        const region = await db.getPool().query(sql, [regionId]);
        return region.length < 1 ? null : tools.toCamelCase(region[0]);
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err);
    }
};
exports.insert = async function (region) {
    const sql = `INSERT INTO region (name, lattitude, longitude)
                 VALUES (?,?,?)`;
    try {
        const result = await db.getPool().query(sql, [region.name, region.lattitude, region.longitude]);
        return result.insertId;
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err);
    }
};
exports.getAll = async function () {
    const sql = `SELECT * FROM region`;
    try {
        const result = await db.getPool().query(sql);
        return tools.toCamelCase(result);
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err);
    }
};
function buildUpdateSql (data, regionId) {
    let sql = `UPDATE region SET `;
    let stats = [];
    let dataList = [];
    if (data.name != null) {
        stats.push(`name = ?`);
        dataList.push(data.name);
    }
    if (data.lattitude != null) {
        stats.push(`lattitude = ?`);
        dataList.push(data.lattitude);
    }
    if (data.longitude != null) {
        stats.push(`longitude = ?`);
        dataList.push(data.longitude);
    }
    sql = sql + stats.join(', ');
    sql = sql + ` WHERE region_id = ?`;
    dataList.push(regionId);
    return [sql, dataList];
};
exports.update = async function (region, regionId) {
    try {
        const [sql, data] = buildUpdateSql(region, regionId);
        const result = await db.getPool().query(sql, data);
        if (result.affectedRows !== 1) {
            throw Error(`Should be exactly one region that was changed, but it was ${result.changedRows}.`)
        }
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.delete = async function (regionId) {
    const sql = `DELETE FROM region WHERE region_id = ?`;
    try {
        const result = await db.getPool().query(sql, [regionId]);
        if (result.affectedRows !== 1) {
            throw Error(`Should be exactly one region that was deleted, but it was ${result.changedRows}.`);
        }
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err);
    }
};