const stores = require('../controllers/stores.controller');
const authenticate = require('../middleware/authenticate');

module.exports = function(app) {
    const baseUrl = app.rootUrl + '/stores';

    app.route(baseUrl + '/')
        .get(stores.getAll)
        .post(authenticate.adminRequired, stores.create);
    app.route(baseUrl + '/:storeId')
        .get(stores.getOne)
        .patch(authenticate.adminRequired, stores.modify)
        .delete(authenticate.adminRequired, stores.delete);



};