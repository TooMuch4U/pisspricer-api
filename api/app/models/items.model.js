const db = require('../../config/db');
const passwords = require('../services/passwords');
const tools = require('../services/tools');
const randtoken = require('rand-token');

exports.insert = async function (itemData, barcodeData) {
    const conn = await db.getPool().getConnection();
    await conn.beginTransaction();
    const sqlItem = `INSERT INTO item SET ?`;
    const sqlBarcode = `INSERT INTO item_barcode SET ?, ?;`;
    try {
        let result1 = await conn.query(sqlItem, [itemData]);
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
exports.getAll = async function () {
    const sql = `SELECT I.*, 
                        C.name as category,
                        S.name as subcategory
                 FROM item I 
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