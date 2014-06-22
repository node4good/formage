'use strict';
var SubForm = require('./SubForm'),
    util = require('util');



function ArraySubForm(name_prefix, generator) {
    SubForm.call(this, name_prefix, generator);
}

util.inherits(ArraySubForm, SubForm);

ArraySubForm.prototype.instantiate = function (datum, item_idx) {
    var inst = new ArraySubForm(this.name_prefix.replace('_tmpl_', '_li' + item_idx + '_'), this.generator);
    inst.instance = datum;
    inst.bind();
    return inst;
};

module.exports = ArraySubForm;
