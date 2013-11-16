"use strict";
var _ = require('lodash'),
    util = require('util'),
    async = require('async'),
    Fields = require('./fields'),
    AdminForm = require('./AdminForm');


function read_embeded(object, name) {
    if (!object) return null;
    if (object[name]) return object[name];
    var parent = object;
    var parts = name.split('.');
    for (var i = 0; i < parts.length - 1; i++) {
        parent = parent[parts[i]];
    }
    return parent[_.last(parts)];
}


/**
 *
 * @constructor
 */
function ArrayField(options, fields, fieldsets) {
    delete options.widget;
    Fields.BaseField.prototype.init.call(this, options);
    this.item_template = new CompositeField(fields);
    this.fields = fields;
    this.fieldsets = fieldsets;
    this.header_lines = _(fields).pluck('header_lines').flatten().compact().valueOf();
}
util.inherits(ArrayField, Fields.BaseField);


ArrayField.prototype.pre_process = function (callback) {
    var funcs = _.map(this.fields, function (field) { return field.pre_process.bind(field); });
    async.parallel(funcs, callback);
};


ArrayField.prototype.validate_ = function (callback) {
    var arrayField = this;
    var funcs = _.map(this.value, function (val) {
        return function (validate_callback) {
            item_template.value = val;
            item_template.validate(function () {

            });
        }
    });
    async.parallel(funcs, callback);
};


ArrayField.prototype.unbind = function () {

    var prefix = this.name + '_li';

    var fields = this.fields;

    var val = this.data;
    val = _.map(val ,function (value, fullname) {
            var pre_len = prefix.length;
            var next_ = fullname.indexOf('_', pre_len);
            var key = fullname.substring(pre_len, next_);
            var name = fullname.substring(next_ + 1);
            var entry = {key: key, name: name, value: value};
            return entry;
        });
    val = _.reduce(val, function (seed, entry) {
            seed[entry.key] = seed[entry.key] || {};
            seed[entry.key][entry.name] = entry.value;
            return seed;
        }, []);
    val = _.map(val, function (data) {
            var pair = {data: data, fields: fields};
            AdminForm.prototype.unbind.call(pair);
            var gush = _.reduce(pair.fields, function (seed, field, name) {
                seed[name] = field.value;
                return seed;
            }, {});
            if ('__self__' in gush) gush = gush.__self__;
            return gush;
        });
    this.value = val;
};


ArrayField.prototype.render = function (res) {
    var self = this;

    var children_errors = self.children_errors || [];

    res.write('<div class="nf_listfield" ' + 'name="' + this.name + '">\n<div class="nf_hidden_template">\n');
    var prefix = self.name + '_tmpl_';
    // Todo: get default values #51
    self.item_template.render(res, prefix);
    res.write('</div>\n<ul>\n');

    this.value = this.value || [];
    for (var i = 0; i < this.value.length; i++) {
        res.write('<li>');
        var inner_prefix = self.name + '_li' + i + '_';
        self.item_template.render(res, inner_prefix, self.value[i], children_errors[i]);
        res.write('</li>\n');
    }
    res.write('</ul>\n</div>\n');
    return self;
};


module.exports = ArrayField;


/**
 *
 * @param fields
 * @constructor
 */
function CompositeField(fields) {
    this.fields = fields;
}


CompositeField.prototype.render = function (res, prefix, value, errors) {
    var fields = this.fields;
    errors = errors || {};

    function render_fieldset(field_names, title) {
        if (title)
            res.write('<div class="nf_fieldset">\n<h2>' + title + '</h2>\n');

        field_names.forEach(function (field_name) {
            if (!_.isString(field_name)) {
                render_fieldset(field_name.fields, field_name.title);
                return;
            }
            var field = fields[field_name];
            if (!field)
                return;

            // setup for re-use
            field.name = prefix + field_name;
            delete field.errors;

            // This is for array in template
            if (field_name === '__self__') {
                field.value = value;
                field.render(res);
            } else {
                field.value = read_embeded(value, field_name);
                field.render_with_label(res);
            }
            errors[field_name] = field.errors;
        });

        if (title)
            res.write("</div>\n");
    }

    render_fieldset(Object.keys(fields));
};

