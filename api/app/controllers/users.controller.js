const Users = require('../models/users.model');
const passwords = require('../services/passwords');
const tools = require('../services/tools');


function isValidEmail(email) {
    // Note: doesn't actually guarantee a valid email
    return email.includes('@');
}

exports.create = async function (req, res) {
    res.status(501).send();
};
