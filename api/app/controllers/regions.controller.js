const Stores = require('../models/stores.model');
const Brands = require('../models/brands.model');
const Regions = require('../models/regions.model');
const Locations = require('../models/locations.model');
const passwords = require('../services/passwords');
const tools = require('../services/tools');

exports.create = async function (req, res) {
    const rules = {
        "name": "required|string",
        "lattitude": "required|numeric",
        "longitude": "required|numeric"
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


