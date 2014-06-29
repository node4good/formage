'use strict';
var _ = require('lodash-contrib'),
    AdminForm = require('./AdminForm'),
    BaseField = require('./Fields').BaseField,
    MPromise = require('mpromise'),
    util = require('util');


function SubForm(name_prefix, generator) {
    this.name = name_prefix;
    this.name_prefix = name_prefix;
    this.generator = generator;
    this.fields = generator(name_prefix);
}
util.inherits(SubForm, AdminForm);


SubForm.prototype.unbind = function SubForm_unbind() {
    AdminForm.prototype.unbind.call(this);
    this.value = this.get_value();
};


SubForm.prototype.get_value = function SubForm_get_value() {
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
    var p = MPromise.fulfilled();
    _.each(this.fields, function (fld) {
        p = p.then(function () {
            return fld.validate();
        }).then(function () {
            if (!_.isEmpty(fld.errors))
                self.errors[fld.name] = fld.errors;
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

        iFieldSet.forEach(function forEachFiledInSet(field, field_name) {
            if (!(field instanceof BaseField || field instanceof (SubForm.InlineRefField))) {
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
    var iFieldSet = AdminForm.organizeByFieldSets(iFields);
    renderFields(iFieldSet, this.name_prefix);
};


module.exports = SubForm;
