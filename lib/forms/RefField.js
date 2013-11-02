var Widgets = require('./widgets');

module.exports = function (EnumField, getModel, ObjectId) {
    var RefField = EnumField.extend({
        init: function (options) {
            this.ref = getModel(options.ref);
            options.widget = options.widget || Widgets.RefWidget;
            options.widget_options = options.widget_options || {};
            options.widget_options.ref = options.widget_options.ref || this.ref;
            options.widget_options.limit = options.limit;
            this._super(options, []);
        }
    });
    return RefField;
};
