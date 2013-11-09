"use strict";
var _ = require('lodash'),
    util = require('util'),
    async = require('async'),
    Fields = require('./fields');


function extractSubFieldKeyAndName(field_name, prefix) {
    var pre_len = prefix.length;
    var next_ = field_name.indexOf('_', pre_len);
    var key = field_name.substring(pre_len, next_);
    var name = field_name.substring(next_ + 1);
    return {key: key, name: name};
}


function mpathAsign(object, name, value) {
    var parts = name.split('.');
    var parent = object;
    parts.forEach(function (part) {
        parent[part] = parent[part] || {};
        parent = parent[part];
    });
    parent[parts.pop()] = value;
}

function organizeValues(values) {
    return values.map(function (subDoc) {
        var part = _.reduce(subDoc, function (seed, value, key) {
            mpathAsign(seed, key, value);
            return seed;
        }, {});
        if ('__self__' in part)
            part = part.__self__;
        return part;
    });
}


/**
 *
 * @constructor
 */
function ArrayField(options, fields, fieldsets) {
    options.widget = options.widget || 'ListWidget';
    Fields.BaseField.prototype.init.call(this, options);
    this.fields = fields;
    this.fieldsets = fieldsets;
    this.header_lines = _(fields).pluck('header_lines').flatten().compact().valueOf();
}
util.inherits(ArrayField, Fields.BaseField);


ArrayField.prototype.unbind = function () {
    var self = this;
    var prefix = self.name + '_li';
    var prev_value = self.value || {};
    self.value = [];
    self.children_errors = [];

    var dataArr = _(this.data)
        .map(function (value, key) {
            var entry = extractSubFieldKeyAndName(key, prefix);
            entry.value = value;
            return entry;
        }).reduce(function (seed, entry) {
            if (entry.name === '__self__') {
                seed[entry.key] = entry.value;
            } else {
                seed[entry.key] = seed[entry.key] || {};
                seed[entry.key][entry.name] = entry.value;
            }
            return seed;
        }, []).valueOf();

    this.fields = dataArr.map(function (subData) {
        var output_data = {};
        var output_errors = {};
        self.value.push(output_data);
        self.children_errors.push(output_errors);
        var subDocFields = _(self.fields).map(function (field, field_name) {
            var old_value = prev_value[field_name] || {};

            // lodash doesn't clone the prototype;
            var inner_field = _.defaults({errors: [], name: field_name}, field);
            inner_field.__proto__ = field.__proto__;

            inner_field.data = subData || old_value;
            inner_field.unbind();

            output_data[field_name] = inner_field.value;

            return [field_name, inner_field];
        }).object().valueOf();
        return subDocFields;
    });

    self.value = organizeValues(self.value);
    Fields.BaseField.prototype.unbind.call(self);
};


ArrayField.prototype.pre_render = function (callback) {
    var self = this;

    self.widget.name = self.name;
    self.widget.value = self.value;

    var funcs = _.map(self.fields, function (field) { return field.pre_render.bind(field); });
    funcs.push(self.widget.pre_render.bind(self.widget));

    async.parallel(funcs, callback);
    return self;
};


ArrayField.prototype.render = function (res) {
    var self = this;

    var children_errors = self.children_errors || [];

    function render_template(res) {
        var prefix = self.name + '_tmpl_';
        self.render_list_item(res, self.fields, self.fieldsets, prefix);
    }

    function render_item(res, i) {
        var prefix = self.name + '_li' + i + '_';
        self.render_list_item(res, self.fields, self.fieldsets, prefix, self.value[i], children_errors[i]);
    }

    this.widget.name = this.name;
    this.widget.value = this.value;
    self.widget.render(res, render_template, render_item);
    return self;
};


ArrayField.prototype.deep_read = function (object, name) {
    var parent = object;
    if (!parent)
        return null;
    var parts = name.split('.');
    for (var i = 0; i < parts.length - 1; i++) {
        parent = parent[parts[i]];
        if (!parent)
            return null;
    }
    if (!parent)
        return null;
    return parent[_.last(parts)];
};


ArrayField.prototype.render_list_item = function (res, fields, fieldsets, prefix, value, errors) {
    var self = this;
    errors = errors || {};

    function render_fields(fields) {
        for (var i = 0; i < fields.length; i++) {
            var field_name = fields[i];
            if (typeof(field_name) === 'object')
                render_fieldset(field_name);
            else
                render_field(field_name);
        }
    }

    function render_field(field_name) {
        var field = fields[field_name];
        if (!field)
            return;
        field.name = prefix + field_name;
        field.errors = errors[field_name] || [];
        // This is for array in template
        if (field_name === '__self__') {
            field.value = value;
            field.render(res);
        } else {
            field.value = value ? self.deep_read(value, field_name) : null;
            field.render_with_label(res);
        }
    }

    function render_fieldset(fieldset) {
        var has_title = fieldset['title'] && fieldset['title'] !== '';
        if (has_title)
            res.write('<div class="nf_fieldset">\n<h2>' + fieldset['title'] + '</h2>\n');
        if (fieldset.fields)
            render_fields(fieldset.fields);
        if (has_title)
            res.write("</div>\n");
    }

    var fields_to_render = fieldsets ? fieldsets[0].fields : Object.keys(fields);
    render_fields(fields_to_render);
};


module.exports = ArrayField;
