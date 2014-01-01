'use strict';
var _ = require('lodash-contrib'),
    async = require('async'),
    Promise = require('mpromise');


function read_embeded(object, name) {
    if (!object) return null;
    if (name === '__self__') return object;
    if (name in object) return object[name];
    var parent = object;
    var parts = name.split('.');
    for (var i = 0; i < parts.length - 1; i++) {
        parent = parent[parts[i]];
    }
    return parent[_.last(parts)];
}


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
    this.exclude = FORM_EXCLUDE_FIELDS.concat(options.exclude || []);
    this.instance = instance || new Model();
    this.data = data;
    this.fields = null;
    this.errors = null;
    this.header_lines = options.header_lines || [];

    this.init_fields();
    this.bind();
    this.unbind();
};


AdminForm.prototype.init_fields = function () {
    if (this.fields) return;
    this.fields = AdminForm.DI.getFields(this.model, this.exclude);
    var forest = _.pairs(this.fields);
    this._all_fields = {};
    while (forest.length) {
        var pair = forest.pop();
        if (pair[1].item_template) {
            var pairs = _.pairs(pair[1].item_template.fields);
            pairs.forEach(function (p) {p[0] = pair[0] + '[].' + p[0];});
            forest = forest.concat(pairs);
        }
        else this._all_fields[pair[0]] = pair[1];
    }
};


AdminForm.prototype.bind = function () {
    var instance = this.instance;
    _.forEach(this.fields, function (field, field_name) {
        var tempVal = read_embeded(instance, field_name);
        tempVal = (tempVal && tempVal.toObject) ? tempVal.toObject() : tempVal;
        field.bind(tempVal);
    });
};


AdminForm.prototype.unbind = function () {
    if (_.isEmpty(this.data)) return;
    var self = this;
    _.forEach(this.fields, function (field, field_name) {
        field.data = _.pick(self.data, function (f, fn) {
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
    return '\n' + header_lines.join('\n') + '\n';
};


AdminForm.prototype.pre_process = function () {
    var p = new Promise;
    p.fulfill();
    _.each(this.fields, function (field) {
        p = p.then(function () {
            return field.pre_process()
        });
    });
    return p;
};


AdminForm.prototype.validate = function validate() {
    var p = new Promise();
    if (this.errors) {
        p.fulfill(_.isEmpty(this.errors));
        return p;
    }
    this.errors = {};

    var form = this;
    p.fulfill();
    _.each(form.fields, function (field, field_name) {
        p = p.then(field.validate.bind(field)).then(
            function () {
                var db_path = field.db_path;
                if (field.errors && field.errors.length) {
                    form.errors[field_name] = field.errors;
                } else if (db_path) {
                    var val = field.get_value();
                    form.instance.set(db_path, val);
                }
            }
        );
    });

    p = p.then(function () {
        var pi = new Promise;
        form.instance.validate(function (err) {
            if (!err) return pi.fulfill(_.isEmpty(form.errors));
            _.forEach(err.errors, function (error, field_name) {
                form.errors[field_name] = form.errors[field_name] || [];
                form.errors[field_name].push(error.message || error);
                if (form.fields[field_name]) form.fields[field_name].errors = form.errors[field_name];
            });
            return pi.fulfill(_.isEmpty(form.errors));
        });
        return pi;
    });

    return p;
};


AdminForm.prototype.save = function save(callback) {
    var self = this;
    var p = new Promise(callback);
    this.pre_process()
        .then(function () {
            return self.validate();
        })
        .then(function (isValid) {
            if (isValid) {
                self.instance.save(p.resolve.bind(p));
            } else {
                p.reject(new Error("not valid"));
            }
        },
        function (err) {
            p.reject(err)
        }
    );
    return p;
};


AdminForm.organizeByFieldSets = function organizeByFieldSets(fields, renderFunc) {
    return _(fields).groupBy(function (field) {
        var parts = field._temp_name.split('.', 1);
        if (parts[0] !== field._temp_name)
            field._temp_name = field._temp_name.substring(parts[0].length + 1);
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
        }).object();
};


AdminForm.prototype.render = function (res) {
    function renderFields(iFieldSet, title) {
        if (title)
            res.write('<div class="nf_fieldset toplevel closed">\n<h2>' + title + '</h2>\n');

        res.write('<div>\n');
        iFieldSet.each(function (field) {
            field.render_with_label(res);
        });
        res.write('</div>\n');

        if (title)
            res.write("</div>\n");
    }

    var iFields = _(this.fields).each(function (field, name) { field._temp_name = name });
    var iFieldSet = AdminForm.organizeByFieldSets(iFields, renderFields);
    renderFields(iFieldSet);
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
module.exports.read_embeded = read_embeded;
