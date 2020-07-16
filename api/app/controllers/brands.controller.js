const Brands = require('../models/brands.model');
const passwords = require('../services/passwords');
const tools = require('../services/tools');
const Images = require('../models/images.model');

exports.getAll = async function (req, res) {
    try {
        const data = await Brands.getAll();
        res.status(200).json(data)
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send();
    }
};
exports.insert = async function (req, res) {
    try {
        let message = "";
        if (req.body.name == null || req.body.name.length < 1) {
            message = "A name must be supplied";
        }
        if (req.body.url == null || req.body.url.length < 1) {
            message = "A url must be supplied";
        }

        if (message !== "") {
            res.statusMessage = message;
            res.status(400).send();
        }
        else {
            const brandId = await Brands.insert(req.body);
            res.status(201).json({brandId});
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send()
    }
};
exports.getOne = async function (req, res) {
    try {
        const brand = await Brands.getById(req.params.brandId);
        if (brand == null) {
            res.statusMessage = "Not Found";
            res.status(404).send();
        }
        else {
            res.status(200).json(brand);
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)};
        console.log(err);
    }
};
exports.update = async function (req, res) {
    try {
        if ((req.body.name == null || req.body.name.length < 1) &&
            (req.body.url == null || req.body.url.length < 1)) {
            res.statusMessage = "A name or url must be provided";
            res.status(400).send()
        }
        else {
            const insertId = await Brands.update(req.body, req.params.brandId);
            if (insertId == null) {
                res.statusMessage = "Not Found";
                res.status(404).send();
            }
            else {
                res.status(200).send();
            }
        }

    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send();
    }
};
exports.delete = async function (req, res) {
    try {
        let brand = await Brands.getById(req.params.brandId);
        if (brand == null) {
            res.statusMessage = "Not Found";
            res.status(404).send()
        }
        else {
            await Brands.deleteById(req.params.brandId);
            res.status(200).send();
        }
    }
    catch (err) {
        if (!err.hasBeenLogged) {console.log(err)}
        res.status(500).send();
    }
};

exports.setImage = async function (req, res) {
    try {
        const brandId = req.params.brandId;
        const brand = await Brands.getById(brandId);

        if (brand == null) {
            res.statusMessage = 'Not Found';
            res.status(404).send();
            return;
        }

        if (req.body.length === undefined) {
            res.statusMessage = 'Bad request: empty image';
            res.status(400).send();
            return;
        }

        const path = `brands/`;
        const blob = {"originalname": brand.brandId, "buffer": req.body};
        await Images.uploadImage(blob, path);
        if (brand.hasImage != 1) {
            await Brands.setImage(brandId, 1);
            res.status(201).send()
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