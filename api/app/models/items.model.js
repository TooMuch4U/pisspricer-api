const db = require('../../config/db');
const passwords = require('../services/passwords');
const tools = require('../services/tools');
const randtoken = require('rand-token');

exports.insert = async function (itemData, barcodeData, slugName) {
    const conn = await db.getPool().getConnection();
    await conn.beginTransaction();
    const sqlItem = `INSERT INTO item SET ?, slug = slugify(?)`;
    const sqlBarcode = `INSERT INTO item_barcode SET ?, ?;`;
    try {
        let result1 = await conn.query(sqlItem, [itemData, slugName]);
        let sku = result1.insertId;
        if (barcodeData.ean != null) {
            let result2 = await conn.query(sqlBarcode, [{sku}, barcodeData]);
        }
        await conn.commit();
        return sku;
    }
    catch (err) {
        await conn.rollback();
        tools.logSqlError(err);
        throw (err)
    }
    finally {
        conn.release();
    }
};
function buildSelectSql (query) {

    // --- SELECT ---
    let data = [];
    let select = `SELECT MIN(IF(P.price > P.sale_price, P.sale_price, P.price)) as best_price,
                      C.name as category,
                      SC.name as subcategory,
                      I.*,
                      count(*) as store_count\n`;

    // --- FROM ---
    let from = `FROM  location_stocks_item P
                      LEFT JOIN item I ON P.sku = I.sku
                      LEFT JOIN category C ON I.category_id = C.category_id
                      LEFT JOIN subcategory SC ON I.subcategory_id = SC.subcategory_id\n`;

    // --- WHERE ---
    let whereArray = [];
    let where = ``;
    // Barcode search
    if (typeof query.ean !== 'undefined') {
        whereArray.push(`I.sku = (SELECT sku FROM item_barcode WHERE ean = ?)`);
        data.push(query.ean);
    }
    // Category filter
    if (typeof query.catId !== 'undefined') {
        let catArray = [];
        for (let i = 0; i < query.catId.length; i++) {
            catArray.push(`I.category_id = ?`);
            data.push(query.catId[i]);
        }
        whereArray.push(`(` + catArray.join(` OR `) + `)`)
    }
    // Distance filter
    if (typeof query.lat !== 'undefined') {
        whereArray.push(`P.store_loc_id in (SELECT store_loc_id 
                                            FROM location WHERE ST_Distance_Sphere(point(longitude, lattitude), point(?, ?))/1000 <= ? )`);
        data.push(query.lng);
        data.push(query.lat);
        data.push(query.r);
    }
    // Search filter
    if (typeof query.search !== 'undefined') {
        whereArray.push(`(I.name like ? OR LOWER(category) like LOWER(?)`);
        data.push(`%${query.search}%`);
        data.push(`%${query.search}%`);

    }
    // Region
    if (typeof query.regionId !== 'undefined') {
        whereArray.push(`P.store_loc_id in (SELECT store_loc_id FROM location WHERE region_id = ?)`);
        data.push(query.regionId);
    }
    // Compile where
    if (whereArray.length !== 0) {
        where = `WHERE ` + whereArray.join(` AND `);
        where += `\n`;
    }

    // --- GROUP BY ---
    let group = `GROUP BY I.sku\n`;

    // -- ORDER BY ---
    let order = `ORDER BY `;
    switch (query.order) {
        case 'price-asc':
            order += `best_price ASC`;
            break;
        case 'price-desc':
            order += `best_price DESC`;
            break;
        case 'alpha-asc':
            order += `I.name ASC`;
            break;
        case 'alpha-desc':
            order += `I.name DESC`;
            break;
        case 'best-match':
        default:
            order += `CASE WHEN I.name LIKE ? THEN 2
                           WHEN I.name LIKE ? THEN 3
                           ELSE 1
                      END`;
            data.push(`${query.search}%`);
            data.push(`%${query.search}`);
    }
    order += `\n`;

    // --- LIMIT & OFFSET ---
    let limit = ``;
    if (typeof query.count !== 'undefined') {
        limit += `LIMIT ?\n`;
        data.push(parseInt(query.count));
    }
    if (typeof query.index !== 'undefined') {
        if (typeof query.count === 'undefined') {
            limit += `LIMIT ?\n`;
            data.push(1000000000);
        }
        limit += `OFFSET ?\n`;
        data.push(parseInt(query.index));
    }

    let sql = select + from + where + group + order + limit;

    return {sql, data, where, from, group, order}
};
exports.getAll = async function (queryData, isAdmin) {

    try {
        const query = buildSelectSql(queryData, isAdmin);
        const countSql = `SELECT count(distinct P.sku) as totalCount\n` + query.from + query.where;
        const countRows = await db.getPool().query(countSql, query.data);
        const totalCount = countRows.length < 1 ? null : countRows[0].totalCount;
        if (totalCount == null) {
            throw Error(`totalCount should have at least one row`);
        }
        const rows = await db.getPool().query(query.sql, query.data);
        return {
            totalCount,
            "count": rows.length,
            "items": tools.toCamelCase(rows)
        }
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.getAllAdmin = async function () {
    const sql = `SELECT I.*, 
                        count(B.ean) as barcodeCount,
                        C.name as category,
                        S.name as subcategory
                 FROM item I 
                      LEFT JOIN item_barcode B ON I.sku = B.sku
                      LEFT JOIN category C ON I.category_id = C.category_id
                      LEFT JOIN subcategory S ON I.subcategory_id = S.subcategory_id
                 GROUP BY I.sku`;

    try {
        const rows = await db.getPool().query(sql);
        return tools.toCamelCase(rows)
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.getBySku = async function (sku) {
    const sqlItem = `SELECT I.*, 
                            C.name as category,
                            S.name as subcategory
                     FROM item I 
                          LEFT JOIN category C ON I.category_id = C.category_id
                          LEFT JOIN subcategory S ON I.subcategory_id = S.subcategory_id
                     WHERE sku = ?`;
    const sqlBarcodes = `SELECT ean FROM item_barcode WHERE sku = ?`;
    try {
        const items = await db.getPool().query(sqlItem, [sku]);
        if (items.length < 1) {
            return null;
        }
        else {
            const barcodes = await db.getPool().query(sqlBarcodes, [sku]);
            let item = items[0];
            item.barcodes = [];
            for (let i = 0; i < barcodes.length; i++) {
                item.barcodes.push(Object.values(barcodes[i])[0]);
            }

            return tools.toCamelCase(item)
        }
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.delete = async function (sku) {
    const sql = `DELETE FROM item WHERE sku = ?`;
    try {
        const result = await db.getPool().query(sql, [sku]);
        if (result.affectedRows !== 1) {
            throw Error(`Deleting item failed. 1 row was meant to be changed when there was actually ${result.changedRows}`);
        }
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};
exports.update = async function (itemChanges, sku) {
    const sql = `UPDATE item SET ? WHERE sku = ?`;
    try {
        const result = await db.getPool().query(sql, [tools.toUnderscoreCase(itemChanges), sku]);
        if (result.affectedRows != 1) {
            throw Error(`Changed rows should be 1, it was actually ${result.changedRows}`);
        }
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err);
    }
};

exports.getAllBarcodes = async function (sku) {
    const sql = `SELECT ean FROM item_barcode WHERE sku = ?`;
    try {
        const rows = await db.getPool().query(sql, [sku]);
        return rows
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err);
    }
};
exports.getOneBarcode = async function (sku, ean) {
    const sql = `SELECT ean FROM item_barcode WHERE sku = ? AND ean = ?`;
    try {
        const rows = await db.getPool().query(sql, [sku, ean.toString()]);
        return rows.length < 1 ? null : rows[0]
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err);
    }
};
exports.deleteBarcode = async function (sku, ean) {
    const sql = `DELETE FROM item_barcode WHERE sku = ? AND ean = ?`;
    try {
        const results = await db.getPool().query(sql, [sku, ean.toString()]);
        if (results.affectedRows != 1) {
            console.log(`Should be exactly 1 row changed, but there was actually: ${results.changedRows}`);
            throw Error(`Should be exactly 1 row changed, but there was actually: ${results.changedRows}`);
        }
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err);
    }
};
exports.insertBarcode = async function (sku, ean) {
    const sql = `INSERT INTO item_barcode SET sku = ?, ean = ?`;
    let result;
    try {
        result = await db.getPool().query(sql, [sku, ean.toString()]);
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err);
    }
    if (result.affectedRows != 1) {
        throw Error(`Should be 1 row inserted, there was actually: ${result.changedRows}`);
    }
};

exports.setImage = async function (sku, hasImage) {
    const sql = `UPDATE item SET has_image = ? WHERE sku = ?`;
    let result;
    try {
        result = await db.getPool().query(sql, [hasImage, sku]);
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

exports.allBarcodes = async function () {
    const sql = `SELECT * 
                 FROM item_barcode`;
    try {
        const rows = await db.getPool().query(sql);
        return tools.toCamelCase(rows)
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err);
    }
};

exports.getAllBasic = async function() {
    const sql = `SELECT * FROM item`;
    try {
        const rows = await db.getPool().query(sql);
        return tools.toCamelCase(rows)
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
};

exports.getInternalIds = async function(brandId) {
    const sql = `SELECT internal_sku as internalSku, sku 
                          FROM location_stocks_item I
                            LEFT JOIN store_location S ON I.store_loc_id = S.store_loc_id
                          WHERE store_id = ?
                          ORDER BY internal_sku`;
    let rows;
    try {
        rows = await db.getPool().query(sql, [brandId]);
    }
    catch (err) {
        tools.logSqlError(err);
        throw (err)
    }
    let ids = {};
    for (let i = 0; rows.length > i; i++) {
        let row = rows[i];
        let id = row.internalSku;
        if (typeof ids[id] === 'undefined') {
            ids[id] = [];
        }
        if (!ids[id].includes(row.sku)) {
            ids[id].push(row.sku);
        }
    }
    return ids;
};
