'use strict';
var _ = require('lodash'),
    BaseForm = require('./forms').BaseForm,
    fields = require('./fields'),
    widgets = require('./widgets'),
    formage = require('..');


var MongooseForm = module.exports = BaseForm.extend({
    init: function (request, options, model) {
        options = options || {};
        this.model = model;
        options.instance = options.instance || new this.model();
        this._super(request, options);
    },
    get_fields: function () {
        this.fields = {};
        this.fieldsets = [];
        this.mongoose_fields_to_fieldsets(this.model.schema.paths, this.model.schema.tree, this.fields, this.fieldsets);
        this._super();
    },
    mongoose_fields_to_fieldsets: function (field_paths, field_tree, ref_fields, ref_fieldsets) {
        ref_fieldsets.push({title: '', fields: []});
        for (var field in field_paths) {
            var parts = field.split('.');
            var form_field = this.mongoose_field_to_form_field(field_paths[field], parts[parts.length - 1], field_tree);
            if (form_field) {
                ref_fields[field] = form_field;
            }
            else {
                continue;
            }
            var parent_fieldset = ref_fieldsets[0];
            for (var i = 0; i < parts.length - 1; i++) {
                var fieldset = null;
                for (var j = 0; j < parent_fieldset.fields.length; j++) {
                    if (typeof(parent_fieldset.fields[j]) === 'object' && parent_fieldset.fields[j].title === parts[i]) {
                        fieldset = parent_fieldset.fields[j];
                    }
                }
                if (!fieldset) {
                    fieldset = {title: parts[i], fields: []};
                    parent_fieldset.fields.push(fieldset);
                    //parent_fieldset.fieldsets = parent_fieldset.fieldsets || [];
                    //parent_fieldset.fieldsets.push(fieldset);
                }
                parent_fieldset = fieldset;
            }
            parent_fieldset.fields = parent_fieldset.fields || [];
            parent_fieldset.fields.push(field);
        }
    },
    mongoose_field_to_form_field: function (mongoose_field, name, tree) {
        if (_.indexOf(this.exclude, name) > -1) {
            return null;
        }
        if (typeof(mongoose_field.options.type) === 'undefined') {
            return null;
        }
        if (mongoose_field.options.auto || ('editable' in mongoose_field.options && !mongoose_field.options.editable)) {
            return null;
        }//new fields.ReadonlyField({});
        var is_required = mongoose_field.options.required ? true : false;
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
            var path_parts = mongoose_field.path.split('.');
            var inner_schema = tree;
            for (var j = 0; j < path_parts.length; j++) {
                inner_schema = inner_schema[path_parts[j]];
            }
            if (Array.isArray(inner_schema)) {
                inner_schema = inner_schema[0];
            }
            else {
                if (inner_schema && inner_schema.type && Array.isArray(inner_schema.type)) {
                    inner_schema = inner_schema.type[0];
                }
            }
            var SchemaType = formage.mongoose.Schema;
            var schema;
            if (inner_schema && (typeof(inner_schema) !== 'object' || inner_schema.type)) {
                var single_field = {};
                var schemaType = inner_schema['type'];
                for (var attr in inner_schema){
                    single_field[attr] = inner_schema[attr];
                }
                for (var attr2 in  mongoose_field.options) {
                    single_field[attr2] = mongoose_field.options[attr];
                }
                single_field['type'] = schemaType || mongoose_field.options.type[0];
                schema = new SchemaType({__self__: single_field});
            }
            else if (mongoose_field.options.type[0].paths && mongoose_field.options.type[0].tree) {
                schema = mongoose_field.options.type[0];
            }
            else {
                schema = new SchemaType(mongoose_field.options.type[0]);
            }
            var list_fields = {};
            var list_fieldsets = [];
            this.mongoose_fields_to_fieldsets(schema.paths, schema.tree, list_fields, list_fieldsets);
            if(!Object.keys(list_fields).length) return null;
            return new fields.ListField(options, list_fields, list_fieldsets);
        }
        if (mongoose_field.options.ref) {
            return new fields.RefField(options);
        }
        if (mongoose_field.options.enum) {
            return new fields.EnumField(options);
        }
        if (mongoose_field.options.type.name === 'Integer') {
            options.step = 'step' in options ? options.step : 1.0;
            return new fields.NumberField(options);
        }
        if (mongoose_field.options.type.name === 'Html') {
            options.widget = widgets.RichTextAreaWidget;
            return new fields.StringField(options);
        }
        if (mongoose_field.options.type.name === 'Text') {
            options.widget = widgets.TextAreaWidget;
            return new fields.StringField(options);
        }

        if ('formageField' in mongoose_field.options) {
            var Field = mongoose_field.options.formageField;
            return new Field(options);
        }

        var fieldName = mongoose_field.options.type.name + 'Field';
        if (fieldName in fields) {
            return new fields[fieldName](options);
        }

        if (mongoose_field.instance && mongoose_field.instance === 'String') {
            return new fields.StringField(options);
        }
        return new fields.StringField(options);
    },


    get_value: function (field_name) {
        return (typeof(this.data[field_name]) === 'undefined' || this.data[field_name] == null) ? this.instance.get(field_name) : this.data[field_name];
    },


    actual_save: function (callback) {
        var self = this;
        for (var field_name in self.clean_values) {
            self.instance.set(field_name, self.clean_values[field_name]);
        }
        self.instance.save(function (err, object) {
            // Doing it flipped, since no error is simple
            if (!err) return callback(null, object);
            // Handle the errors
            console.error(err.stack || err);
            err.errors = err.errors || {};
            self.errors = {};
            Object.keys(err.errors || {}).forEach(function (key) {
                var error = err.errors[key];
                if (self.fields[key] instanceof fields.BaseField) {
                    self.errors[key] = [error.type || error.message || error];
                    self.fields[key].errors = self.errors[key];
                }
            });
            return callback(new Error(self));
        });
    }
});

