'use strict';
var _ = require('lodash'),
    async = require('async'),
    Promise = require('mpromise'),
    BaseField = require('./fields').BaseField;


var FORM_EXCLUDE_FIELDS = ['__v'];


/**
 *
 * @constructor
 */
function AdminForm() {
    this.init.apply(this, arguments);
}
AdminForm.prototype.init = function (options, Model, instance, data) {
    this.model = Model;
    this.exclude = _.extend(FORM_EXCLUDE_FIELDS, options.exclude);
    this.instance = instance || new Model();
    this.data = data;
    this.fields = null;
    this.fieldsets = null;
    this.errors = null;
    this.header_lines = options.header_lines || [];
    this.handle_empty = options.empty;
    this.handle_success = options.success;
    this.handle_error = options.error;

    this.init_fields();
    this.bind();
    this.unbind();
};


AdminForm.prototype.init_fields = function () {
    if (this.fields) return;
    this.fields = AdminForm.DI.getFields(this.model, this.exclude);
};


AdminForm.prototype.bind = function () {
    var instance = this.instance;
    _.forEach(this.fields, function (field, field_name) {
        var tempVal = instance.get ? instance.get(field_name) : instance[field_name];
        tempVal = (tempVal && tempVal.toObject) ? tempVal.toObject() : tempVal;
        field.set(tempVal);
    });
};


AdminForm.prototype.unbind = function () {
    if (_.isEmpty(this.data)) return;
    var data = this.data;
    _.forEach(this.fields, function (field, field_name) {
        field.data = _.pick(data, function (f, fn) {
            // My way of doing a XOR
            var isPrefix = fn.indexOf(field_name + '_') === 0;
            var isField = !isPrefix && fn === field_name;
            return isPrefix || isField;
        });
        field.unbind();
    });
};


AdminForm.prototype.render_head = function () {
    var header_lines = _(this.fields).pluck('header_lines').flatten().compact().concat(this.header_lines).unique();
    return header_lines.join('');
};


AdminForm.prototype.save = function save(callback) {
    var self = this;
    var p = new Promise(callback);
    this.validate().then(function (isValid) {
        if (isValid) {
            self.instance.save(p.resolve.bind(p));
        } else {
            p.reject(new Error("not valid"));
        }
    });
    return p;
};


AdminForm.prototype.validate = function validate(callback) {
    var form = this;
    var p = new Promise(callback);
    if (form.errors) {
        p.fulfill(_.isEmpty(form.errors));
        return p;
    }
    form.errors = {};

    var funcs = _.map(form.fields, function (field, field_name) {
        return function (cbk) {
            field.validate(function (err) {
                if (err) throw err;
                if (field.errors && field.errors.length) {
                    form.errors[field_name] = field.errors;
                } else if (field.db_path) {
                    form.instance.set(field.db_path, field.value);
                }
                cbk();
            });
        }
    });

    async.parallel(
        funcs,
        function () {
            form.instance.validate(function (err) {
                if (!err) return p.fulfill(_.isEmpty(form.errors));
                _.forEach(err.errors, function (error, field_name) {
                    form.errors[field_name] = form.errors[field_name] || [];
                    form.errors[field_name].push(error.message || error);
                    if (form.fields[field_name]) form.fields[field_name].errors = form.errors[field_name];
                });
                return p.fulfill(_.isEmpty(form.errors));
            })
        }
    );

    return p;
};


AdminForm.prototype.pre_process = function (callback) {
    var p = new Promise(callback);
    var funcs = _.map(this.fields).map(function (field) {
        return function (cb) {
            field.pre_process(cb);
        }
    });
    async.parallel(
        funcs,
        p.resolve.bind(p)
    );
    return p;
};



AdminForm.organizeByFieldSets = function organizeByFieldSets(fields, renderFunc) {
    return _(fields).groupBy(function (field) {
        var parts = field._temp_name.split('.', 1);
        if (parts[0] !== field._temp_name)
            field._temp_name = field._temp_name.substring(parts[0].length+1);
        return parts[0];
    }).map(function (group, name) {
            var field = group[0];
            if (group.length > 1) {
                field = organizeByFieldSets(group, renderFunc);
                if (renderFunc)
                field.render_with_label = function () {
                    renderFunc(_.omit(this, 'render_with_label'), name)
                };
            }
            return [name, field];
        }).object().valueOf();
}





AdminForm.prototype.render = function (res) {
    var self = this;

    function renderField(filedNames, title) {
        if (title) {
            res.write('<div class="nf_fieldset toplevel closed">\n');
            res.write('<h2>' + title + '</h2>\n');
        }

        res.write('<div>\n');
        _.each(filedNames, function (field) {
            field.render_with_label(res);
        });
        res.write('</div>\n');

        if (title) {
            res.write("</div>\n");
        }
    }

    _.each(this.fields, function (field) { field._temp_name = field.name });
    var filedNames = AdminForm.organizeByFieldSets(self.fields, renderField);
    renderField(filedNames);
};


AdminForm.prototype.toString = function () {
    var res = [];
    res.write = res.push;
    this.render(res);
    return res.join('');
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
