'use strict';
const _ = require('lodash-contrib');
const Widgets = require('./widgets');
const EnumField = require('./fields').EnumField;

const RefField = EnumField.extend({
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
            options.pre_process = pre_process_for_auto_complete;
        } else if (options.socket) {
            options.widget = Widgets.AutocompleteWidget;
            options.widget_options.attrs = _.assign({class: ['socket-select']}, options.attrs);
            options.pre_process = pre_process_for_auto_complete;
        } else {
            options.widget = options.widget || Widgets.RefWidget;
        }
        this.pre_process = options.pre_process || pre_process_for_ref;
        this._super(options, []);
    }
});

/** @memberof RefField# */
function pre_process_for_auto_complete() {
    let id = this.value;
    const widget = this.widget;
    widget.data['name'] = id || '';
    widget.data['modelname'] = this.ref.modelName;
    if (!id) {
        return Promise.resolve();
    }

    const self = this;
    const query = Array.isArray(id) ? this.ref.find().where('_id').in(id) : this.ref.findById(id);
    return query.exec().then(function (doc) {
        if (doc) {
            widget.doc = doc;
            self.widget.data['initialname'] = doc.toString();
        }
    });
}


/** @memberof RefField# */
function pre_process_for_ref() {
    const widget = this.widget;
    const ref = this.ref;
    return ref.find({})
        .limit(widget.limit)
        .exec()
        .then(objects => {
            widget.choices = [];
            for (let i = 0; i < objects.length; i++) {
                let label = objects[i].name || objects[i].title || objects[i].toString;
                if (typeof(label) === 'function') {
                    label = label.call(objects[i]);
                }
                widget.choices.push([objects[i].id, label]);
            }
        });
}


module.exports = RefField;
