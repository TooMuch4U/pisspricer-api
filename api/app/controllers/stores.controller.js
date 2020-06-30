const Stores = require('../models/stores.model');
const Brands = require('../models/brands.model');
const Regions = require('../models/regions.model');
const Locations = require('../models/locations.model');
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
        address: "required_with:postcode|string",
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
                const region = await Regions.getById(req.body.regionId);
                if (req.body.regionId != null && region == null) {
                    res.statusMessage = "Field regionId doesn't reference a region";
                    res.status(400).send();
                }
                else {
                    const storeId = await Stores.insert(req.body);
                    if (req.body.regionId != null) {
                        const locationId = await Locations.insert(req.body, storeId);
                        if (locationId == null) {
                            throw Error("Error inserting location");
                        }
                    }
                    res.status(201).json(tools.toCamelCase({storeId}));
                }
            }
            else {
                res.statusMessage = "Field brandId does not reference a brand";
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
    let rules = {
        name: "required_without_all:url,brandId,lattitude,longitude,regionId,address,postcode|string",
        url: "string",
        brandId: "integer",
        lattitude: "numeric",
        longitude: "numeric",
        regionId: "integer",
        address: "numeric",
        postcode: "numeric"
    };
    try {
        let [isPass, error] = tools.validate(req.body, rules);

        if (!isPass) {
            res.statusMessage = error;
            res.status(400).send();
        }
        else {
            const brand = await Brands.getById(req.body.brandId);
            if (brand != null) {
                const region = Regions.getById(req.body.regionId);
                if (region == null) {
                    res.statusMessage = "Field regionId doesn't reference a region";
                    res.status(400).send();
                }
                else {
                    const storeId = await Stores.insert(req.body);
                    res.status(201).json(tools.toCamelCase({storeId}));
                }
            }
            else {
                res.statusMessage = "Field brandId does not reference a brand";
                res.status(400).send()
            }
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};