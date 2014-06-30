'use strict';
var _ = require('lodash-contrib'),
    Widgets = require('./widgets'),
    MPromise = require('mpromise'),
    EnumField = require('./fields').EnumField;

var widgetFormChoices = {};

module.exports = EnumField.extend({
    init: function (options) {
        if (!EnumField.registry.getModel(options.ref)) throw new ReferenceError('model `' + options.ref + '` not registered, ');
        this.ref = EnumField.registry.getModel(options.ref).model;
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
        } else if (options.socket) {
            options.widget = Widgets.AutocompleteWidget;
            options.widget_options.attrs = _.assign({'class': ['socket-select']}, options.attrs);
            options.pre_process = pre_process_for_autocomplete;
        } else {
            options.widget = options.widget || Widgets.RefWidget;
        }
        this.pre_process = options.pre_process || pre_process_for_ref;
        this._super(options, []);
    }
});


var pre_process_for_autocomplete = function () {
    var id = this.value;
    var widget = this.widget;
    widget.data['name'] = id || '';
    widget.data['modelname'] = this.ref.modelName;
    if (!id) {
        return MPromise.fulfilled();
    }

    var self = this;
    var query = Array.isArray(id) ? this.ref.find().where('_id').in(id) : this.ref.findById(id);
    var p = query.exec().then(function (doc) {
        if (doc) {
            widget.doc = doc;
            self.widget.data['initialname'] = doc.toString();
        }
        p.fulfill();
    });
    return p;
};


var pre_process_for_ref = function () {
    var p = new MPromise;
    var id = this.value;
    var widget = this.widget;

    var widgetChoices = widgetFormChoices[widget.refForm];
    if (!widgetChoices) {
        this.ref.find({}).limit(widget.limit).exec(function (err, objects) {
            if (err) throw err;
            widget.choices = [];
            for (var i = 0; i < objects.length; i++) {
                var label = objects[i].name || objects[i].title || objects[i].toString();
                if (typeof(label) == 'function') {
                    label = label.call(objects[i]);
                }
                widget.choices.push([objects[i].id, label]);
            }
            widgetFormChoices[widget.refForm] = widget.choices.slice(0);
            p.fulfill();
        });
    } else {
        widget.choices = widgetChoices.slice(0);
        return Promise.fulfilled();
    }

    return p;
};
