const Ajv = require('ajv');
const ajv = new Ajv({ removeAdditional: 'all' });
const swaggerApi = require('../resources/openapi');

ajv.addSchema(swaggerApi, 'swagger');
ajv.addFormat('password', /.*/);
ajv.addFormat('binary', /.*/);

exports.checkAgainstSchema = function (schemaPath, data, requireNotEmpty = true) {
    const schemaRef = 'swagger#/' + schemaPath;
    try {
        if (ajv.validate({ $ref: schemaRef }, data)) {
            if (requireNotEmpty && Object.keys(data).length === 0)
                return 'no valid fields provided';
            else {
                return true;
            }
        } else {
            return ajv.errorsText();
        }
    } catch (err) {
        return err.message;
    }
};
