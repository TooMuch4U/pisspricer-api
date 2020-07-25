const Stores = require('../models/stores.model');
const Brands = require('../models/brands.model');
const Regions = require('../models/regions.model');
const Locations = require('../models/locations.model');
const passwords = require('../services/passwords');
const tools = require('../services/tools');

exports.create = async function (req, res) {
    const rules = {
        "name": "required|string",
        "lattitude": "numeric",
        "longitude": "numeric"
    };
    try {
        const [pass, error] = tools.validate(req.body, rules);
        if (!pass) {
            res.statusMessage = error;
            res.status(400).send()
        }
        else {
            const regionId = await Regions.insert(req.body);
            res.status(201).json({regionId})
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)};
        res.status(500).send()
    }
};
exports.getAll = async function (req, res) {
    try {
        const regions = await Regions.getAll();
        res.status(200).json(regions)
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
exports.getOne = async function (req, res) {
    try {
        const region = await Regions.getById(req.params.regionId);
        if (region == null) {
            res.statusMessage = "Not Found";
            res.status(404).send()
        }
        else {
            res.status(200).json(region);
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)};
        res.status(500).send()
    }
};
exports.modify = async function (req, res) {
    const rules = {
        "name": "required_without_all:lattitude,longitude|string",
        "lattitude": "numeric",
        "longitude": "numeric"
    };
    try {
        const [pass, error] = tools.validate(req.body, rules);
        if (!pass) {
            res.statusMessage = error;
            res.status(400).send();
        }
        else {
            const region = await Regions.getById(req.params.regionId);
            if (region == null) {
                res.statusMessage = "Not Found";
                res.status(404).send();
            }
            else {
                await Regions.update(req.body, req.params.regionId);
                res.status(200).send();
            }
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
exports.delete = async function (req, res) {
    try {
        const region = await Regions.getById(req.params.regionId);
        if (region == null) {
            res.statusMessage = "Not Found";
            res.status(404).send()
        }
        else {
            await Regions.delete(req.params.regionId);
            res.status(200).send()
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};


