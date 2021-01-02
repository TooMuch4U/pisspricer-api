const db = require('../../config/db');
const passwords = require('../services/passwords');
const tools = require('../services/tools');
const randtoken = require('rand-token');
const nodemailer = require('nodemailer');

let sendVerifyEmail = function (authToken, userId, email, referUrl='https://pisspricer.co.nz') {
    return new Promise((resolve,reject)=> {
        const transporter = nodemailer.createTransport({
            port: 465,               // true for 465, false for other ports
            host: process.env.EMAIL_HOST,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
            secure: true,
        });

        const verifyUrl = `${referUrl}/register/${userId}/verify/${authToken}`;

        const mailData = {
            from: process.env.EMAIL_ADDRESS,  // sender address
            to: email,   // list of receivers
            subject: 'Verify your account',
            text: '',
            html: `<br> Click <a href="${verifyUrl}">here</a> to verify your account. <br>
                    Or use the following url, ${verifyUrl}<br/>`,
        };

        transporter.sendMail(mailData, function (err, info) {
            if (err) {
                reject(err)
            }
            resolve()
        });
    })
};
exports.sendVerifyEmail = sendVerifyEmail;

exports.create = async function (user, referUrl='https://pisspricer.co.nz') {
    // Make sql
    const createSQL = `INSERT INTO USER (email, password, firstname, lastname, auth_token, login_date) 
                        VALUES (?, ?, ?, ?, ?, ?)`;
    const authToken = randtoken.generate(32);
    const userData = [user.email, await passwords.hash(user.password),
        user.firstname, user.lastname, authToken, new Date()];

    // Start a transaction
    const conn = await db.getPool().getConnection();
    await conn.beginTransaction();
    try {
        const result = await conn.query(createSQL, userData);
        const userId = result.insertId;

        // Send verify email
        await sendVerifyEmail(authToken, userId, user.email, referUrl);
        await conn.commit();
        return userId;

    } catch (err) {
        await conn.rollback();
        tools.logSqlError(err);
        throw err
    } finally {
        await conn.release()
    }
};
exports.userByEmail = async function (email) {
    const sql = "SELECT * FROM user WHERE email = ?";
    try {
        let response = await db.getPool().query(sql, [email]);
        return response.length < 1 ? null : tools.toCamelCase(response[0])
    }
    catch (err) {
        tools.logSqlError(err);
        return null;
    }
};
exports.login = async function (userId) {
    const sql = "UPDATE user SET auth_token = ?, login_count = 0 WHERE user_id = ?";
    try {
        // TODO Test for no params
        const authToken = randtoken.generate(32);
        const rows = await db.getPool().query(sql, [authToken, userId]);
        return {userId, authToken};
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err)
    }
};
exports.logout = async function (userId) {
    const sql = "UPDATE user SET auth_token = null WHERE user_id = ?";
    try {
        await db.getPool().query(sql, [userId]);
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err);
    }
};
function buildSearchSql(query) {
    const sql = `   SELECT firstname, lastname, U.user_id, permission, login_date, 
                            IFNULL(stores, 0) as store_count, 
                            IFNULL(locations, 0) as location_count
                    FROM            user U
                        LEFT JOIN   (SELECT user_id, count(store_id) as stores
                                     FROM user_access_store
                                     GROUP BY user_id) S ON U.user_id = S.user_id
                        LEFT JOIN   (SELECT user_id, count(store_loc_id) as locations
                                     FROM user_access_location
                                     GROUP BY user_id) L ON S.user_id = L.user_id
                                     `;
    return sql
}
exports.search = async function (query) {
    const sql = buildSearchSql(query);
    try {
        let rows = await db.getPool().query(sql);
        return tools.toCamelCase(rows);
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err);
    }
};

exports.getOne = async function (userId) {
    const sql = `SELECT firstname, lastname, email, login_date as loginDate, 
    is_verified as isVerified, user_id as userId, email, permission
    FROM user WHERE user_id = ?`;
    try {
        const rows = await db.getPool().query(sql, userId);
        if (rows.length < 1) {
            return null
        }
        return rows[0]
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err);
    }
};

exports.setVerified = async function (userId) {
    const sql = `UPDATE user SET is_verified = 1, auth_token = null WHERE user_id = ?`;
    try {
        const response = await db.getPool().query(sql, userId);
        if (response.affectedRows !== 1) {
            throw( new Error(`Should have been 1 rows changed, but there was ${response.affectedRows} changed.`))
        }
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err);
    }
};

exports.getAllUserInfo = async function (userId) {
    const sql = `SELECT * FROM user WHERE user_id = ?`;
    try {
        const rows = await db.getPool().query(sql, userId);
        if (rows.length < 1) {
            return null
        }
        return tools.toCamelCase(rows[0])
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err);
    }
};

exports.resendEmailCode = async function (userInfo, referUrl='https://pisspricer.co.nz') {
    const sql = `UPDATE user SET login_date = ?, login_count = ? WHERE user_id = ?`;
    const data = [new Date(), userInfo.loginCount + 1, userInfo.userId];
    // Start a transaction
    const conn = await db.getPool().getConnection();
    await conn.beginTransaction();
    try {
        let response = await conn.query(sql, data);
        if (response.affectedRows !== 1) {
            throw( new Error(`Should have been 1 rows changed, but there was ${response.affectedRows} changed.`))
        }
        await sendVerifyEmail(userInfo.authToken, userInfo.userId, userInfo.email, referUrl);
        await conn.commit();
    } catch (err) {
        await conn.rollback();
        tools.logSqlError(err);
        throw err
    } finally {
        await conn.release()
    }
};

exports.setLoginCount = async function (userId, loginCount) {
    const sql = `UPDATE user SET login_count = ? WHERE user_id = ?`;
    try {
        let response = await db.getPool().query(sql, [loginCount, userId]);
        if (response.affectedRows !== 1) {
            throw( new Error(`Should have been 1 rows changed, but there was ${response.affectedRows} changed.`))
        }
    }
    catch (err) {
        tools.logSqlError(err);
        throw(err);
    }
};
