"use strict";
var _ = require('lodash-contrib'),
    util = require('util'),
    SubForm = require('./AdminForm').SubForm;


/**
 *
 * @constructor
 * @inherits BaseField
 */
function InlineRefField(options, prefix, fields) {
    SubForm.call(this, prefix, _.noop);
    this.fields = fields;
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
}
util.inherits(InlineRefField, SubForm);


InlineRefField.prototype.render_with_label = function (res) {
    res.write('<div class="field nf_fieldset ' + (this.defaultOpen ? '' : 'closed') + '">\n');
    var class_str = 'field_label' + (this.required ? ' required_label' : ' optional_label');
    res.write('<h2 for="id_' + this.name + '" class="' + class_str + '">' + this.name + '</h2>\n');
    this.render(res);
    res.write('</div>\n');
};


module.exports = InlineRefField;
