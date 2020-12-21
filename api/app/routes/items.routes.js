const items = require('../controllers/items.controller');
const prices = require('../controllers/itemPrices.controller');
const authenticate = require('../middleware/authenticate');

module.exports = function(app) {
    const baseUrl = app.rootUrl + '/items';

    app.route(baseUrl + '/')
        .get(authenticate.setAuthenticatedUser, items.getAll)
        .post(authenticate.adminRequired, items.create);

    app.route(baseUrl + '/:sku')
        .get(authenticate.setAuthenticatedUser, items.getOne)
        .delete(authenticate.adminRequired, items.delete)
        .patch(authenticate.adminRequired, items.modify);

    app.route(baseUrl + '/:sku/barcodes')
        .get(authenticate.adminRequired, items.getBarcodes)
        .post(authenticate.adminRequired, items.addBarcode);

    app.route(baseUrl + '/:sku/barcodes/:ean')
        .delete(authenticate.adminRequired, items.deleteBarcode);

    app.route(baseUrl + '/:sku/stores')
        .get(authenticate.setAuthenticatedUser, prices.getStores);

    app.route(baseUrl + '/:sku/stores/:storeId')
        .get(authenticate.adminRequired, prices.getOne)
        .put(authenticate.adminRequired, prices.setPrice)
        .delete(authenticate.adminRequired, prices.delete);

    app.route(baseUrl + '/:sku/image')
        .put(authenticate.adminRequired, items.setImage);

    app.route(app.rootUrl + "/barcodes")
        .get(authenticate.adminRequired, items.getBarcodes);

    app.route(app.rootUrl + "/allitems")
        .get(authenticate.adminRequired, items.getAllNoPrice);

    app.route(app.rootUrl + "/internalids")
        .get(authenticate.adminRequired, items.getAllInternalIds);

    app.route(app.rootUrl + '/suggestions')
        .get(items.getSuggestions)
};
