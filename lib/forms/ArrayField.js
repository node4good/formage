"use strict";
var _ = require('lodash-contrib'),
    util = require('util'),
    async = require('async'),
    Promise = require('mpromise'),
    BaseField = require('./fields').BaseField,
    AdminForm = require('./AdminForm'),
    read_embeded = AdminForm.read_embeded;


/**
 *
 * @constructor
 * @inherits BaseField
 */
function ArrayField(options, generator) {
    delete options.widget;
    BaseField.prototype.init.call(this, options);
    this.item_template = new SubForm(this.name + '_tmpl_', generator);
    this.sub_forms = null;
    this.header_lines = _(this.item_template.fields).pluck('header_lines').flatten().compact().valueOf();
    this.stackDir = options.stackDir || 'bottom';
}
util.inherits(ArrayField, BaseField);


ArrayField.prototype.bind = function (data) {
    var template = this.item_template;
    this.sub_forms = _.map(data, template.instantiate.bind(template));
};


ArrayField.prototype.unbind = function () {
    var prefix = this.hirarchy_name + '_li';
    var pre_len = prefix.length;
    var template = this.item_template;
    this.sub_forms = _(this.data)
        .pick(function (_, key) {return key.indexOf(prefix) === 0})
        .map(function (value, fullname) {
            var part = fullname.substring(pre_len);
            var splitPoint = part.indexOf('_');
            var index = part.substring(0, splitPoint);
            var key = part.substring(splitPoint + 1);
            // We need grouping property to be a string so it keep the original order (numbers are re-sorted)
            var entry = { li: 'li'+index, kv:[key, value] };
            return entry;
        })
        .groupBy('li')
        .map(function (group) {
            var kvarr = _.pluck(group,'kv');
            var data = _.zipObject(kvarr);
            return data;
        })
        // split so we get a new numerator
        .map(function (data, i) {
            // add new item
            var sub = template.instantiate(null, i);
            sub.data = data;
            sub.unbind();
            return sub;
        })
        .valueOf();
};


ArrayField.prototype.get_value = function () {
    var val = _.map(this.sub_forms, function (sub) {
        return sub.get_value();
    });
    return val;
};


ArrayField.prototype.pre_process = function () {
    this.fields = [this.item_template];
    if (this.sub_forms)
        this.fields = this.fields.concat(this.sub_forms);
    return AdminForm.prototype.pre_process.call(this);
};


ArrayField.prototype.validate = function () {
    var p = new Promise;
    p.fulfill();
    _.each(this.sub_forms, function (sub) {
        p = p.then(sub.validate.bind(sub));
    });
    return p;
};


ArrayField.prototype.render = function (res) {
    // Render template
    // TODO: get default values #51
    res.write('<div class="nf_listfield" ' + 'name="' + this.name + '">\n<div class="nf_hidden_template">\n');
    this.item_template.value = null;
    this.item_template.render(res);
    res.write('</div>\n<ul data-stack-dir="' + this.stackDir + '">\n');

    this.errors = this.errors || [];
    var self = this;
    _.each(this.sub_forms, function (subform) {
        res.write('<li>\n');
        subform.render(res);
        res.write('</li>\n');
    });
    res.write('</ul>\n</div>\n');
    return self;
};


module.exports = ArrayField;


/**
 *
 * @param name_prefix
 * @param generator
 * @constructor
 */
function SubForm(name_prefix, generator) {
    this.name_prefix = name_prefix;
    this.generator = generator;
    this.fields = generator(name_prefix);
}
util.inherits(SubForm, AdminForm);


SubForm.prototype.instantiate = function (datum, item_idx) {
    var inst = new SubForm(this.name_prefix.replace('_tmpl_', '_li' + item_idx + '_'), this.generator);
    inst.instance = datum;
    inst.bind();
    return inst;
};


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
    var p = new Promise;
    p.fulfill();
    _.each(this.fields, function (fields) {
        p = p.then(fields.validate.bind(fields));
    });
    return p;
};


SubForm.prototype.render = function (res) {
    var self = this;
    this.errors = this.errors || {};

    function renderFields(iFieldSet, prefix, title) {
        if (title)
            res.write('<div class="nf_fieldset">\n<h2>' + title + '</h2>\n');

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

    var iFields = _(this.fields).each(function (field, name) { field._temp_name = name });
    var iFieldSet = AdminForm.organizeByFieldSets(iFields);
    renderFields(iFieldSet, this.name_prefix);
};
