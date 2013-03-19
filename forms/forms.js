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


var Models = {};
exports.set_models = function (models) {
    Models = models;
};

exports.registerModel = function (modelName, model) {
    Models[modelName] = model;
};

exports.checkDependecies = function (model, id, callback) {
    var models_to_query = {};
    for (var modelName in Models) {
        var model_ref = Models[modelName];
        if (!model_ref) {
            continue;
        }
        if (!model_ref.schema) {
            continue;
        }
        for (var fieldName in model_ref.schema.paths) {
            if (model_ref.schema.paths[fieldName].options.ref && model_ref.schema.paths[fieldName].options.ref === model) {
                models_to_query[modelName] = models_to_query[modelName] || [];
                var query_dict = {};
                query_dict[fieldName] = id;
                models_to_query[modelName].push(query_dict);
            }
        }
    }
    var funcs = Object.keys(models_to_query).map(function (modelName) {
        return function (cbk) {Models[modelName].find({$or: models_to_query[modelName]}, cbk);};
    });
    async.parallel(
        funcs,
        function (err, results) {
            var all_results = results.reduce(function (acc, res_batch) {return acc.concat(res_batch);}, []);
            callback(err, all_results);
        }
    );
};


exports.unlinkDependencies = function (model, id, callback) {
    exports.checkDependecies(model, id, function (err, deps) {
        if (err) {
            callback(err);
        }
        else {
            async.forEach(deps, function (dep, cbk) {
                var schema = dep.schema;
                var shouldSave = false, shouldRemove = false;
                for (var fieldName in schema.paths) {
                    if (schema.paths[fieldName].options.ref && schema.paths[fieldName].options.ref === model && dep[fieldName] + '' === id) {
                        //noinspection JSUnresolvedVariable
                        switch (schema.paths[fieldName].options.onDelete) {
                        case 'delete':
                            shouldRemove = true;
                            break;
                        case 'setNull':
                            dep[fieldName] = null;
                            shouldSave = true;
                            break;
                        }
                    }
                }
                if (shouldRemove) {
                    dep.remove(cbk);
                }
                else {
                    if (shouldSave) {
                        dep.save(cbk);
                    }
                    else {
                        cbk();
                    }
                }
            }, callback);
        }
    });
};

var BaseForm = exports.BaseForm = Class.extend({
    init: function (request, options) {
        this.fields = {};
        options = options || {};
        this.data = options.data || request.body || {};
        this.files = options.files || request.files || {};
        this.admin_root = request.app.path();
        this.exclude = options.exclude || [];
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
        _.each(this.fields, function (field) {
            var _static = field.get_static();
            if (_static.js.length) {
                self.static.js = _.union(self.static.js, _static.js);
            }
            if (_static.css.length) {
                self.static.css = _.union(self.static.css, _static.css);
            }
        });
    },
    render_head: function () {
        var self = this;
        self.get_static();
        return common.writer_to_string(function (res) {
            self.static['js'].forEach(function (script_url) {
                if (!~script_url.indexOf('//')) script_url = self.admin_root + script_url;
                res.write('<script src="' + script_url + '"></script>');
            });
            self.static['css'].forEach(function (style_url) {
                if (!~style_url.indexOf('://')) style_url = self.admin_root + style_url;
                res.write('<link type="text/css" href="' + style_url + '" rel="stylesheet">');
            });
            self.static['inline-style'].forEach(function (inline_style) {
                res.write('<style>' + inline_style + '</style>');
            });
            self.static['inline-script'].forEach(function (inline_script) {
                res.write('<script>' + inline_script + '</script>');
            });
        }, 1000);
    },
    get_fields: function () {
        var self = this;
        for (var attr in self) {
            if (self[attr] instanceof fields.BaseField) {
                self.fields[attr] = self[attr];
            }
        }
        var all_fields = self.fields;
        self.fields = {};
        _.each(all_fields, function (field, name) {
            if (_.indexOf(self.exclude, name) === -1) {
                self.fields[name] = field;
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
            this.fields[field_name].set(value, this.request).name = field_name;
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

        function create_clean_func(field_name) {
            return function (cbk) {
                self.fields[field_name].clean_value(self.request, function (err) {
                    if (err) {
                        cbk(err);
                    }
                    else {
                        if (self.fields[field_name].errors && self.fields[field_name].errors.length) {
                            self.errors[field_name] = self.fields[field_name].errors;
                        }
                        else {
                            self.clean_values[field_name] = self.fields[field_name].value;
                        }
                        cbk(null);
                    }
                });
            };
        }

        for (var field_name in self.fields) {
            clean_funcs.push(create_clean_func(field_name));
        }
        async.parallel(clean_funcs, function (err) {
            if (err) {
                callback(err);
            }
            else {
                callback(null, Object.keys(self.errors).length === 0);
            }
        });
    },


    render_ready: function (callback) {
        var self = this;
        if (!this._fields_ready) {
            this.init_fields();
        }
        async.each(
            Object.keys(this.fields),
            function (field_name, cb) { self.fields[field_name].pre_render(cb); },
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
                res.write('<div class="nf_fieldset closed">');
            }
            var title = fieldset['title'] || '';
            if (title !== '' && !options['hide_titles']) {
                res.write('<h2>' + title + '</h2>');
            }
            res.write('<div>');
            var fields = fieldset.fields;
            if (fields) {
                render_fields(fields);
            }
            res.write('</div>');
            if (fieldset['title'] && fieldset['title'] !== '' && !options['hide_fieldsets']) {
                res.write("</div>");
            }
        }

        if (self.fieldsets) {
            render_fields(self.fieldsets[0].fields);
        } else {
            render_fields(Object.keys(self.fields));
        }
        if (_.indexOf(self.exclude, 'id') === -1 && self.instance) {
            res.write('<input type="hidden" id="document_id" name="_id" value="' + (self.instance.isNew ? '' : self.instance.id) + '" />');
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
                for (var attr in inner_schema) {
                    single_field[attr] = inner_schema[attr];
                }
                for (var attr in  mongoose_field.options) {
                    single_field[attr] = mongoose_field.options[attr];
                }
                single_field['type'] = mongoose_field.options.type[0];
                schema = new module.parent.mongoose_module.Schema({__self__: single_field});
            }
            else {
                if (mongoose_field.options.type[0].paths && mongoose_field.options.type[0].tree) {
                    schema = mongoose_field.options.type[0];
                }
                else {
                    schema = new module.parent.mongoose_module.Schema(mongoose_field.options.type[0]);
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
            var model = Models[mongoose_field.options.ref];
            if (!model) {
                model = module.parent.mongoose_module.model(mongoose_field.options.ref);
                //                return new TypeError('Unknown model '+ mongoose.options.ref + ' have you used set_models with your mongoose models')
            }
            return new fields.RefField(options, model);
        }
        if (mongoose_field.options.enum) {
            return new fields.EnumField(options, mongoose_field.options.enum);
        }
        if (mongoose_field.options.type === Boolean) {
            return new fields.BooleanField(options);
        }
        if (mongoose_field.options.type.name === 'Integer') {
            options.step = options.step != null ? options.step : 1.0;
            return new fields.NumberField(options);
        }
        if (mongoose_field.options.type === Number) {
            return new fields.NumberField(options);
        }
        if (mongoose_field.options.type === Date) {
            return new fields.DateField(options);
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




