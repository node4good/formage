'use strict';
if (!module.parent) console.error('Please don\'t call me directly.I am just the main app\'s minion.') || process.process.exit(1);

var forms = require('./forms')
    , mongoose = require.main.require('mongoose')
    , fields = forms.fields
    , widgets = forms.widgets
    , MongooseForm = forms.forms.MongooseForm
    , jest = require('jest');

var api_loaded = false;
var api_path;

//noinspection JSHint
var _escaper = /[-[\]{}()*+?.,\\^$|#\s]/g;


exports.AdminForm = MongooseForm.extend({
    init: function (request, options, model) {
        this._super(request, options, model);

        // no need for these, as they are already in formage-admin layout.jade
//        this.static.js.push('/js/forms.js');
//        this.static.js.push('/js/document.js');
//        this.static.css.push('/css/forms.css');
    },


    scanFields: function (form_fields) {
        var self = this;
        Object.keys(form_fields).forEach(function (key) {
            var value = form_fields[key];
            if (value instanceof fields.RefField) {
                if ((value.options.url || api_loaded) && value.options.query) {
                    value.options.widget_options.url = value.options.url || api_path;
                    value.options.widget_options.data = value.options.widget_options.data || {};
                    value.options.widget_options.data.data = encodeURIComponent(JSON.stringify({
                        model: value.options.ref,
                        query: value.options.query || '/__value__/i.test(this.name || this.title || this._id.toString())'
                    }));
                    value.widget = new widgets.AutocompleteWidget(value.options.widget_options);
                }
            }
            else if (value instanceof fields.EnumField) {
                value.widget = new widgets.ComboBoxWidget(value.options.widget_options);
            }
            else if (value instanceof fields.ListField) {
                self.scanFields(value.fields);
            }
        });
    },


    get_fields: function () {
        this._super();
        this.scanFields(this.fields);
    }
});


var _JestAdminResource = jest.Resource.extend({
    init: function () {
        this._super();

        this.fields = {
            value: null,
            label: null
        };

        this.allowed_methods = ['get'];

        this.filtering = {
            data: null,
            query: null
        };
    },

    get_objects: function (req, filters, sorts, limit, offset, callback) {
        var data = JSON.parse(filters.data);
        var model = mongoose.model(data.model);
        var escaped_filters = filters.query.replace(_escaper, "\\$&");
        var query = data.query.replace(/__value__/g, escaped_filters);
        model.find({$where: query}, function (err, results) {
            if (results) {
                if (results.objects) {
                    results = results.objects;
                }
                results = results.map(function (object) { return { id: object.id, text: object.toString() }; });
            }
            callback(err, results);
        });
    }
});


exports.loadApi = function (app, path) {
    var api = new jest.Api(path || 'admin_api', app);
    api.register('ref', new _JestAdminResource());
    api_path = '/' + api.path + 'ref';
    api_loaded = true;
};
