var Widgets = require('./widgets'),
    Promise = require('mpromise'),
    EnumField = require('./fields').EnumField;

module.exports = function (getModel) {
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
                options.pre_process = pre_process_for_autocomplete;
            } else
            options.widget = options.widget || Widgets.RefWidget;
            this.pre_process = options.pre_process || pre_process_for_ref;
            this._super(options, []);
        }
    });
    return RefField;
};


function pre_process_for_autocomplete() {
    var id = this.value;
    var widget = this.widget;
    widget.data['name'] = id || '';
    var p = new Promise;
    if (!id) {
        p.fulfill();
        return p;
    }

    var query = Array.isArray(id) ? this.ref.find().where('_id').in(id) : this.ref.findById(id);
    query.exec(function (err, doc) {
        if (err) throw err;
        if (doc) {
            widget.doc = doc;
        }
        p.fulfill();
    });
    return p;
}


function pre_process_for_ref() {
    var p = new Promise;
    var widget = this.widget;
    this.ref.find({}).limit(widget.limit).exec(function (err, objects) {
        if (err) throw err;
        widget.choices = [];
        for (var i = 0; i < objects.length; i++) {
            var label = objects[i].name || objects[i].title || objects[i].toString;
            if (typeof(label) == 'function') {
                label = label.call(objects[i]);
            }
            widget.choices.push([objects[i].id, label]);
        }
        p.fulfill();
    });
    return p;
}

