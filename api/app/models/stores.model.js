const db = require('../../config/db');
const passwords = require('../services/passwords');
const tools = require('../services/tools');
const randtoken = require('rand-token');

exports.insert = async function (storeData) {
    const sql = `INSERT INTO store_location
                 (name, url, store_id, internal_id) VALUES (?, ?, ?, ?)`;
    try {
        let result = await db.getPool().query(sql, [storeData.name, storeData.url, storeData.brandId, storeData.internalId]);
        return result.insertId;
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err)
    }
};
exports.getAll = async function () {
    const sql = `SELECT SL.store_loc_id as store_id,
                        SL.url, 
                        SL.name,
                        SL.internal_id,
                        S.store_id as brand_id,
                        S.name as brand_name,
                        S.url as brand_url,
                        L.lattitude as loc_lat,
                        L.longitude as loc_lng,
                        L.address,
                        L.postcode,
                        R.lattitude as reg_lat,
                        R.longitude as reg_lng,
                        R.name as region_name
                 FROM store_location SL
                      JOIN store S ON SL.store_id = S.store_id
                      LEFT JOIN location L ON SL.store_loc_id = L.store_loc_id
                      LEFT JOIN region R ON L.region_id = R.region_id
                      `;
    try {
        const rows = await db.getPool().query(sql);
        return tools.toCamelCase(rows);
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err)
    }
};
exports.getOne = async function (storeId) {
    const sql = `SELECT SL.store_loc_id as store_id,
                        SL.url, 
                        SL.name,
                        Sl.internal_id,
                        S.store_id as brand_id,
                        S.name as brand_name,
                        S.url as brand_url,
                        L.lattitude as loc_lat,
                        L.longitude as loc_lng,
                        L.address,
                        L.postcode,
                        R.lattitude as reg_lat,
                        R.longitude as reg_lng,
                        R.name as region_name
                 FROM store_location SL
                      JOIN store S ON SL.store_id = S.store_id
                      LEFT JOIN location L ON SL.store_loc_id = L.store_loc_id
                      LEFT JOIN region R ON L.region_id = R.region_id
                 WHERE SL.store_loc_id = ?
                      `;
    try {
        const store = await db.getPool().query(sql, [storeId]);
        return store.length !== 1 ? null : tools.toCamelCase(store[0]);
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err);
    }
};
exports.update = async function (data, storeId) {
    const sql = `UPDATE store_location SET ? WHERE store_loc_id = ?`;
    try {
        let result = await db.getPool().query(sql, [data, storeId]);
        if (result.affectedRows !== 1) {
            throw Error(`Should be exactly one store that was changed, but it was ${result.changedRows}.`)
        }
    } catch (err) {
        tools.logSqlError(err);
        throw (err);
    }
};
exports.delete = async function (storeId) {
    const sql = `DELETE FROM store_location WHERE store_loc_id = ?`;
    try {
        const result = await db.getPool().query(sql, [storeId]);
        if (result.affectedRows != 1) {
            console.log(`Should be exactly one store that was deleted, but it was ${result.changedRows}.`);
            throw Error(`Should be exactly one store that was deleted, but it was ${result.changedRows}.`);
        }
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err);
    }
};