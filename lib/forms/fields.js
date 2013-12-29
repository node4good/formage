'use strict';
var _ = require('lodash-contrib'),
    Widgets = require('./widgets'),
    Class = require('./sji'),
    util = require('util'),
    Promise = require('mpromise');

var GOOGLE_MAPS_API_KEY = process.env['GOOGLE_MAPS_API_KEY'] || 'AIzaSyDa0sb1zqO-uJyE0ZMgSE0vYD8ugFTc32E';


var BaseField = exports.BaseField = Class.extend({
    init: function (options) {
        options = _.defaults(options, {validators: [], attrs: {}});
        this.name = options.name;
        this.value = null;
        this.errors = [];
        this.default_value = options['default'];
        this.required = options.required;
        this.validators = options.validators;
        this.db_path = options.db_path;
        this.hirarchy_name = this.db_path || '__self__';
        this.label = options.label;

        var Widget = options.widget;
        if (!Widget) return;
        if (typeof Widget === 'string') Widget = Widgets[Widget];
        var widget_options = _.extend({}, options, options.widget_options);
        this.widget = new Widget(widget_options);
    },
    get_label: function () {
        var label = this.label;
        var arr = label.split('_');
        for (var i = 0; i < arr.length; i++) {
            if (arr[i])
                arr[i] = arr[i][0].toUpperCase() + arr[i].substring(1);
        }
        return arr.join(' ');
    },
    render: function (res) {
        this.widget.name = this.name;
        this.widget.value = this.value;
        this.widget.render(res);
        return this;
    },
    render_label: function (res) {
        var class_str = 'field_label' + (this.required ? ' required_label' : ' optional_label');
        res.write('<label for="id_' + this.name + '" class="' + class_str + '">' + this.get_label() + '</label>\n');
    },
    render_with_label: function (res) {
        res.write('<div class="field">\n');
        this.render_label(res);
        this.render(res);
        this.render_error(res);
        res.write('</div>\n');
    },
    render_error: function (res) {
        if (this.errors && this.errors.length) {
            for (var i = 0; i < this.errors.length; i++) {
                res.write('<span class="error">');
                res.write(this.errors[i] + '');
                res.write('</span>\n');
            }
        }
    },
    bind: function (data) {
        this.value = arguments.length ? data : this.default_value;
    },
    unbind: function () {
        this.value = this.data[this.hirarchy_name];
        var widget = this.widget;
        widget.name = this.name;
        widget.value = this.value;
    },
    validate: function () {
        var p = new Promise();
        if (this.required && (this.value === null || this.value === [] || this.value === undefined))
            this.errors.push('this field is required');
        for (var i = 0; i < this.validators.length; i++) {
            var result = this.validators[i](this.value);
            if (result !== true) {
                this.errors.push(result);
            }
        }
        p.fulfill();
        return p;
    },
    pre_process: function () {
        var p = new Promise();
        p.fulfill();
        return p;
    },
    get_value: function () {
        return this.value;
    }
});


var StringField = exports.StringField = BaseField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || Widgets.TextWidget;
        this._super(options);
        this.type = 'string';
    }
});


var ReadonlyField = exports.ReadonlyField = BaseField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || Widgets.HiddenWidget;
        this._super(options);
    },
    render_label: function () {},
    render_with_label: function (res) {
        this.render(res);
    }
});


var BooleanField = exports.BooleanField = BaseField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || Widgets.CheckboxWidget;
        this._super(options);
    },
    unbind: function () {
        this.value = false;
        this._super();
        this.value = Boolean(this.value);
    }
});


var EnumField = exports.EnumField = BaseField.extend({
    init: function (options) {
        options = options || {};
        this.choises = options.enum || options.choises;
        options.widget = options.widget || Widgets.ComboBoxWidget;
        options.widget_options = options.widget_options || {};
        options.widget_options.choices = options.widget_options.choices || this.choises;
        this._super(options);
    },
    unbind: function () {
        this._super();
        if (!this.value) this.value = undefined;
    }
});


var EnumMultiField = exports.EnumMultiField = EnumField.extend({
    init: function (options) {
        options = options || {};
        options.attrs = options.attrs || {};
        options.attrs.multiple = typeof(options.attrs.multiple) === 'undefined' ? 'multiple' : options.attrs.multiple;
        this._super(options);
    },
    unbind: function () {
        this._super();
        if (!this.value)
            this.value = [];
        if (!Array.isArray(this.value))
            this.value = [this.value];
    }
});


var NumberField = exports.NumberField = StringField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || Widgets.NumberWidget;
        options.widget_options = options.widget_options || {};
        options.widget_options.min = options.widget_options.min === null ? options.min : options.widget_options.min;
        options.widget_options.max = options.widget_options.max === null ? options.max : options.widget_options.max;
        options.widget_options.step = options.widget_options.step === null ? options.step : options.widget_options.step;

        this._super(options);
    },
    unbind: function () {
        this._super();
        if (this.value === undefined || this.value === null || this.value === '') {
            this.value = null;
        } else {
            var dirtyVal = this.value;
            this.value = Number(this.value);
            if (Number.isNaN(this.value)) {
                this.errors.push('value ' + dirtyVal + ' is not a number');
                this.value = null;
            }
        }
    }
});


