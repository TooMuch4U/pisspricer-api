const categories = require('../controllers/categories.controller');
const subcategories = require('../controllers/subcategories.controller');
const authenticate = require('../middleware/authenticate');

module.exports = function(app) {
    const baseUrl = app.rootUrl + '/categories';

    app.route(baseUrl + '/')
        .get(categories.getAll)
        .post(authenticate.adminRequired, categories.create);

    app.route(baseUrl + '/:catId')
        .get(categories.getOne)
        .patch(authenticate.adminRequired, categories.modify)
        .delete(authenticate.adminRequired, categories.delete);

    app.route(baseUrl + '/:catId/subcategories')
        .get(subcategories.getAll)
        .post(authenticate.adminRequired, subcategories.create);

    app.route(baseUrl + '/:catId/subcategories/:subId')
        .get(subcategories.getOne)
        .delete(authenticate.adminRequired, subcategories.delete)



};