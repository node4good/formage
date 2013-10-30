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
            var options = obj.options || {};
            options._path = path;
            return obj.options;
        });
        return ret;
    };

    module.exports.ensureExists = models.MongooseAdminUser.ensureExists.bind(models.MongooseAdminUser);
    module.exports.registerModelPermissions = models.MongooseAdminUser.registerModelPermissions.bind(models.MongooseAdminUser);
    module.exports.getByUsernamePassword = models.MongooseAdminUser.registerModelPermissions.bind(models.MongooseAdminUser);
    module.exports.Users = models.MongooseAdminUser;
    module.exports.getFields = getFields;
    module.exports.queryDocuments = queryDocuments;
    return module.exports;
};


function queryDocuments(dbModel, filters, sort, sorts, populates, start, count, cb) {
    var q = dbModel.find(filters);

    if (sort)
        sorts.unshift(sort);
    if (sorts) {
        for (var i = 0; i < sorts.length; i++)
            q.sort(sorts[i]);
    }
    if (populates) {
        _.each(populates, function (populate) {
            q.populate(populate);
        });
    }
    q.skip(start).limit(count).exec(cb);
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
        var filed_name = parts.pop();
        var form_field = mongoose_field_to_form_field(field_paths[field_path], filed_name, field_tree);
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
        parent_fieldset.fields = parent_fieldset.fields || [];
        parent_fieldset.fields.push(field_path);
    });
}


function mongoose_field_to_form_field(mongoose_field, name, tree) {
    if (typeof(mongoose_field.options.type) === 'undefined') return null;
    if (mongoose_field.options.auto) return null;
    if ('editable' in mongoose_field.options && !mongoose_field.options.editable) return null;

    var is_required = Boolean(mongoose_field.options.required);
    var def = mongoose_field.options['default'];
    var validators = [];
    var options = _.clone(mongoose_field.options);
    _.extend(options, {
        required: is_required,
        'default': def,
        validators: validators,
        label: mongoose_field.options.label || name,
        limit: mongoose_field.options.limit,
        attrs: mongoose_field.options.attrs || {},
        widget: mongoose_field.options.widget
    });

    if (mongoose_field.options.validate) {
        validators.push(function (value) {
            var result = mongoose_field.options.validate[0](value);
            return result ? true : mongoose_field.options.validate[1];
        });
    }
    if ('min' in mongoose_field.options) {
        var min = mongoose_field.options.min;
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
    if ('max' in mongoose_field.options) {
        var max = mongoose_field.options.max;
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
    if ('step' in mongoose_field.options) {
        var step = mongoose_field.options.step;
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
    if (Array.isArray(mongoose_field.options.type)) {
        var schema = getInnermostSchema(mongoose_field, tree);
        var list_fields = {};
        var list_fieldsets = [];
        mongoose_fields_to_fieldsets(schema.paths, schema.tree, list_fields, list_fieldsets);
        if (_.isEmpty(list_fields)) return null;
        return new Fields.ArrayField(options, list_fields, list_fieldsets);
    }
    if (mongoose_field.options.ref) {
        return new Fields.RefField(options);
    }
    if (mongoose_field.options.enum) {
        return new Fields.EnumField(options);
    }
    if (mongoose_field.options.type.name === 'Integer') {
        options.step = 'step' in options ? options.step : 1.0;
        return new Fields.NumberField(options);
    }
    if (mongoose_field.options.type.name === 'Html') {
        options.widget = Widgets.RichTextAreaWidget;
        return new Fields.StringField(options);
    }
    if (mongoose_field.options.type.name === 'Text') {
        options.widget = Widgets.TextAreaWidget;
        return new Fields.StringField(options);
    }

    if ('formageField' in mongoose_field.options) {
        var Field = mongoose_field.options.formageField;
        return new Field(options);
    }

    var fieldName = mongoose_field.options.type.name + 'Field';
    if (fieldName in Fields) {
        return new Fields[fieldName](options);
    }

    if (mongoose_field.instance && mongoose_field.instance === 'String') {
        return new Fields.StringField(options);
    }
    return new Fields.StringField(options);
}


function getInnermostSchema(mongoose_field, tree) {
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
        for (var attr2 in  mongoose_field.options) {
            single_field[attr2] = mongoose_field.options[attr];
        }
        single_field['type'] = schemaType || mongoose_field.options.type[0];
        schema = new SchemaType({__self__: single_field});
    } else if (mongoose_field.options.type[0].paths && mongoose_field.options.type[0].tree) {
        schema = mongoose_field.options.type[0];
    } else {
        schema = new SchemaType(mongoose_field.options.type[0]);
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
            field.widget = new Widgets.AutocompleteWidget(field.options.widget_options);
        } else if (field instanceof Fields.EnumField) {
            field.widget = new Widgets.ComboBoxWidget(field.options.widget_options);
        } else if (field instanceof Fields.ArrayField) {
            scanFields(field.fields);
        }
    });
}
