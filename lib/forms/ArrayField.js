"use strict";
const _ = require('lodash-contrib');
const util = require('util');
const BaseField = require('./fields').BaseField;
const SubForm = require('./AdminForm').SubForm;


/**
 *
 * @constructor
 * @inherits BaseField
 */
function ArrayField(options, generator) {
    delete options.widget;
    BaseField.prototype.init.call(this, options);
    this.item_template = new ArraySubForm(this.name + '_tmpl_', generator);
    this.sub_forms = null;
    this.header_lines = _(this.item_template.fields).map('header_lines').flatten().compact().valueOf();
    this.stackDir = options.stackDir || 'bottom';
    this.defaultOpen = options.open;
}
util.inherits(ArrayField, BaseField);


ArrayField.prototype.bind = function (data) {
    const template = this.item_template;
    this.sub_forms = _.map(data, template.instantiate.bind(template));
};


ArrayField.prototype.unbind = function () {
    const prefix = this.hirarchy_name + '_li';
    const pre_len = prefix.length;
    const template = this.item_template;
    this.sub_forms = _(this.data)
        .pickBy(function (_, key) {
            return key.indexOf(prefix) === 0;
        })
        .map(function (value, fullname) {
            const part = fullname.substring(pre_len);
            const splitPoint = part.indexOf('_');
            const index = part.substring(0, splitPoint);
            const key = part.substring(splitPoint + 1);
            // We need grouping property to be a string so it keep the original order (numbers are re-sorted)
            const entry = {li: 'li' + index, kv: [key, value]};
            return entry;
        })
        .groupBy('li')
        .map(function (group) {
            const kvarr = _.map(group, 'kv');
            const data = _.fromPairs(kvarr);
            return data;
        })
        // split so we get a new numerator
        .map(function (data, i) {
            // add new item
            const sub = template.instantiate(null, i);
            sub.data = data;
            sub.unbind();
            return sub;
        })
        .valueOf();
};


ArrayField.prototype.get_value = function () {
    const val = _.map(this.sub_forms, function (sub) {
        return sub.get_value();
    });
    return val;
};


ArrayField.prototype.pre_process = function () {
    this.fields = [this.item_template];
    if (this.sub_forms)
        this.fields = this.fields.concat(this.sub_forms);
    return ArraySubForm.prototype.pre_process.call(this);
};


ArrayField.prototype.validate = function () {
    const self = this;
    self.errors = {};
    return this.sub_forms.reduce((p, sub) =>
            p.then(() => sub.validate()).then(() => {
                if (_.isEmpty(sub.errors)) return;
                self.errors[sub.name] = sub.errors;
            })
        , Promise.resolve()
    );
};


ArrayField.prototype.render_with_label = function (res) {
    res.write('<div class="field nf_listfield_container ' + (this.defaultOpen ? '' : 'closed') + '">\n');
    this.render_label(res);
    this.render(res);
    this.render_error(res);
    res.write('</div>\n');
};


ArrayField.prototype.render = function (res) {
    // Render template
    // TODO: get default values #51
    res.write('<div class="nf_listfield" name="' + this.name + '">\n<div class="nf_hidden_template">\n');
    this.item_template.value = null;
    this.item_template.render(res);
    res.write('</div>\n<ul data-stack-dir="' + this.stackDir + '">\n');

    this.errors = this.errors || [];
    const self = this;
    _.each(this.sub_forms, function (subform) {
        res.write('<li>\n');
        subform.render(res);
        res.write('</li>\n');
    });
    res.write('</ul>\n</div>\n');
    return self;
};


module.exports = ArrayField;


function ArraySubForm(name_prefix, generator) {
    SubForm.call(this, name_prefix, generator);
}

util.inherits(ArraySubForm, SubForm);

ArraySubForm.prototype.instantiate = function (datum, item_idx) {
    const inst = new ArraySubForm(this.name_prefix.replace('_tmpl_', '_li' + item_idx + '_'), this.generator);
    inst.instance = datum;
    inst.bind();
    return inst;
};

