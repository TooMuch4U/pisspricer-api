const Categories = require('../models/categories.model');
const Brands = require('../models/brands.model');
const Regions = require('../models/regions.model');
const Locations = require('../models/locations.model');
const passwords = require('../services/passwords');
const tools = require('../services/tools');

exports.getAll = async function (req, res) {
    try {
        const categories = await Categories.getAll();
        res.status(200).json(categories)
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
exports.create = async function (req, res) {
    let rules = {
        category: "required|string"
    };
    try {
        let [isPass, error] = tools.validate(req.body, rules);
        if (!isPass) {
            res.statusMessage = error;
            res.status(400).send()
        }
        else {
            let catData = {"name": req.body.category.toLowerCase()};
            let cat = await Categories.getByName(catData.name);
            if (cat != null) {
                res.statusMessage = "Duplicate category name";
                res.status(400).send()
            }
            else {
                const categoryId = await Categories.insert(catData);
                res.status(201).json({categoryId})
            }
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
exports.getOne = async function (req, res) {
    try {
        const category = await Categories.getById(req.params.catId);
        if (category == null) {
            res.statusMessage = "Not Found";
            res.status(404).send();
        }
        else {
            res.status(200).json(category);
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
exports.modify = async function (req, res) {
    const rules = {
        "category": "required|string"
    };
    try {
        let [isPass, error] = tools.validate(req.body, rules);
        if (!isPass) {
            res.statusMessage = error;
            res.status(400).send()
        }
        else {
            let catData = {"name": req.body.category.toLowerCase()};
            let cat = await Categories.getByName(catData.name);
            if (cat != null) {
                res.statusMessage = "Duplicate category name";
                res.status(400).send()
            }
            else {
                await Categories.update(catData, req.params.catId);
                res.status(200).send()
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
        const cat = await Categories.getById(req.params.catId);
        if (cat == null) {
            res.statusMessage = "Not Found";
            res.status(404).send()
        }
        else {
            await Categories.delete(req.params.catId);
            res.status(200).send()
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};