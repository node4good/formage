var Widgets = require('./widgets');

module.exports = function (EnumField, getModel, ObjectId) {
    var RefField = EnumField.extend({
        init: function (options) {
            this.ref = getModel(options.ref);
            options = options || {};
            options.widget = options.widget || Widgets.RefWidget;
            options.widget_options = options.widget_options || {};
            options.widget_options.ref = options.widget_options.ref || this.ref;
            options.widget_options.limit = options.limit;
            this._super(options, []);
        },
        to_schema: function () {
            var schema = RefField.super_.prototype.to_schema.call(this);
            schema['type'] = ObjectId;
            schema['ref'] = this.options.ref;
            return schema;
        }
    });
    return RefField;
};
