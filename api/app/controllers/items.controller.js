const Items = require('../models/items.model');
const Categories = require('../models/categories.model');
const Subcategories = require('../models/subcategories.model');
const Locations = require('../models/locations.model');
const passwords = require('../services/passwords');
const tools = require('../services/tools');

exports.create = async function (req, res) {
    const rules = {
        "name": "required|string",
        "brand": "string",
        "categoryId": "integer",
        "subcategoryId": "integer",
        "slug": "string",
        "stdDrinks": "numeric",
        "alcoholContent": "numeric",
        "volumeTotal": "integer",
        "barcode": "string"
    };
    try {
        let [isPass, error] = tools.validate(req.body, rules);
        if (!isPass) {
            res.statusMessage = error;
            res.status(400).send()
        }
        else {
            let cat = await Categories.getById(req.body.categoryId);
            let subcat = await Subcategories.getBySubId(req.body.categoryId, req.body.subcategoryId);
            if ((req.body.subcategoryId != null && subcat == null)) {
                res.statusMessage = "Field subcategoryId must reference a subcategory";
                res.status(400).send()
            }
            else if ((req.body.categoryId != null && cat == null)) {
                res.statusMessage = "Field categoryId must reference a category";
                res.status(400).send()
            }
            else {
                let barcodeData = { "ean": req.body.barcode };
                delete req.body.barcode;
                let sku = await Items.insert(tools.toUnderscoreCase(req.body), barcodeData);
                res.status(201).json({sku})
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
        let items;
        if (req.userPermission < 5) {
            items = await Items.getAll();
        }
        else {
            items = await Items.getAllAdmin();
        }
        res.status(200).json(items)
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};