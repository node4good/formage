'use strict';
var _ = require('lodash'),
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
            obj.options._typeName = obj.options.type && obj.options.type.name;
            return obj.options;
        });
        return ret;
    };

    module.exports.ensureExists = models.MongooseAdminUser.ensureExists.bind(models.MongooseAdminUser);
    module.exports.registerModelPermissions = models.MongooseAdminUser.registerModelPermissions.bind(models.MongooseAdminUser);
    module.exports.getByUsernamePassword = models.MongooseAdminUser.getByUsernamePassword.bind(models.MongooseAdminUser);
    module.exports.Users = models.MongooseAdminUser;
    module.exports.getFields = getFields;
    module.exports.queryDocuments = queryDocuments;
    return module.exports;
};


function queryDocuments(listFields, dbModel, filters,  sorts, populates, start, count, cb) {
    var q = dbModel.find(filters);

    _.each(sorts, function (sort) {
        q.sort(sort);
    });
    _.each(populates, function (populate) {
        q.populate(populate);
    });
    q.skip(start).limit(count).exec().then(function (docs) {
        var filteredDocuments = docs.map(function (document) {
            var d = {};
            listFields.forEach(function (listField) {
                d[listField] = typeof(document[listField]) == 'function' ? document[listField]() : document[listField];
            });
            return d;
        });
        cb(filteredDocuments);
    }).end();
}


function getFields(model, exclude, fieldsets) {
    var fields = {};
    mongoose_fields_to_fieldsets(model.schema.paths, model.schema.tree, fields, fieldsets);
    fields = _.omit(fields, exclude);
    scanFields(fields);
    return fields;
}


function mongoose_fields_to_fieldsets(field_paths, field_tree, ref_fields, ref_fieldsets) {
    ref_fieldsets.push({title: '', fields: []});
    Object.keys(field_paths).forEach(function (field_path) {
        var parts = field_path.split('.');
        var label = parts.pop();
        var form_field = mongoose_field_to_form_field(field_paths[field_path], field_path, label, field_tree);
        if (!form_field) return;

        ref_fields[field_path] = form_field;
        var parent_fieldset = ref_fieldsets[0];
        for (var i = 0; i < parts.length; i++) {
            var fieldset = null;
            for (var j = 0; j < parent_fieldset.fields.length; j++) {
                if (typeof(parent_fieldset.fields[j]) === 'object' && parent_fieldset.fields[j].title === parts[i]) {
                    fieldset = parent_fieldset.fields[j];
                }
            }
            if (!fieldset) {
                fieldset = {title: parts[i], fields: []};
                parent_fieldset.fields.push(fieldset);
            }
            parent_fieldset = fieldset;
        }
        parent_fieldset.fields.push(field_path);
    });
}


function mongoose_field_to_form_field(mongoose_field, db_path, label, tree) {
    var fieldOptions = mongoose_field.options;
    if (typeof(fieldOptions.type) === 'undefined') return null;
    if (fieldOptions.auto) return null;
    if ('editable' in fieldOptions && !fieldOptions.editable) return null;

    var options = _.extend({
        required: Boolean(fieldOptions.required),
        validators: [],
        label: label,
        name: db_path,
        db_path: db_path
    }, fieldOptions);
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
        var schema = getInnermostSchema(mongoose_field, tree);
        var list_fields = {};
        var list_fieldsets = [];
        mongoose_fields_to_fieldsets(schema.paths, schema.tree, list_fields, list_fieldsets);
        if (_.isEmpty(list_fields)) return null;
        return new Fields.ArrayField(options, list_fields, list_fieldsets);
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

    if (mongoose_field.instance && mongoose_field.instance === 'String') {
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


function scanFields(form_fields) {
    _.forEach(form_fields, function (field) {
        if (field instanceof Fields.RefField) {
            if (!field.options.url || !field.options.query) return;
            field.options.widget_options.url = field.options.url;
            field.options.widget_options.data = field.options.widget_options.data || {};
            field.options.widget_options.data.data = encodeURIComponent(JSON.stringify({
                model: field.options.ref,
                query: field.options.query || '/__value__/i.test(this.name || this.title || this._id.toString())'
            }));
            field.widget = new Widgets.AutocompleteWidget(_.extend({}, field.options, field.options.widget_options));
        } else if (field instanceof Fields.ArrayField) {
            scanFields(field.fields);
        }
    });
}
