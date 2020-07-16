const db = require('../../config/db');
const passwords = require('../services/passwords');
const tools = require('../services/tools');
const randtoken = require('rand-token');

exports.getAll = async function () {
    const sql = `SELECT store_id as brand_id,
                        name,
                        url 
                 FROM store`;
    try {
        const brands = await db.getPool().query(sql);
        return tools.toCamelCase(brands);
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err);
    }
};
exports.insert = async function (brand) {
    const sql = `INSERT INTO store (name, url)
                 VALUES (?, ?)`;
    try {
        let response = await db.getPool().query(sql, [brand.name, brand.url]);
        return response.insertId;
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err);
    }
};
exports.getById = async function (brandId) {
    const sql = `SELECT store_id as brand_id,
                        name,
                        url,
                        has_image
                 FROM store
                 WHERE store_id = ?`;
    try {
        const rows = await db.getPool().query(sql, [brandId]);
        return rows.length < 1 ? null : tools.toCamelCase(rows[0]);
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err);
    }
};
function generateUpdateSql(brand, brandId) {
    let sql = `UPDATE store SET `;
    let data = [];
    let stats = [];
    if (brand.name != null) {
        stats.push('name = ?');
        data.push(brand.name);
    }
    if (brand.url != null) {
        stats.push('url = ?');
        data.push(brand.url);
    }
    sql = sql + stats.join(', ') + ` WHERE store_id = ?`;
    data.push(brandId);
    return [sql, data]
}
exports.update = async function (brand, brandId) {
    const [sql, data] = generateUpdateSql(brand, brandId);
    try {
        let response = await db.getPool().query(sql, data);
        return response.length < 1 ? null : response.insertId;
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err);
    }
};
exports.deleteById = async function (brandId) {
    const sql = `DELETE FROM store
                 WHERE store_id = ?`;
    try {
        const response = await db.getPool().query(sql, [brandId]);
        if (response.affectedRows !== 1) {
            throw Error(`Should be exactly one petition that was deleted, but it was ${response.changedRows}.`);
        }
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err);
    }
};

exports.setImage = async function (storeId, hasImage) {
    const sql = `UPDATE store SET has_image = ? WHERE store_id = ?`;
    let result;
    try {
        result = await db.getPool().query(sql, [hasImage, storeId]);
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
    if (result.affectedRows !== 1) {
        throw Error(`Should be 1 row changed but there was actually: ${result.changedRows}`);
    }
    return;
};