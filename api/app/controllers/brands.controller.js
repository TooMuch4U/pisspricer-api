const Brands = require('../models/brands.model');
const passwords = require('../services/passwords');
const tools = require('../services/tools');

exports.getAll = async function (req, res) {
    try {
        const data = await Brands.getAll();
        res.status(200).json(data)
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send();
    }
};
exports.insert = async function (req, res) {
    try {
        let message = "";
        if (req.body.name == null || req.body.name.length < 1) {
            message = "A name must be supplied";
        }
        if (req.body.url == null || req.body.url.length < 1) {
            message = "A url must be supplied";
        }

        if (message !== "") {
            res.statusMessage = message;
            res.status(400).send();
        }
        else {
            const brandId = await Brands.insert(req.body);
            res.status(201).json({brandId});
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};

