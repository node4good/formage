'use strict';
var _ = require('lodash-contrib'),
    Widgets = require('../forms/widgets'),
    Fields = require('../forms/fields');


module.exports = function (mongoose) {
    module.mongoose = mongoose;
    var models = require('../models')(mongoose);

    module.exports.getAdminUser = function (req) {
        var sessionStore = req.session._mongooseAdminUser;
        return sessionStore ? models.MongooseAdminUser.fromSessionStore(sessionStore) : false;
    };

    module.exports.getPaths = function (model) {
        var ret = _(model.schema.paths).map(function (obj, path) {
            obj.options.db_path = path;
            return obj.options;
        });
        return ret;
    };

    module.exports.Users = models.MongooseAdminUser;
    module.exports.getFields = getFields;
    module.exports.queryDocuments = queryDocuments;
    module.exports.adaptModel = adaptModel;
    return module.exports;
};


function queryDocuments(listFields, dbModel, filters, sorts, populates, start, count, cb) {
    var q = dbModel.find(filters);
    _.each(sorts, function (sort) {
        q.sort(sort);
    });
    _.each(populates, function (populate) {
        q.populate(populate);
    });
    return q
        .skip(start)
        .limit(count)
//        .select(listFields.join(' ')) // might break virtuals
        .exec();
}


function getFields(model, exclude) {
    var fields = paths_to_fields(model.schema.paths, model.schema.tree);
    fields = _.omit(fields, exclude);
    return fields;
}


function paths_to_fields(paths, tree, prefix) {
    prefix = prefix || '';
    return _(paths).map(function (path, path_name) {
        var field = path_to_field(path, prefix, path_name, tree);
        if (!field) return null;
        else return [path_name, field];
    }).compact().zipObject().valueOf();
}


function path_to_field(path, prefix, path_name, tree) {
    var fieldOptions = path.options;
    if (typeof(fieldOptions.type) === 'undefined') return null;
    if (fieldOptions.auto) return null;
    if ('editable' in fieldOptions && !fieldOptions.editable) return null;

    var options = _.extend({
        required: Boolean(fieldOptions.required),
        validators: [],
        label: path_name.split('.').pop(),
        name: prefix + path_name
    }, fieldOptions);
    // Mongoose uses `db_path` as a special property for schema options
    options.db_path = path_name;
    var validators = options.validators;

    if (fieldOptions.validate) {
        validators.push(function (value) {
            var result = fieldOptions.validate[0](value);
            return result ? true : fieldOptions.validate[1];
        });
    }
    if ('min' in fieldOptions) {
        var min = fieldOptions.min;
        validators.push(function (value) {
            if (value >= min) {
                return true;
            }
            else {
                return 'value must be equal or greater than ' + min;
            }
        });
        options.min = min;
    }
    if ('max' in fieldOptions) {
        var max = fieldOptions.max;
        validators.push(function (value) {
            if (value <= max) {
                return true;
            }
            else {
                return 'value must be equal or lower than ' + max;
            }
        });
        options.max = max;
    }
    if ('step' in fieldOptions) {
        var step = fieldOptions.step;
        validators.push(function (value) {
            if (Math.round(value / step) === value / step) {
                return true;
            }
            else {
                return 'value must be according to step ' + step;
            }
        });
        options.step = step;
    }
    if (Array.isArray(fieldOptions.type)) {
        var schema = getInnermostSchema(path, tree);
        var generator = function (prefix) {return paths_to_fields(schema.paths, schema.tree, prefix)};
        if (_.isEmpty(schema.paths)) return null;
        return new Fields.ArrayField(options, generator);
    }
    if (fieldOptions.ref) {
        return new Fields.RefField(options);
    }
    if (fieldOptions.enum) {
        return new Fields.EnumField(options);
    }
    if (fieldOptions.type.name === 'Integer') {
        options.step = 'step' in options ? options.step : 1.0;
        return new Fields.NumberField(options);
    }
    if (fieldOptions.type.name === 'Html') {
        options.widget = Widgets.RichTextAreaWidget;
        return new Fields.StringField(options);
    }
    if (fieldOptions.type.name === 'Text') {
        options.widget = Widgets.TextAreaWidget;
        return new Fields.StringField(options);
    }

    if ('formageField' in fieldOptions) {
        var Field = fieldOptions.formageField;
        return new Field(options);
    }

    var fieldName = fieldOptions.type.name + 'Field';
    if (fieldName in Fields) {
        return new Fields[fieldName](options);
    }

    if (path.instance && path.instance === 'String') {
        return new Fields.StringField(options);
    }
    return new Fields.StringField(options);
}


function getInnermostSchema(mongoose_field, tree) {
    var fieldOptions = mongoose_field.options;
    var path_parts = mongoose_field.path.split('.');
    var inner_schema = tree;
    for (var j = 0; j < path_parts.length; j++) {
        inner_schema = inner_schema[path_parts[j]];
    }

    if (Array.isArray(inner_schema)) {
        inner_schema = inner_schema[0];
    } else {
        if (inner_schema && inner_schema.type && Array.isArray(inner_schema.type)) {
            inner_schema = inner_schema.type[0];
        }
    }


    var SchemaType = module.mongoose.Schema;
    var schema;
    if (inner_schema && (typeof(inner_schema) !== 'object' || inner_schema.type)) {
        var single_field = {};
        var schemaType = inner_schema['type'];
        for (var attr in inner_schema) {
            single_field[attr] = inner_schema[attr];
        }
        for (var attr2 in fieldOptions) {
            single_field[attr2] = fieldOptions[attr];
        }
        single_field['type'] = schemaType || fieldOptions.type[0];
        schema = new SchemaType({__self__: single_field});
    } else if (fieldOptions.type[0].paths && fieldOptions.type[0].tree) {
        schema = fieldOptions.type[0];
    } else {
        schema = new SchemaType(fieldOptions.type[0]);
    }
    return schema;
}


function adaptModel(rawModel, modelName) {
    var model = rawModel.model ? rawModel : module.mongoose.model(modelName, rawModel);
    _.defaults(model.schema.formage, model.formage);
    model.isMongoose = true;
    return model
}
