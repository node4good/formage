'use strict';
if (!module.parent) {
    console.log("Do not call formage directly. require()-ing is required.");
    process.exit(1);
}

var Class = require('sji'),
    _ = require('underscore'),
    async = require('async'),
    fields = require('./fields'),
    widgets = require('./widgets'),
    common = require('./common');
var mongoose = require.main.require('mongoose');


var FORM_EXCLUDE_FIELDS = ['__v'];


var models = {};
exports.set_models = function (mo) {
    models = mo;
};

exports.registerModel = function (name, model) {
    models[name] = model;
};

var BaseForm = exports.BaseForm = Class.extend({
    init: function (request, options) {
        this.fields = {};
        options = options || {};
        this.data = options.data || request.body || {};
        this.files = options.files || request.files || {};
        this.admin_root = request.app.path();
        this.exclude = _.extend(FORM_EXCLUDE_FIELDS, options.exclude);
        this.instance = options.instance;
        this.request = request;
        this._fields_ready = false;
        this.fieldsets = null;
        this.errors = {};
        this.static = options.static || {};
        this.static['js'] = this.static['js'] || [];
        this.static['css'] = this.static['css'] || [];
        this.static['inline-style'] = this.static['inline-style'] || [];
        this.static['inline-script'] = this.static['inline-script'] || [];
        this.static['js'].push('/js/forms.js');
        this.handle_empty = options.empty;
        this.handle_success = options.success;
        this.handle_error = options.error;
    },
    handle: function (options) {
        this.handle_empty = options.empty || this.handle_empty;
        this.handle_success = options.success || this.handle_success;
        this.handle_error = options.error || this.handle_error;
        var self = this;
        if (self.request.method.toUpperCase() === 'GET' && this.handle_empty) {
            self.render_ready(function (err) {
                self.handle_empty(err);
            });
        }
        if (self.request.method.toUpperCase() === 'POST' && this.handle_success && this.handle_error) {
            var on_error = function (error) {
                self.render_ready(function (err) {
                    self.handle_error(err || error);
                });
            };

            self.is_valid(function (err, valid) {
                if (err || !valid) {
                    on_error(err);
                }
                else {
                    self.save(function (err, result) {
                        if (err) {
                            on_error(err);
                        }
                        else {
                            self.handle_success(null, result);
                        }
                    });
                }
            });
        }
    },
    get_static: function () {
        var self = this;
        self.static = self.static || {js:[], css:[]};
        _.each(this.fields, function (field) {
            var _static = ('fields' in field) ? self.get_static.call(field) :  field.get_static();
            self.static.js = self.static.js.concat(_static.js || []);
            self.static.css = self.static.css.concat(_static.css || []);
        });
        self.static.js = _(self.static.js).unique();
        self.static.css = _(self.static.css).unique();
        return self.static;
    },
    render_head: function () {
        var self = this;
        self.get_static();
        return common.writer_to_string(function (res) {
            self.static['js'].forEach(function (script_url) {
                if (!~script_url.indexOf('//')) script_url = self.admin_root + script_url;
                res.write('\n<script src="' + script_url + '"></script>\n');
            });
            self.static['css'].forEach(function (style_url) {
                if (!~style_url.indexOf('://')) style_url = self.admin_root + style_url;
                res.write('\n<link type="text/css" href="' + style_url + '" rel="stylesheet">\n');
            });
            self.static['inline-style'].forEach(function (inline_style) {
                res.write('\n<style>\n' + inline_style + '\n</style>\n');
            });
            self.static['inline-script'].forEach(function (inline_script) {
                res.write('\n<script>\n' + inline_script + '\n</script>\n');
            });
        }, 1000);
    },
    get_fields: function () {
        var self = this;
        Object.keys(self.fields).forEach(function (name) {
             if (~self.exclude.indexOf(name)) {
                delete self.fields[name]
            }
        });
    },
    get_value: function (field_name) {
        return this.data[field_name];
    },
    init_fields: function () {
        this.get_fields();
        for (var field_name in this.fields) {
            var value = this.get_value(field_name);
            var field = this.fields[field_name].set(value);
            field.name = field_name;
        }
        this._fields_ready = true;
    },
    save: function (callback) {
        if (!this._fields_ready) {
            this.init_fields();
        }
        // not implemented
        if (!this.errors) {
            this.is_valid();
        }
        if (Object.keys(this.errors) > 0) {
            callback({message: 'form did not validate'});
        }
        else {
            this.actual_save(callback);
        }
    },
    actual_save: function (callback) {
        callback(new Error('not implemented'));
    },
    is_valid: function (callback) {
        var self = this;
        if (!self._fields_ready) {
            self.init_fields();
        }
        self.errors = {};
        self.clean_values = {};
        var clean_funcs = [];

        async.each(Object.keys(self.fields), function (field_name, cbk) {
                var field = self.fields[field_name];
                field.clean_value(self.request, function (err) {
                    if (err) return cbk(err);
                    if (field.errors && field.errors.length) {
                        self.errors[field_name] = field.errors;
                    } else {
                        self.clean_values[field_name] = field.value;
                    }
                    return cbk(null);
                });
            }, function (err) {
                callback(null, Object.keys(self.errors).length === 0);
            }
        );
    },


    render_ready: function (callback) {
        var self = this;
        if (!this._fields_ready) {
            this.init_fields();
        }
        async.each(
            Object.keys(this.fields),
            function (name, cb) {
                self.fields[name].pre_render(cb);
            },
            function (err) {
                callback(err);
            }
        );
    },


    render: function (res, options) {
        var self = this;
        options = options || {};
        function render_fields(fields) {
            for (var i = 0; i < fields.length; i++) {
                var field_name = fields[i];
                if (typeof(field_name) === 'object') {
                    render_fieldset(field_name);
                }
                else {
                    if (field_name in self.fields) {
                        self.fields[field_name].render_with_label(res);
                    }
                }
            }
        }

        function render_fieldset(fieldset) {
            if (!fieldset || !fieldset.fields || !fieldset.fields.length) {
                return;
            }
            if (fieldset['title'] && fieldset['title'] !== '' && !options['hide_fieldsets']) {
                res.write('\n<div class="nf_fieldset closed">\n');
            }
            var title = fieldset['title'] || '';
            if (title !== '' && !options['hide_titles']) {
                res.write('\n<h2>' + title + '</h2>\n');
            }
            res.write('\n<div>\n');
            var fields = fieldset.fields;
            if (fields) {
                render_fields(fields);
            }
            res.write('\n</div>\n');
            if (fieldset['title'] && fieldset['title'] !== '' && !options['hide_fieldsets']) {
                res.write("\n</div>\n");
            }
        }

        if (self.fieldsets) {
            render_fields(self.fieldsets[0].fields);
        } else {
            render_fields(Object.keys(self.fields));
        }
        if (_.indexOf(self.exclude, 'id') === -1 && self.instance) {
            res.write('\n<input type="hidden" id="document_id" name="_id" value="' + (self.instance.isNew ? '' : self.instance.id) + '" />\n');
        }
    },
    to_html: function () {
        var self = this;
        return common.writer_to_string(function (res) {
            self.render(res);
        }, 36000);
    },
    render_error: function (res, field_name) {
        this.fields[field_name].render_error(res);
    }
});


