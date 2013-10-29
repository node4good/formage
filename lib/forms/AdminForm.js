'use strict';
var _ = require('lodash'),
    async = require('async'),
    writer_to_string =  require('./fields').writer_to_string,
    BaseField =  require('./fields').BaseField,
    formage = require('..');


var FORM_EXCLUDE_FIELDS = ['__v'];


/**
 *
 * @constructor
 */
function AdminForm() {
    //noinspection JSUnresolvedVariable
    this.init.apply(this, arguments);
}
_.assign(AdminForm.prototype, {
    init: function (request, options, model) {
        this.model = model;
        options = options || {};
        options.instance = options.instance || new this.model();
        this.data = options.data || request.body || {};
        this.files = options.files || request.files || {};
        this.method = options.method || request.method.toUpperCase();
        this.admin_root = request.app.path();
        this.exclude = _.extend(FORM_EXCLUDE_FIELDS, options.exclude);
        this.instance = options.instance;
        this.fields = null;
        this.fieldsets = null;
        this.errors = {};
        this.static = options.static || {};
        this.static['js'] = this.static['js'] || [];
        this.static['css'] = this.static['css'] || [];
        this.static['inline-style'] = this.static['inline-style'] || [];
        this.static['inline-script'] = this.static['inline-script'] || [];
        this.handle_empty = options.empty;
        this.handle_success = options.success;
        this.handle_error = options.error;
    },


    handle: function (options) {
        this.handle_empty = options.empty || this.handle_empty;
        this.handle_success = options.success || this.handle_success;
        this.handle_error = options.error || this.handle_error;
        var self = this;
        if (self.method === 'GET' && this.handle_empty) {
            self.render_ready(function (err) {
                self.handle_empty(err);
            });
        }
        if (self.method === 'POST' && this.handle_success && this.handle_error) {
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


    render_head: function () {
        var self = this;
        var header_lines = _(this.fields).pluck('head').flatten();
        self.static['js'].forEach(function (script_url) {
            if (!~script_url.indexOf('//')) script_url = self.admin_root + script_url;
            header_lines.push('<script src="' + script_url + '"></script>');
        });
        self.static['css'].forEach(function (style_url) {
            if (!~style_url.indexOf('://')) style_url = self.admin_root + style_url;
            header_lines.push('<link type="text/css" href="' + style_url + '" rel="stylesheet">');
        });
        self.static['inline-style'].forEach(function (inline_style) {
            header_lines.push('<style>\n' + inline_style + '\n</style>');
        });
        self.static['inline-script'].forEach(function (inline_script) {
            header_lines.push('<script>\n' + inline_script + '\n</script>');
        });
        return header_lines.unique().valueOf()
    },


    init_fields: function () {
        if (this.fields) return;

        this.fieldsets = [];
        this.fields = formage.adapter.getFields(this.model, this.exclude, this.fieldsets);
        _.forEach(this.fields, function (field, field_name) {
            field.name = field_name;
            var value = this.get_value(field_name);
            field.set(value);
        }, this);
    },


    save: function (callback) {
        this.init_fields();

        // not implemented
        if (!this.errors) {
            this.is_valid();
        }
        if (Object.keys(this.errors) > 0) {
            callback({message: 'form did not validate'});
        } else {
            this.actual_save(callback);
        }
    },


    is_valid: function (callback) {
        this.init_fields();

        var self = this;
        self.errors = {};
        self.clean_values = {};

        async.each(Object.keys(self.fields), function (field_name, cbk) {
                var field = self.fields[field_name];
                field.clean_value({body: self.data, files: self.files}, function (err) {
                    if (err) return cbk(err);
                    if (field.errors && field.errors.length) {
                        self.errors[field_name] = field.errors;
                    } else {
                        self.clean_values[field_name] = field.value;
                    }
                    return cbk(null);
                });
            }, function () {
                callback(null, Object.keys(self.errors).length === 0);
            }
        );
    },


    render_ready: function (callback) {
        this.init_fields();

        var self = this;
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
        function render_fields(fieldsArr) {
            for (var i = 0; i < fieldsArr.length; i++) {
                var field_name = fieldsArr[i];
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
    },


    to_html: function () {
        var self = this;
        return writer_to_string(function (res) {
            self.render(res);
        }, 36000);
    },


    render_error: function (res, field_name) {
        this.fields[field_name].render_error(res);
    },


    actual_save: function (callback) {
        var self = this;
        Object.keys(self.clean_values).forEach(function (field_name) {
            self.instance.set(field_name, self.clean_values[field_name]);
        });
        self.instance.save(function (err, object) {
            // Doing it flipped, since no error is simple
            if (!err) return callback(null, object);
            // Handle the errors
            console.error(err.stack || err);
            var errors = err.errors || _.object([
                [err.path, err]
            ]);
            self.errors = {};
            Object.keys(errors || {}).forEach(function (key) {
                var error = errors[key];
                if (self.fields[key] instanceof BaseField) {
                    self.errors[key] = [error.message || error];
                    self.fields[key].errors = self.errors[key];
                }
            });
            return callback(new Error(self));
        });
    },


    get_value: function (field_name) {
        if (field_name in this.data && this.data[field_name] !== null)
            return this.data[field_name];
        else
            return this.instance[field_name];
    }

});


module.exports = AdminForm;
