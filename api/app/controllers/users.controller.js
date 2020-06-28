const Users = require('../models/users.model');
const passwords = require('../services/passwords');
const tools = require('../services/tools');


function isValidEmail(email) {
    // Note: doesn't actually guarantee a valid email
    return email.includes('@');
}

exports.create = async function (req, res) {

    let message = "";
    if (!isValidEmail(req.body.email)) {
        message = "Email is not valid";
    }
    if (req.body.firstname == null || req.body.firstname.length == 0) {
        message = "Firstname must be atleast 1 character";
    }
    if (req.body.lastname == null || req.body.lastname.length == 0) {
        message = "Lastname must be atleast 1 character";
    }
    if (req.body.password == null || req.body.password.length == 0) {
        message = "Password must be atleast 1 character"
    }

    if (message == "") {
        try {
            let userId = await Users.create(req.body);
            res.statusMessage = 'Created';
            res.status(201)
                .json({userId})
        }
        catch (err) {
            if (err.sqlMessage && err.sqlMessage.includes('Duplicate entry')) {
                res.statusMessage = 'Bad Request: Email address already in use';
                res.status(400).send()
            }
            else {
                console.log(err.message);
                res.status(500).send()
            }
        }
    }
    else {
        res.statusMessage = "Bad Request: " + message;
        res.status(400)
            .send()
    }
};
exports.login = async function (req, res) {
    let message = '';
    if (!isValidEmail(req.body.email)) {
        message = 'Email is not valid';
    }
    if (req.body.password == null || req.body.password.length == 0) {
        message = 'Password must have at least 1 character'
    }

    if (message !== '') {
        res.statusMessage = message;
        res.status(400).send();
    }
    else {
        try {
            let foundUser = await Users.userByEmail(req.body.email);
            if (foundUser === null || !await passwords.compare(req.body.password, foundUser.password)) {
                res.statusMessage = 'invalid email/password supplied';
                res.status(400).send();
            }
            else {
                const user = await Users.login(foundUser.userId);
                res.status(200).json(user);
            }
        }
        catch (err) {
            console.log(err);
            res.status(500).send();
        }

    }

};
exports.logout = async function (req, res) {
    try {
        await Users.logout(req.authenticatedUserId);
        res.status(200).send()
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