var MongooseForm = exports.MongooseForm = BaseForm.extend({
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
        if (mongoose_field.options.min != null) {
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
        if (mongoose_field.options.max != null) {
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
        if (mongoose_field.options.step != null) {
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
            var schema;
            if (inner_schema && (typeof(inner_schema) !== 'object' || inner_schema.type)) {
                var single_field = {};
                var schemaType = inner_schema['type'];
                for (var attr in inner_schema){
                    single_field[attr] = inner_schema[attr];
                }
                for (var attr in  mongoose_field.options) {
                    single_field[attr] = mongoose_field.options[attr];
                }
                single_field['type'] = schemaType || mongoose_field.options.type[0];
                schema = new mongoose.Schema({__self__: single_field});
            }
            else {
                if (mongoose_field.options.type[0].paths && mongoose_field.options.type[0].tree) {
                    schema = mongoose_field.options.type[0];
                }
                else {
                    schema = new mongoose.Schema(mongoose_field.options.type[0]);
                }
            }
            var list_fields = {};
            var list_fieldsets = [];
            this.mongoose_fields_to_fieldsets(schema.paths, schema.tree, list_fields, list_fieldsets);
            return new fields.ListField(options, list_fields, list_fieldsets);
        }
        if (mongoose_field.options.type.name === 'File') {
            return new fields.FileField(options);
        }

        if (mongoose_field.options.type.name === 'Picture') {
            return new fields.PictureField(options);
        }

        if (mongoose_field.options.type.name === 'GeoPoint') {
            return new fields.GeoField(options);
        }

        if (mongoose_field.options.type.name === 'Mixed') {
            return new fields.DictField(options);
        }

        if (mongoose_field.options.ref) {
            var model = models[mongoose_field.options.ref];
            return new fields.RefField(options, model);
        }
        if (mongoose_field.options.enum) {
            return new fields.EnumField(options, mongoose_field.options.enum);
        }
        if (mongoose_field.options.type === Boolean) {
            return new fields.BooleanField(options);
        }
        if (mongoose_field.options.type.name === 'Integer') {
            options.step = 'step' in options ? options.step : 1.0;
            return new fields.NumberField(options);
        }
        if (mongoose_field.options.type === Number) {
            return new fields.NumberField(options);
        }
        if (mongoose_field.options.type === Date) {
            return new fields.DateField(options);
        }
        if (mongoose_field.options.type.name === 'Time') {
            return new fields.TimeField(options);
        }
        if (mongoose_field.options.type.name === 'Html') {
            options.widget = widgets.RichTextAreaWidget;
            return new fields.StringField(options);
        }
        if (mongoose_field.options.type.name === 'Text') {
            options.widget = widgets.TextAreaWidget;
            return new fields.StringField(options);
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