var DateField = exports.DateField = BaseField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || Widgets.DateWidget;
        this._super(options);
    },
    unbind: function () {
        this._super();
        if (this.value === '') {
            this.value = null;
    }
    }
});


var TimeField = exports.TimeField = DateField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || Widgets.TimeWidget;
        this._super(options);
    }
});


/*
{
 *  "isWriteable" : true,
 *  "size" : 9751,
 *  "mimetype" : "image/jpeg",
    "filename" : "4as.jpg",
    "url" : "http://featherfiles.aviary.com/2013-11-21/lqe7dik7cphyefe9/0de642e5c11f4139bd8a9de129d40f02.png"
}
*/
var FilepickerField = exports.FilepickerField = BaseField.extend({
    init: function (options) {
        options.widget = options.widget || Widgets.FilepickerWidget;
        this._super(options);
        this.header_lines = [];
        var FILEPICKER_API_KEY = options.FILEPICKER_API_KEY ||  process.env.FILEPICKER_API_KEY;
        if (FILEPICKER_API_KEY) {
            this.header_lines.push('<script src="//api.filepicker.io/v1/filepicker.js"></script>');
            this.header_lines.push('<script>filepicker.setKey("' + FILEPICKER_API_KEY + '");</script>');
        }
        var AVIARY_API_KEY = options.AVIARY_API_KEY ||  process.env.AVIARY_API_KEY;
        if (AVIARY_API_KEY) {
            this.header_lines.push('<script>var AVIARY_API_KEY="' + AVIARY_API_KEY + '";</script>');
            this.header_lines.push('<script src="//feather.aviary.com/js/feather.js"></script>');
        }

    },
    unbind: function () {
        this._super();
        this.value = this.value || {};
        if (_.isString(this.value)) this.value = JSON.parse(this.value);
        if (this.value[this.hirarchy_name + '_clear']) {
            this.value = null;
        }
    }
});


/*
{
    "original_size" : 222783,
    "original_name" : "Birthday_mail.jpg",
    "secure_url" : "https://res.cloudinary.com/ho0xbnxzd/image/upload/v1383841786/n8mxwmmjvxpvzglvhwjp.png",
    "url" : "http://res.cloudinary.com/ho0xbnxzd/image/upload/v1383841786/n8mxwmmjvxpvzglvhwjp.png",
    "etag" : "\"98ecc6adbdc8edd3d0adb5f16c24ee9a\"",
    "type" : "upload",
    "bytes" : 222783,
    "created_at" : "2013-11-07T16:29:46Z",
    "resource_type" : "image",
    "format" : "png",
    "height" : 576,
    "width" : 1008,
    "signature" : "0c2585260ad562ce52aba390f6dc493601721987",
    "version" : 1383841786,
    "public_id" : "n8mxwmmjvxpvzglvhwjp"
}
*/
var PictureField = exports.PictureField = BaseField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || Widgets.PictureWidget;
        this._super(options);
        this.file = null;
    },
    unbind: function () {
        this._super();
        var data = this.value || 'null';
        this.value = JSON.parse(data);

        if (this.value && this.value.url && this.data[this.hirarchy_name + '_clear']) {
            this.value = null;
        }

        this.file = this.data[this.hirarchy_name + '_file'];
    },
    pre_process: function () {
        var self = this;
        var uploaded = this.file;
        var p = new Promise();
        if (!(uploaded && uploaded.name)) return p.fulfill();
        require('cloudinary').uploader.upload(uploaded.path, function (result) {
            if (result.error) {
                self.errors.push(result.error);
                throw new Error(result.error.message);
            }
            result.original_name = uploaded.name;
            result.original_size = uploaded.size;
            self.value = result;
            p.fulfill();
        });
        return p;
    }
});


var GeoPointField = exports.GeoPointField = BaseField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || Widgets.MapWidget;
        var lang = options.lang || options.widget.lang || 'en';
        this.header_lines = ['<script src="//maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&language=' + lang + '&libraries=places&key=' + GOOGLE_MAPS_API_KEY + '"></script>'];
        this._super(options);
    },
    unbind: function () {
        this._super();
        var str = _.isString(this.value) ? this.value : '';
        var parts = str.split(',');
        if (parts.length !== 2 || parts[0] === '' || parts[1] === '') {
            this.value = null;
        } else {
            this.value = { geometry: { lat: Number(parts[0]), lng: Number(parts[1])} };
            if (this.hirarchy_name + '_address' in this.data) {
                this.value.address = this.data[this.hirarchy_name + '_address'];
            }
        }
    }
});


var MixedField = exports.MixedField = BaseField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || Widgets.TextAreaWidget;
        this._super(options);
    },
    unbind: function () {
        this._super();
        if (this.value === '' || this.value === undefined || this.value === null)
            this.value = 'null';
        try {
            this.value = JSON.parse(this.value);
        } catch (err) {
            this.errors.push(err);
        }
    },
    render: function (res) {
        if (this.value)
            this.value = JSON.stringify(this.value);
        this._super(res);
    }
});
