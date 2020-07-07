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