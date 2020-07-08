const db = require('../../config/db');
const passwords = require('../services/passwords');
const tools = require('../services/tools');
const randtoken = require('rand-token');

exports.getAll = async function (sku) {
    const sql = `SELECT P.store_loc_id as store_id,
                        P.url,
                        S.name as store_name.,
                        S.store_id as brand_id,
                        B.name as brand_name,
                        P.price,
                        P.sale_price,
                        P.stock,
                        P.last_check as date_checked
                        
                  FROM            location_stocks_item P
                        LEFT JOIN store_location S ON P.store_loc_id = S.store_loc_id
                        LEFT JOIN store B ON S.store_id = B.store_id
                  
                  WHERE P.sku = ?`;
    try {
        const rows = await db.getPool().query(sql, [sku]);
        return tools.toCamelCase(rows)
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.getAllAdmin = async function (sku) {
    const sql = `SELECT P.store_loc_id as store_id,
                        P.url,
                        S.name as store_name,
                        S.store_id as brand_id,
                        B.name as brand_name,
                        P.price,
                        P.sale_price,
                        P.stock,
                        P.last_check as date_checked,
                        P.internal_sku
                        
                  FROM            location_stocks_item P
                        LEFT JOIN store_location S ON P.store_loc_id = S.store_loc_id
                        LEFT JOIN store B ON S.store_id = B.store_id
                  
                  WHERE P.sku = ?`;
    try {
        const rows = await db.getPool().query(sql, [sku]);
        return tools.toCamelCase(rows)
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.getOne = async function (sku, storeId) {
    const sql = `SELECT P.store_loc_id as store_id,
                        P.url,
                        S.name as store_name,
                        S.store_id as brand_id,
                        B.name as brand_name,
                        P.price,
                        P.sale_price,
                        P.stock,
                        P.last_check as date_checked,
                        P.internal_sku
                        
                  FROM            location_stocks_item P
                        LEFT JOIN store_location S ON P.store_loc_id = S.store_loc_id
                        LEFT JOIN store B ON S.store_id = B.store_id
                  
                  WHERE P.sku = ? AND P.store_loc_id = ?`;
    try {
        const rows = await db.getPool().query(sql, [sku, storeId]);
        return rows.length < 1 ? null : tools.toCamelCase(rows[0])
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.insert = async function (sku, storeId, priceData) {
    const sql = `INSERT INTO location_stocks_item SET 
                            sku = ?, 
                            store_loc_id = ?, 
                            internal_sku = ?,
                            last_check = ?,
                            price = ?,
                            sale_price = ?,
                            stock = ?,
                            url = ?`;
    let result;
    try {
        const data = [
            sku,
            storeId,
            priceData.internalSku,
            new Date(),
            priceData.price,
            priceData.salePrice,
            priceData.stock,
            priceData.url
        ];
        result = await db.getPool().query(sql, data);
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
    if (result.affectedRows != 1) {
        throw Error(`There should have been 1 rows inserted, but there was actually: ${result.changedRows}`);
    }
};
exports.setPrice = async function (sku, storeId, priceData) {
    const sql = `UPDATE location_stocks_item SET  
                            internal_sku = ?,
                            last_check = ?,
                            price = ?,
                            sale_price = ?,
                            stock = ?,
                            url = ?
                 WHERE  sku = ? AND 
                        store_loc_id = ?`;
    let result;
    try {
        const data = [
            priceData.internalSku,
            new Date(),
            priceData.price,
            priceData.salePrice,
            priceData.stock,
            priceData.url,
            sku,
            storeId
        ];
        result = await db.getPool().query(sql, data);
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
    if (result.affectedRows != 1) {
        throw Error(`There should have been 1 row updated, but there was actually: ${result.changedRows}`);
    }

};
exports.delete = async function (sku, storeId) {
    const sql = `DELETE FROM location_stocks_item WHERE store_loc_id = ? AND sku = ?`;
    let result;
    try {
        result = await db.getPool().query(sql, [storeId, sku]);
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err);
    }
    if (result.affectedRows != 1) {
        throw Error(`Should be one row deleted, but there was actually: ${result.changedRows}`);
    }
};