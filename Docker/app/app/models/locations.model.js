const db = require('../../config/db');
const passwords = require('../services/passwords');
const tools = require('../services/tools');
const randtoken = require('rand-token');

exports.insert = async function (location, storeId) {
    const sql = `INSERT INTO location (lattitude, longitude, address, postcode, region_id, store_loc_id)
                 VALUES (?,?,?,?,?,?)`;
    try {
        const data = [location.lattitude, location.longitude, location.address, location.postcode, location.regionId, storeId];
        const result = await db.getPool().query(sql, data);
        return result.insertId;
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err);
    }
};
exports.getByStoreId = async function (storeId) {
    const sql = `SELECT lattitude, longitude, store_loc_id as store_id, region_id, address, postcode
                 FROM location WHERE store_loc_id = ?`;
    try {
        const rows = await db.getPool().query(sql, [storeId]);
        return rows.size == 0 ? null : tools.toCamelCase(rows[0])
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err);
    }
};
exports.update = async function (data, storeId) {
    const sql = `UPDATE location SET ? WHERE store_loc_id = ?`;
    try {
        let result = await db.getPool().query(sql, [data, storeId]);
        if (result.affectedRows !== 1) {
            console.log(`Should be exactly one location that was changed, but it was ${result.changedRows}.`);
            throw Error(`Should be exactly one location that was changed, but it was ${result.changedRows}.`)
        }
    } catch(err) {
        tools.logSqlError(err);
        throw (err);
    }
};