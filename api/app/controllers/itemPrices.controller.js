const Items = require('../models/items.model');
const Prices = require('../models/itemPrices.model');
const Categories = require('../models/categories.model');
const Subcategories = require('../models/subcategories.model');
const Locations = require('../models/locations.model');
const passwords = require('../services/passwords');
const tools = require('../services/tools');

exports.getStores = async function (req, res) {
    const rules = {
        "lat":   "required_with:lng|numeric",
        "lng":   "required_with:lat|numeric",
        "r":     "numeric",
        "order": "string",
        "index":     "integer",
        "count": "integer|min:0"
    };
    try {
        let sku;
        if (req.query.mode === 'slug') {
            sku = await Prices.getSkuSlug(req.params.sku)
        } else {
            sku = req.params.sku;
        }

        const isAdmin = req.userPermission >= 5;

        // Check if item exist
        const item = await Items.getBySku(sku);
        if (item == null) {
            res.statusMessage = "Not Found";
            res.status(404).send();
            return;
        }

        // Validate parameters
        const [isPass, error] = tools.validate(req.params, rules);
        if (!isPass) {
            res.statusMessage = error;
            res.status(400).send();
            return;
        }

        let priceList = await Prices.getAll(sku, req.query, isAdmin);
        let priceCount = await Prices.getPriceCount(sku, req.query, isAdmin);
        res.status(200).json({totalCount: priceCount, count: priceList.length, items: priceList})
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
exports.setPrice = async function (req, res) {
    const rules = {
        "salePrice": "numeric",
        "price": "required|numeric",
        "stock": "string|max:1",
        "internalSku": "string",
        "url": "string"
    };
    try {
        const sku = req.params.sku;
        const storeId = req.params.storeId;

        // Check if sku exists
        const item = await Items.getBySku(sku);
        if (item == null) {
            res.statusMessage = "Not Found";
            res.status(404).send();
            return;
        }

        // Check data
        const [isPass, error] = tools.validate(req.body, rules);
        if (!isPass) {
            res.statusMessage = error;
            res.status(400).send();
            return;
        }

        // Insert price
        const isNew = await Prices.insertOrSetPrice(sku, storeId, req.body);
        if (isNew) {
            res.status(201).send();
        } else {
            res.status(200).send();
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send();
    }
};
exports.getOne = async function (req, res) {
    try {
        const sku = req.params.sku;
        const storeId = req.params.storeId;

        // Check if item exists
        let price = await Prices.getOne(sku, storeId);
        if (price == null) {
            res.statusMessage = "Not Found";
            res.status(404).send();
            return;
        }

        if (req.userPermission < 5) {
            delete price.internalSku;
        }
        res.status(200).json(price)
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
exports.delete = async function (req, res) {
    try {
        const sku = req.params.sku;
        const storeId = req.params.storeId;

        // Check if item exists
        let price = await Prices.getOne(sku, storeId);
        if (price == null) {
            res.statusMessage = "Not Found";
            res.status(404).send();
            return;
        }

        await Prices.delete(sku, storeId);
        res.status(200).send()
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
