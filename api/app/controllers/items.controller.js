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
        "subcategoryId": "required_with:categoryId|integer",
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
exports.delete = async function (req, res) {
    try {
        const item = await Items.getBySku(req.params.sku);
        if (item == null) {
            res.statusMessage = "Not Found";
            res.status(404).send()
        }
        else {
            await Items.delete(req.params.sku);
            res.status(200).send();
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
exports.getOne = async function (req, res) {
    try {
        const item = await Items.getBySku(req.params.sku);
        if (item == null) {
            res.statusMessage = "Not Found";
            res.status(404).send()
        }
        else {
            if (req.userPermission < 5) {
                delete item.barcodes
            }
            res.status(200).json(item)
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
exports.modify = async function (req, res) {
    const rules = {
        "name": "string",
        "brand": "string",
        "categoryId": "integer",
        "subcategoryId": "integer",
        "slug": "string",
        "stdDrinks": "numeric",
        "alcoholContent": "numeric",
        "volumeTotal": "integer"
    };
    try {

        // Check item sku exists
        const item = await Items.getBySku(req.params.sku);
        if (item == null) {
            res.statusMessage = "Not Found";
            res.status(404).send();
            return;
        }

        // Check data provided is correct
        const [isPass, error] = tools.validate(req.body, rules);
        if (!isPass) {
            res.statusMessage = error;
            res.status(400).send();
            return;
        }

        // Check categoryId exists if provided
        if (req.body.categoryId != null) {
            const cat = await Categories.getById(req.body.categoryId);
            if (cat == null) {
                res.statusMessage = "Field categoryId must reference a category";
                res.status(400).send();
                return;
            }
        }
        else if (Object.keys(req.body).includes("categoryId")) {
            // Category id is set to null, also setting subcat to null
            req.body.subcategoryId = null;
        }

        // Check subcategoryId exists if provided
        if (req.body.subcategoryId != null) {
            let subcat;
            if (Object.keys(req.body).includes("categoryId") && Object.keys(req.body).includes("subcategoryId")) {
                subcat = await Subcategories.getBySubId(req.body.categoryId, req.body.subcategoryId);
            }
            else {
                subcat = await Subcategories.getBySubId(item.categoryId, req.body.subcategoryId);
            }
            if (subcat == null) {
                res.statusMessage = "Field subcategoryId must reference a category and be a member of parent category";
                res.status(400).send();
                return;
            }
        }

        // Check any changes where supplied
        let newItem = tools.onlyInclude(req.body, Object.keys(rules));
        if (Object.keys(newItem).length == 0) {
            res.statusMessage = "No changes supplied";
            res.status(400).send();
            return;
        }

        // Update the item
        await Items.update(newItem, req.params.sku);
        res.status(200).send();
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};