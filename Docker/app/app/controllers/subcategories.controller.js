const Categories = require('../models/categories.model');
const Subcategories = require('../models/subcategories.model')
const Brands = require('../models/brands.model');
const Regions = require('../models/regions.model');
const Locations = require('../models/locations.model');
const passwords = require('../services/passwords');
const tools = require('../services/tools');

exports.getAll = async function (req, res) {
    try {
        const cat = await Categories.getById(req.params.catId);
        if (cat == null) {
            res.statusMessage = "Not Found";
            res.status(404).send()
        }
        else {
            const subcats = await Subcategories.getAllByCatId(req.params.catId);
            res.status(200).json(subcats)
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
exports.create = async function (req, res) {
    const rules = {
        "subcategory": "required|string"
    };
    try {
        const cat = await Categories.getById(req.params.catId);
        if (cat == null) {
            res.statusMessage = "Not Found";
            res.status(404).send()
        }
        else {
            let [isPass, error] = tools.validate(req.body, rules);
            if (!isPass) {
                res.statusMessage = error;
                res.status(400).send()
            }
            else {
                const subcatNew = {"name": req.body.subcategory.toLowerCase(), "parent_id": req.params.catId};
                const subcat = await Subcategories.getByName(req.params.catId, subcatNew.name);
                if (subcat != null) {
                    res.statusMessage = "Subcategory is not unique";
                    res.status(400).send()
                }
                else {
                    const subcategoryId = await Subcategories.insert(subcatNew);
                    res.status(201).json({subcategoryId})
                }
            }
        }

    }
    catch (err) {
        tools.logSqlError(err);
        res.status(500).send()
    }
};
exports.getOne = async function (req, res) {
    try {
        const subcategory = await Subcategories.getBySubId(req.params.catId, req.params.subId);
        if (subcategory == null) {
            res.statusMessage = "Not Found";
            res.status(404).send()
        }
        else {
            res.status(200).json(subcategory);
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
exports.delete = async function (req, res) {
    try {
        const subcat = await Subcategories.getBySubId(req.params.catId, req.params.subId);
        if (subcat == null) {
            res.statusMessage = "Not Found";
            res.status(404).send()
        }
        else {
            await Subcategories.delete(req.params.catId, req.params.subId);
            res.status(200).send()
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};