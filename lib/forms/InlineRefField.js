'use strict';
var _ = require('lodash-contirb'),
    AdminForm = require('./AdminForm'),
    SubForm = require('./SubForm'),
    RefField = require('./RefField'),
    util = require('util');

function InlineRefField(options, prefix, fields, model) {
    SubForm.call(this, prefix, _.noop);
    this.model = model;
    this.fields = fields;
    this.fields._id = new RefField(options);
    this.fields._id.importance = 10;
    this.header_lines = _(this.fields).pluck('header_lines').flatten().compact().valueOf();
    options = _.defaults(options, {validators: [], attrs: {}});
    this.defaultOpen = options.defaultOpen;
    this.name = options.name;
    this.value = null;
    this.errors = [];
    this.default_value = options['default'];
    this.required = options.required;
    this.validators = options.validators;
    this.db_path = options.db_path;
    this.hirarchy_name = this.db_path || '__self__';
    this.label = options.label;
    this.inline = options.inline;
    this.importance = options.important || 0;
}
util.inherits(InlineRefField, SubForm);


InlineRefField.prototype.unbind = function InlineRefField_unbind() {
    if (this.data.__self__) this.data = this.data.__self__;
    AdminForm.prototype.unbind.call(this);
    this.value = this.get_value();
};


InlineRefField.prototype.render_with_label = function InlineRefField_render_with_label(res) {
    var classes = ['field', 'nf_fieldset', (this.defaultOpen || this.inline ? '' : 'closed'), (this.inline ? 'inline' : '')].join(' ');
    res.write('<div class="' + classes + '">\n');
    if (!this.inline) {
        var label_class = 'field_label' + (this.required ? ' required_label' : ' optional_label');
        res.write('<h2 for="id_' + this.name + '" class="' + label_class + '">' + this.name + '</h2>\n');
    }
    this.render(res);
    res.write('</div>\n');
};

InlineRefField.prototype.bind = function InlineRefField_bind(instance) {
    this.instance = instance;
    AdminForm.prototype.bind.call(this);
};


InlineRefField.prototype.get_value = function InlineRefField_get_value() {
    var instance = this.instance || new this.model;
    _.forEach(this.fields, function (field, key) {
        var val = field.value;
        instance.set(key, val);
    });
    this.value = this.instance = instance;
    return this.value;
};

module.exports = InlineRefField;
