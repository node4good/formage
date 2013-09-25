module.exports = function (formage) {
    var RefField = formage.fields.EnumField.extend({
        init: function (options) {
            this.ref = formage.getModel(options.ref);
            options = options || {};
            options.widget = options.widget || formage.widgets.RefWidget;
            options.widget_options = options.widget_options || {};
            options.widget_options.ref = options.widget_options.ref || this.ref;
            options.widget_options.limit = options.limit;
            this._super(options, []);
        },
        to_schema: function () {
            var schema = RefField.super_.prototype.to_schema.call(this);
            schema['type'] = formage.mongoose.Schema.ObjectId;
            schema['ref'] = this.options.ref;
            return schema;
        }
    });
    return RefField;
};
