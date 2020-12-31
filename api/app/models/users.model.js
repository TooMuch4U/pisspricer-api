const db = require('../../config/db');
const passwords = require('../services/passwords');
const tools = require('../services/tools');
const randtoken = require('rand-token');
const nodemailer = require('nodemailer');

let sendVerifyEmail = function (authToken, userId, email) {
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

        const verifyUrl = `https://www.pisspricer.co.nz/register/${userId}/verify/${authToken}`;

        const mailData = {
            from: process.env.EMAIL_ADDRESS,  // sender address
            to: email,   // list of receivers
            subject: 'Verify your account',
            text: '',
            html: `<br> Use the following link to verify your accounts email, ${verifyUrl}<br/>`,
        };

        transporter.sendMail(mailData, function (err, info) {
            if (err) {
                reject(err)
            }
            resolve()
        });
    })
};

exports.create = async function (user) {
    // Make sql
    // TODO ADD current date
    const createSQL = 'INSERT INTO USER (email, password, firstname, lastname, auth_token) VALUES (?, ?, ?, ?, ?)';
    const authToken = randtoken.generate(32);
    const userData = [user.email, await passwords.hash(user.password), user.firstname, user.lastname, authToken];

    // Start a transaction
    const conn = await db.getPool().getConnection();
    await conn.beginTransaction();
    try {
        const result = await conn.query(createSQL, userData);
        const userId = result.insertId;

        // Send verify email
        sendVerifyEmail(authToken, userId, user.email)
            .then(() => {
                return userId
            })
            .catch((err) => {
                throw err
            });

    } catch (err) {
        await conn.rollback();
        tools.logSqlError(err);
        throw err
    } finally {
        conn.release()
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
    const sql = "UPDATE user SET auth_token = ? WHERE user_id = ?";
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
