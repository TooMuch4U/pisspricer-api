const regions = require('../controllers/regions.controller');
const authenticate = require('../middleware/authenticate');

module.exports = function(app) {
    const baseUrl = app.rootUrl + '/regions';

    app.route(baseUrl + '/')
        .post(authenticate.adminRequired, regions.create)
        .get(regions.getAll);

    app.route(baseUrl + '/:regionId')
        .get(regions.getOne)
        .patch(authenticate.adminRequired, regions.modify)
        .delete(authenticate.adminRequired, regions.delete);

};