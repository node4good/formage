var Widgets = require('./widgets');

module.exports = function (EnumField, getModel) {
    var RefField = EnumField.extend({
        init: function (options) {
            this.ref = getModel(options.ref);
            options.widget_options = options.widget_options || {};
            options.widget_options.ref = options.widget_options.ref || this.ref;
            options.widget_options.limit = options.limit;
            if (options.url && options.query) {
                options.widget_options.url = options.url;
                options.widget_options.data = options.widget_options.data || {};
                options.widget_options.data.data = encodeURIComponent(JSON.stringify({
                    model: options.ref,
                    query: options.query || '/__value__/i.test(this.name || this.title || this._id.toString())'
                }));
                options.widget = Widgets.AutocompleteWidget;
            }
            options.widget = options.widget || Widgets.RefWidget;
            this._super(options, []);
        }
    });
    return RefField;
};
