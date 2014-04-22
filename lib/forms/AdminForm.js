'use strict';
var _ = require('lodash-contrib'),
    Promise = require('mpromise'),
    util = require('util'),
    BaseField = require('./fields').BaseField;



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


AdminForm.getAllFields = function (adapter, model, exclude) {
    var fields_hierarchy;
    try {
        fields_hierarchy = adapter.getFields(model, exclude);
    } catch (e) {
        if (e instanceof ReferenceError) e.message += "referred by model `" + model.modelName + '`';
        throw e;
    }
    var forest = _.pairs(fields_hierarchy);
    var all_fields = {};
    while (forest.length) {
        var vertex = forest.pop();
        var vertexName = vertex[0];
        var vertexValue = vertex[1];
        var children = vertexValue.item_template && vertexValue.item_template.fields;
        if (!children) {
            all_fields[vertexName] = vertexValue;
            continue;
        }
        forest = _.pairs(children)
            .map(function (p) {
                return [this.prefix + p[0], p[1]];
            }, {prefix: vertexName + '[].'}) // jshint ignore:line
            .concat(forest);
    }
    return [fields_hierarchy, all_fields];
};


AdminForm.prototype.init_fields = function () {
    this.fields = AdminForm.getAllFields(this.adapter, this.model, this.exclude)[0];
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
    var root = Object.getPrototypeOf(this).registry.root;
    var header_lines = _(this.fields)
        .pluck('header_lines')
        .flatten()
        .compact()
        .concat(this.header_lines, '<link rel="stylesheet" href="' + root + '/vendor/select2/select2.css" />')
        .concat(this.header_lines, '<link rel="stylesheet" href="' + root + '/vendor/bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css" />')
        .concat(this.header_lines, '<link rel="stylesheet" href="' + root + '/css/main.css" />')
        .concat(this.header_lines, '<script src="' + root + '/vendor/select2/select2.js" ></script>')
        .concat(this.header_lines, '<script src="' + root + '/vendor/socket.io-client/dist/socket.io.js" ></script>')
        .concat(this.header_lines, '<script src="' + root + '/vendor/ckeditor/ckeditor.js" ></script>')
        .concat(this.header_lines, '<script src="' + root + '/vendor/bootbox/bootbox.js" ></script>')
        .concat(this.header_lines, '<script src="' + root + '/vendor/bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min.js" ></script>')
        .concat(this.header_lines, '<script src="' + root + '/js/document.js" ></script>')
        .concat(this.header_lines, '<script>window.socketio = io.connect("/formage");</script>')
        .unique();
    return '\n' + header_lines.join('\n') + '\n';
};


AdminForm.prototype.pre_process = function () {
    var p = new Promise;
    p.fulfill();
    _.each(this.fields, function (field) {
        p = p.then(function () {
            return field.pre_process();
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
                if (!_.isEmpty(field.errors)) {
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
            var errors = err && err.errors || [];
            _.forEach(errors, function (error, field_name) {
                field_name = field_name.replace(/\.(\d+)\./, '_li$1_');
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
            p.reject(err);
        }
    );
    return p;
};


function organizeByFieldSets(fields, renderFunc) {
    if (fields.length <= 1) return fields[0];
    return _(fields).groupBy(
        function (field) {
            var parts = field._temp_name.split('.', 1);
            if (parts[0] !== field._temp_name)
                field._temp_name = field._temp_name.substring(parts[0].length + 1);
            return parts[0];
        }
    ).map(
        function (group, name) {
            var field = organizeByFieldSets(group, renderFunc);
            if (renderFunc && group.length > 1) field.render_with_label = function () { renderFunc(_.omit(this, 'render_with_label'), name); };
            return [name, field];
        }
    ).object();
}


AdminForm.prototype.render = function (res) {
    function renderFields(iFieldSet, title) {
        if (title) {
            var niceTitle = _.humanize(title);
            res.write('<div class="nf_fieldset toplevel closed">\n<h2>' + niceTitle + '</h2>\n');
        }

        res.write('<div>\n');
        iFieldSet.each(function (field) {
            field.render_with_label(res);
        });
        res.write('</div>\n');

        if (title)
            res.write("</div>\n");
    }

    var iFields = _(this.fields).each(function (field, name) {
        field._temp_name = name;
    });
    var iFieldSet = organizeByFieldSets(iFields, renderFields);
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

/**
 *
 * @param name_prefix
 * @param generator
 * @constructor
 */
function SubForm(name_prefix, generator) {
    this.name = name_prefix;
    this.name_prefix = name_prefix;
    this.generator = generator;
    this.fields = generator(name_prefix);
}
util.inherits(SubForm, AdminForm);


SubForm.prototype.unbind = function unbind() {
    AdminForm.prototype.unbind.call(this);
    this.value = this.get_value();
};


SubForm.prototype.get_value = function get_value() {
    var gush = _.reduce(this.fields, function (seed, field, name) {
        seed[name] = field.get_value();
        return seed;
    }, {});
    if ('__self__' in gush) gush = gush.__self__;
    return gush;
};


SubForm.prototype.validate = function () {
    var self = this;
    self.errors = {};
    var p = new Promise.fulfilled();
    _.each(this.fields, function (sub) {
        p = p.then(function () {
            return sub.validate();
        }).then(function () {
            if (!_.isEmpty(sub.errors))
                self.errors[sub.name] = sub.errors;
        });
    });
    return p;
};


SubForm.prototype.render = function (res) {
    var self = this;
    this.errors = this.errors || {};

    function renderFields(iFieldSet, prefix, title) {
        if (title) {
            var niceTitle = _.humanize(title);
            res.write('<div class="nf_fieldset">\n<h2>' + niceTitle + '</h2>\n');
        }

        iFieldSet.each(function (field, field_name) {
            if (!(field instanceof BaseField)) {
                renderFields(_(field), prefix + field_name + '.', field_name);
                return;
            }

            // setup for re-use
            field.name = prefix + field_name;

            // This is for array in template
            if (field_name.substring(-'__self__'.length) === '__self__') {
                field.render(res);
            } else {
                field.render_with_label(res);
            }
            self.errors[field_name] = field.errors;
        });

        if (title)
            res.write("</div>\n");
    }

    var iFields = _(this.fields).each(function (field, name) {
        field._temp_name = name;
    });
    var iFieldSet = organizeByFieldSets(iFields);
    renderFields(iFieldSet, this.name_prefix);
};


module.exports.SubForm = SubForm;
