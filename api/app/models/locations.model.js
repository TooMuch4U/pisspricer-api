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