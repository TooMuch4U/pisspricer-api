const db = require('../../config/db');
const passwords = require('../services/passwords');
const tools = require('../services/tools');
const randtoken = require('rand-token');

function generateSelectSql(sku, queryData, isAdmin) {

    // SELECT
    let select = `SELECT P.store_loc_id as store_id,
                        P.url,
                        S.name as store_name,
                        S.store_id as brand_id,
                        B.name as brand_name,
                        P.price,
                        P.sale_price,
                        P.stock,
                        P.last_check as date_checked,
                        IF(P.price > P.sale_price, P.sale_price, P.price) AS best_price, `;
    let data = [];

    // Set distance if possible
    if (queryData.lng == null || queryData.lat == null) {
        select = select + ` 0 as distance`;
    }
    else {
        select = select + `ST_Distance_Sphere(
                        point(L.longitude, L.lattitude),
                        point(?, ?)
                    )/1000 as distance`;
        data = [
            queryData.lng,
            queryData.lat
        ];
    }
    // Admin data
    if (isAdmin) {
        select = select + `, P.internal_sku`
    }

   // FROM
    let from =  `FROM location_stocks_item P
                        LEFT JOIN store_location S ON P.store_loc_id = S.store_loc_id
                        LEFT JOIN store B ON S.store_id = B.store_id
                        LEFT JOIN location L ON S.store_loc_id = L.store_loc_id`;

    // WHERE
    data.push(sku);
    let where = `WHERE P.sku = ?`;

    // Radius
    let having = ``;
    if (queryData.r != null) {
        having = ` HAVING distance <= ?`;
        data.push(queryData.r);
    }

    // Order
    let order = `ORDER BY `;
    if (queryData.order == "dist-asc") {
        order = order + `distance ASC, best_price ASC`;
    }
    else if (queryData.order == "dist-desc") {
        order = order + `distance DESC, best_price ASC`;
    }
    else if (queryData.order == "price-desc") {
        order = order + `best_price DESC, distance ASC`;
    }
    else {
        order = order + `best_price ASC, distance ASC`;
    }

    // LIMIT and OFFSET
    let limit = ``;
    if (typeof queryData.count !== 'undefined') {
        limit = limit + `LIMIT ?`;
        data.push(parseInt(queryData.count));
    }
    if (typeof queryData.index !== 'undefined') {
        if (typeof queryData.count === 'undefined') {
            limit += `LIMIT ?\n`;
            data.push(1000000000);
        }
        limit = limit + ` OFFSET ?\n`;
        data.push(parseInt(queryData.index));
    }

    let sql = `${select} \n ${from} \n ${where} \n ${having} \n ${order} \n ${limit}`;
    return {sql: sql, data: data, select, from, where, having, order, limit};
};
exports.getAll = async function (sku, queryData, isAdmin) {
    try {
        const query = generateSelectSql(sku, queryData, isAdmin);
        const rows = await db.getPool().query(query.sql, query.data);
        return tools.toCamelCase(rows)
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.getPriceCount = async function (sku, queryData, isAdmin) {
    try {
        delete queryData.count;
        delete queryData.index;
        const query = generateSelectSql(sku, queryData, isAdmin);
        let select = `SELECT `;
        if (queryData.lng == null || queryData.lat == null) {
            select = select + ` 0 as distance`;
        }
        else {
            select = select + `ST_Distance_Sphere(
                        point(L.longitude, L.lattitude),
                        point(?, ?)
                    )/1000 as distance`;
        }
        const sql = `${select} \n ${query.from} \n ${query.where} \n ${query.having}`;
        const rows = await db.getPool().query(sql, query.data);
        return rows.length
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

exports.insertOrSetPrice = async function (sku, storeId, priceData) {
    const conn = await db.getPool().getConnection();
    await conn.beginTransaction();
    const sqlInsert = `INSERT INTO location_stocks_item SET 
                            sku = ?, 
                            store_loc_id = ?, 
                            internal_sku = ?,
                            last_check = ?,
                            price = ?,
                            sale_price = ?,
                            stock = ?,
                            url = ?`;
    const sqlUpdate = `UPDATE location_stocks_item SET 
                            internal_sku = ?,
                            last_check = ?,
                            price = ?,
                            sale_price = ?,
                            stock = ?,
                            url = ?
                       WHERE  sku = ? AND 
                            store_loc_id = ?`;
    const sqlGetOne = `SELECT P.store_loc_id as store_id,
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
    let isNew = false;
    try {

        let itemPriceList = await conn.query(sqlGetOne, [sku, storeId]);
        let response;
        if (itemPriceList.length === 0) {
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
            isNew = true;
            response = await conn.query(sqlInsert, data);
        } else {
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
            response = await conn.query(sqlUpdate, data);
        }

        if (response.affectedRows !== 1) {
            throw new CustomError(`Rows changed should be 1, but was actually ${response.affectedRows}.`);
        }

        await conn.commit();
        return isNew;
    }
    catch (err) {
        await conn.rollback();
        if (!( err instanceof CustomError)) {
            tools.logSqlError(err);
        }
        throw (err)
    }
    finally {
        conn.release();
    }
};

class CustomError extends Error {
    constructor(...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params);
    }
}

exports.getSkuSlug = async function (slug) {
    const sql = `SELECT sku FROM item WHERE slug = ?`;
    try {
        const rows = await db.getPool().query(sql, [slug]);
        return rows.length < 1 ? null : rows[0].sku
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
