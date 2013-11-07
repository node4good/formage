'use strict';
var _ = require('lodash'),
    async = require('async'),
    writer_to_string = require('./fields'),
    BaseField = require('./fields').BaseField;


var FORM_EXCLUDE_FIELDS = ['__v'];


/**
 *
 * @constructor
 */
function AdminForm() {
    this.init.apply(this, arguments);
}
AdminForm.prototype.init = function (request, options, model) {
    this.model = model;
    options = options || {};
    options.instance = options.instance || new this.model();
    this.data = options.data || request.body || {};
    this.files = options.files || request.files || {};
    this.method = options.method || request.method.toUpperCase();
    this.route = request.app.route;
    this.exclude = _.extend(FORM_EXCLUDE_FIELDS, options.exclude);
    this.instance = options.instance;
    this.fields = null;
    this.fieldsets = null;
    this.errors = null;
    this.static = options.static || {};
    this.static['js'] = this.static['js'] || [];
    this.static['css'] = this.static['css'] || [];
    this.static['inline-style'] = this.static['inline-style'] || [];
    this.static['inline-script'] = this.static['inline-script'] || [];
    this.handle_empty = options.empty;
    this.handle_success = options.success;
    this.handle_error = options.error;
};


AdminForm.prototype.render_head = function () {
    var self = this;
    var header_lines = _(this.fields).pluck('head').flatten().compact();
    self.static['js'].forEach(function (script_url) {
        if (!~script_url.indexOf('//')) script_url = self.route + script_url;
        header_lines.push('<script src="' + script_url + '"></script>');
    });
    self.static['css'].forEach(function (style_url) {
        if (!~style_url.indexOf('://')) style_url = self.route + style_url;
        header_lines.push('<link type="text/css" href="' + style_url + '" rel="stylesheet">');
    });
    self.static['inline-style'].forEach(function (inline_style) {
        header_lines.push('<style>\n' + inline_style + '\n</style>');
    });
    self.static['inline-script'].forEach(function (inline_script) {
        header_lines.push('<script>\n' + inline_script + '\n</script>');
    });
    return header_lines.unique().valueOf()
};


AdminForm.prototype.init_fields = function () {
    if (this.fields) return;

    this.fieldsets = [];
    this.fields = AdminForm.DI.getFields(this.model, this.exclude, this.fieldsets);
    _.forEach(this.fields, function (field, field_name) {
        var value = this.get_value(field_name);
        field.set(value);
    }, this);
};


AdminForm.prototype.save = function save(callback) {
    var self = this;
    this.is_valid(function (err, isValid) {
        if (isValid) {
            self.instance.save(callback);
        } else {
            callback(err || new Error("not valid"));
        }
    });
};


AdminForm.prototype.is_valid = function is_valid(callback) {
    var form = this;
    if (form.errors) return callback(null, _.isEmpty(form.errors));
    form.init_fields();

    form.errors = {};
    return async.each(Object.keys(form.fields), function (field_name, cbk) {
            var field = form.fields[field_name];
            field.clean_value({body: form.data, files: form.files}, function (err) {
                if (err) throw err;
                if (field.errors && field.errors.length) {
                    form.errors[field_name] = field.errors;
                } else {
                    if (field.db_path)
                        form.instance.set(field.db_path, field.value);
                }
                return cbk();
            });
        }, function () {
            form.instance.validate(function (err) {
                if (!err) return callback(null, _.isEmpty(form.errors));
                _.forEach(err.errors, function (error, field_name) {
                    form.errors[field_name] = form.errors[field_name] || [];
                    form.errors[field_name].push(error.message || error);
                    if (form.fields[field_name]) form.fields[field_name].errors = form.errors[field_name];
                });
                return callback(err, _.isEmpty(form.errors));
            });
        }
    );
};


AdminForm.prototype.render_ready = function (callback) {
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
};


AdminForm.prototype.render = function (res, options) {
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
            res.write('<div class="nf_fieldset closed">\n');
        }
        var title = fieldset['title'] || '';
        if (title !== '' && !options['hide_titles']) {
            res.write('<h2>' + title + '</h2>\n');
        }
        res.write('<div>\n');
        var fields = fieldset.fields;
        if (fields) {
            render_fields(fields);
        }
        res.write('</div>\n');
        if (fieldset['title'] && fieldset['title'] !== '' && !options['hide_fieldsets']) {
            res.write("</div>\n");
        }
    }

    if (self.fieldsets && self.fieldsets[0]) {
        render_fields(self.fieldsets[0].fields);
    } else {
        render_fields(Object.keys(self.fields));
    }
};


AdminForm.prototype.to_html = function () {
    var res = [];
    res.write = res.push;
    this.render(res);
    return res.join('');
};


AdminForm.prototype.render_error = function (res, field_name) {
    this.fields[field_name].render_error(res);
};


AdminForm.prototype.get_value = function (field_name) {
    if (field_name in this.data)
        return this.data[field_name];
    else {
        var tempVal = this.instance.get ? this.instance.get(field_name) : this.instance[field_name];
        return (tempVal && tempVal.toObject) ? tempVal.toObject() : tempVal;
    }
};


module.exports = AdminForm;
