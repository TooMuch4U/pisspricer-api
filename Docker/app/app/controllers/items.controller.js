const Items = require('../models/items.model');
const Categories = require('../models/categories.model');
const Subcategories = require('../models/subcategories.model');
const Images = require('../models/images.model');
const Locations = require('../models/locations.model');
const passwords = require('../services/passwords');
const Brands = require('../models/brands.model');
const tools = require('../services/tools');
const Prices = require('../models/itemPrices.model');
const validator = require('../services/validator');

exports.create = async function (req, res) {
    const rules = {
        "name": "required|string",
        "brand": "string",
        "categoryId": "required_with:subcategoryId|integer",
        "subcategoryId": "integer",
        "stdDrinks": "numeric",
        "alcoholContent": "numeric",
        "volumeEach": "integer",
        "barcode": "string",
        "packSize": "integer"
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
                let slugName = req.body.name + (typeof req.body.volumeEach == 'undefined' ? '' : req.body.volumeEach);
                let data = tools.onlyInclude(req.body, Object.keys(rules));
                let sku = await Items.insert(tools.toUnderscoreCase(data), barcodeData, slugName);
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
    const rules = {
        "order": "string",
        "index":     "integer",
        "count": "integer|min:1",
        "search": "string",
        "catId": "array",
        "ean": "string",
        "regionId": "integer",
        "lat":   "required_with:lng,r|numeric",
        "lng":   "required_with:r|numeric",
        "r":     "required_with:lat|numeric"
    };
    try {
        let [isPass, error] = tools.validate(req.params, rules);
        if (!isPass) {
            res.statusMessage = error;
            res.status(400).send();
            return;
        }

        let items = await Items.getAll(req.query);
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
        let item;
        if (req.query.mode === 'slug') {
            let sku = await Prices.getSkuSlug(req.params.sku);
            item = null;
            if (sku != null) {
                item = await Items.getBySku(sku);
            }
        } else {
            item = await Items.getBySku(req.params.sku);
        }

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
        "volumeEach": "integer",
        "packSize": "integer"
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

exports.getBarcodes = async function (req, res) {
    try {
        const item = await Items.getBySku(req.params.sku);
        if (item == null) {
            res.statusMessage = "Not Found";
            res.status(404).send();
            return;
        }

        res.status(200).json(item.barcodes)
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
exports.deleteBarcode = async function (req, res) {
    try {
        const item = await Items.getOneBarcode(req.params.sku, req.params.ean);
        if (item == null) {
            res.statusMessage = "Not Found";
            res.status(404).send();
            return;
        }

        await Items.deleteBarcode(req.params.sku, req.params.ean);
        res.status(200).send()
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
exports.addBarcode = async function (req, res) {
    const rules = {
        "barcode": "required|string"
    };
    try {
        const item = await Items.getBySku(req.params.sku);
        if (item == null) {
            res.statusMessage = "Not Found";
            res.status(404).send();
            return;
        }

        const [pass, error] = tools.validate(req.body, rules);

        if (!pass) {
            res.statusMessage = error;
            res.status(400).send();
            return;
        }

        if (item.barcodes.includes(req.body.barcode.toString())) {
            res.statusMessage = "Barcode must be new";
            res.status(400).send();
            return;
        }

        await Items.insertBarcode(req.params.sku, req.body.barcode);
        res.status(200).send()
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};

exports.setImage = async function (req, res) {
    try {
        const sku = req.params.sku;
        const item = await Items.getBySku(sku);
        if (item == null) {
            res.statusMessage = `Not Found`;
            res.status(404).send();
            return;
        }

        if (req.body.length === undefined) {
            res.statusMessage = 'Bad request: empty image';
            res.status(400).send();
            return;
        }

        const path = `items/`;
        const blob = {"originalname": item.sku, "buffer": req.body};
        await Images.uploadImage(blob, path);
        if (item.hasImage != 1) {
            await Items.setImage(sku, 1);
            res.status(201).send();
        }
        else {
            res.status(200).send()
        }


    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};

exports.getBarcodes = async function(req, res) {
    try {
        const barcodes = await Items.allBarcodes();
        let barcode_obj = {};
        for (let i = 0; i < barcodes.length; i++) {
            let barcode = barcodes[i].ean;
            let sku = barcodes[i].sku;
            if (typeof barcode_obj[barcode] == 'undefined') {
                barcode_obj[barcode] = [sku]
            }
            else {
                let list = barcode_obj[barcode];
                list.push(sku);
            }
        }

        res.status(200).json(barcode_obj)
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};

exports.getAllNoPrice = async function(req, res) {
    try {
        const items = await Items.getAllBasic();
        res.status(200).json(items)
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};

exports.getAllInternalIds = async function(req, res) {
    try {
        if (typeof req.query.brandId === 'undefined') {
            res.statusMessage = "Field brandId not defined";
            res.status(400).send();
            return;
        }
        let brandId = req.query.brandId;
        let internalIds = await Items.getInternalIds(brandId);
        res.status(200).json(internalIds);
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};

exports.getSuggestions = async function(req, res) {
    const max_length = 5;
    try {
        if (typeof req.query.search === 'undefined') {
            res.statusMessage = "Field 'search' not defined";
            res.status(400).send();
            return
        }
        if (req.query.search.length < 2) {
            res.statusMessage = "Field 'search' less than 2 characters";
            res.status(400).send();
            return
        }

        let items = await Items.getSuggestions(req.query.search, max_length);
        res.status(200).json(items)

    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};

exports.combineItems = async function (req, res) {
    try {
        const body = req.body;
        // Check request body is valid if any provided
        let validation = true;
        if (!(Object.keys(body).length === 0 && body.constructor === Object)) {
            validation = validator.checkAgainstSchema(
                'components/schemas/ItemFull',
                body);
        }

        const item = await Items.getBySku(req.params.sku);
        const itemDuplicate = await Items.getBySku(req.params.duplicateSku);
        // Check the items exist
        if (item === null || itemDuplicate === null) {
            res.statusMessage = "Not Found";
            res.status(404).send();
            return
        }

        // Check if the slug is from one of the existing items, if provided
        if ('slug' in req.body && validation === true) {
            if (req.body.slug !== item.slug && req.body.slug !== itemDuplicate.slug) {
                validation = 'the provided slug is not from one of the existing items'
            }
        }

        // Check the request body is valid
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation}`;
            res.status(400).send();
            return
        }

        // Combine the items
        await Items.combineItems(item.sku, itemDuplicate.sku, req.body, itemDuplicate.hasImage);
        res.status(200).send();
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
