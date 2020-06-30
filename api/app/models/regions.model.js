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