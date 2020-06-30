const Stores = require('../models/stores.model');
const Brands = require('../models/brands.model');
const passwords = require('../services/passwords');
const tools = require('../services/tools');

exports.create = async function (req, res) {
    let rules = {
        name: "required|string",
        url: "required|string",
        brandId: "required|integer",
        lattitude: "required_with:longitude|numeric",
        longitude: "required_with:regionId|numeric",
        regionId: "required_with:address|integer",
        address: "required_with:postcode|numeric",
        postcode: "required_with:lattitude|numeric"
    };
    try {
        let [isPass, error] = tools.validate(req.body, rules);

        if (!isPass) {
            res.statusMessage = error;
            res.status(400).send()
        }
        else {
            const brand = await Brands.getById(req.body.brandId);
            if (brand != null) {
                const storeId = await Stores.insert(req.body);
                res.status(201).json(tools.toCamelCase({storeId}));
            }
            else {
                res.statusMessage = "BrandId does not reference a brand";
                res.status(400).send()
            }
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
exports.getAll = async function (req, res) {
    try {
        const stores = await Stores.getAll();
        res.status(200).json(stores);
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
exports.getOne = async function (req, res) {
    try {
        const store = await Stores.getOne(req.params.storeId);
        if (store === null) {
            res.statusMessage = "Not Found";
            res.status(404).send()
        }
        else {
            res.status(200).json(store);
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)};
        res.status(500).send()
    }
};
exports.modify = async function (req, res) {
    try {

    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};