'use strict';
if (!module.parent) console.error('Please don\'t call me directly.I am just the main app\'s minion.') || process.process.exit(1);

var widgets = require('./widgets'),
    async = require('async'),
	Class = require('sji'),
	_ = require('lodash'),
	path = require('path'),
	fs = require('fs'),
	util = require('util'),
    cloudinary = require('cloudinary'),
    formage = require('..');


exports.writer_to_string = function (writer, limit) {
    limit = limit || 256;
    var buff = new Buffer(limit);
    var pointer = 0;
    writer({write: function (str) {
        if (str.length + pointer > limit) {
            limit *= 2;
            var new_buff = new Buffer(limit);
            new_buff.write(buff.toString('utf8', 0, pointer));
            buff = new_buff;
        }
        pointer += buff.write(str, pointer);
    }});
    return buff.toString('utf8', 0, pointer);
};


exports.setAmazonCredentials = function (credentials) {
    try {
        var knox = require('knox');
        module.knox_client = knox.createClient(credentials);
    } catch (e) {
        console.log(e.message);
    }
};

exports.getKnoxClient = function () {
    return module.knox_client;
};

var global_counter = 0;



var BaseField = exports.BaseField = Class.extend({
    init: function (options) {
        options = options || {};
        this.options = options;
        this['default'] = options['default'];
        this.required = 'required' in options ? options.required : false;
        this.validators = options.validators || [];
        var widget_options = _.extend({}, options, options.widget_options);
        options.widget_options = widget_options;
        widget_options.attrs = options.attrs || {};
        widget_options.required = 'required' in widget_options ? widget_options.required : this.required;
        this.widget = new options.widget(widget_options);
        this.value = null;
        this.errors = [];
        this.name = '';
        this.label = options.label;
        this.head = this.widget.head;
    },
    to_schema: function () {
        var schema = {};
        if (this.required)
            schema['required'] = true;
        if ('default' in this)
            schema['default'] = this['default'];
        return schema;
    },
    get_label: function () {
        var label = this.label || this.name;
        var arr = label.split('_');
        for (var i = 0; i < arr.length; i++) {
            if (arr[i])
                arr[i] = arr[i][0].toUpperCase() + arr[i].substring(1);
        }
        return arr.join(' ');
    },
    render_label_str: function () {
        return exports.writer_to_string(this.render_label, 80);
    },
    render: function (res) {
        this.widget.name = this.name;
        this.widget.value = this.value;
        this.widget.render(res);
        return this;
    },
    render_str: function () {
        return exports.writer_to_string(this.render, 1024);
    },
    render_label: function (res) {
        var class_str = 'field_label' + (this.widget.attrs.required ? ' required_label' : ' optional_label');
        res.write('\n<label for="id_' + this.name + '" class="' + class_str + '">' + this.get_label() + '</label>\n');
    },
    render_with_label: function (res) {
        res.write('\n<div class="field">\n');
        this.render_label(res);
        this.render(res);
        this.render_error(res);
        res.write('\n</div>\n');
    },
    render_with_label_str: function () {
        return exports.writer_to_string(this.render_with_label, 1024);
    },
    render_error: function (res) {
        if (this.errors && this.errors.length) {
            for (var i = 0; i < this.errors.length; i++) {
                res.write('\n<span class="error">');
                res.write(this.errors[i] + '');
                res.write('</span>\n');
            }
        }
    },
    set: function (value) {
        this.value = arguments.length === 0 ? this['default'] : value;
        return this;
    },
    clean_value: function (req, callback) {
        if (String(this.value) === '')
            this.value = null;
        if ((this.value === null || this.value === []) && this.required)
            this.errors.push('this field is required');
        for (var i = 0; i < this.validators.length; i++) {
            var result = this.validators[i](this.value);
            if (result !== true) {
                this.errors.push(result);
            }
        }
        callback(null);
        return this;
    },
    pre_render: function (callback) {
        this.widget.name = this.name;
        this.widget.value = this.value;
        this.widget.pre_render(callback);
    }
});


var StringField = exports.StringField = BaseField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || widgets.TextWidget;
        this._super(options);
        this.type = 'string';
    },
    to_schema: function () {
        var schema = StringField.super_.prototype.to_schema.call(this);
        schema['type'] = String;
        return schema;
    }
});


var ReadonlyField = exports.ReadonlyField = BaseField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || widgets.HiddenWidget;
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
        options.widget = options.widget || widgets.CheckboxWidget;
        this._super(options);
    },
    to_schema: function () {
        var schema = BooleanField.super_.prototype.to_schema.call(this);
        schema['type'] = Boolean;
        return schema;
    },
    clean_value: function (req, callback) {
        this.value = !!(req.body[this.name] && req.body[this.name] !== '');
        this._super(req, callback);
        return this;
    }
});


var EnumField = exports.EnumField = BaseField.extend({
    init: function (options) {
        options = options || {};
        this.choises = options.enum || options.choises;
        options.widget = options.widget || widgets.ChoicesWidget;
        options.widget_options = options.widget_options || {};
        options.widget_options.choices = options.widget_options.choices || this.choises;
        this._super(options);
    },
    to_schema: function () {
        var schema = this._super();
        schema['type'] = String;
        schema['enum'] = this.choices;
        return schema;
    },
    clean_value: function (req, callback) {
        if (this.value === '')
            this.value = null;
        this._super(req, callback);
        return this;
    }
});


var EnumMultiField = exports.EnumMultiField = EnumField.extend({
    init: function (options) {
        options = options || {};
        options.attrs = options.attrs || {};
        options.attrs.multiple = typeof(options.attrs.multiple) === 'undefined' ? 'multiple' : options.attrs.multiple;
        this._super(options);
    },
    clean_value: function (req, callback) {
        if (!this.value)
            this.value = [];
        if (!Array.isArray(this.value))
            this.value = [this.value];
        this._super(req, callback);
        return this;
    }
});


var NumberField = exports.NumberField = StringField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || widgets.NumberWidget;
        options.widget_options = options.widget_options || {};
        options.widget_options.min = options.widget_options.min === null ? options.min : options.widget_options.min;
        options.widget_options.max = options.widget_options.max === null ? options.max : options.widget_options.max;
        options.widget_options.step = options.widget_options.step === null ? options.step : options.widget_options.step;

        this._super(options);
    },
    to_schema: function () {
        var schema = this._super();
        schema['type'] = Number;
        return schema;
    },
    clean_value: function (req, callback) {
        if (this.value === null && this.value === '' && !this.required)
            this.value = null;
        else {
            try {
                this.value = Number(this.value);
            } catch (e) {
                console.log(e);
                this.errors.push('value ' + this.value + ' is not a number');
                this.value = null;
            }
        }
        this._super(req, callback);
        return this;
    }
});


var DateField = exports.DateField = BaseField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || widgets.DateWidget;
        this._super(options);
    },

    to_schema: function () {
        var schema = this._super();
        schema['type'] = Date;
        return schema;
    }
});

var TimeField = exports.TimeField = BaseField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || widgets.TimeWidget;
        this._super(options);
    },

    to_schema: function () {
        var schema = this._super();
        schema['type'] = String;
        return schema;
    }
});



var FileField_ = exports.FileField = BaseField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || widgets.FileWidget;
        //noinspection JSUnresolvedVariable
        this.directory = options.upload_to || path.join(__dirname, '..', '..', 'assets', 'cdn');
        this._super(options);
    },
    to_schema: function () {
        return {
            url: String,
            name: String,
            size: Number
        };
    },
    create_filename: function (file) {
        var ext = path.extname(file);
        var basename = path.basename(file, ext);
        var unique = (Date.now() + global_counter++) % 1000;
        var filename = util.format('%s_%d.%s', basename, unique, ext);
        return filename;
    },
    clean_value: function (req, callback) {
        var self = this;
        var base = self._super;
        self.value = self.value || {};
        function on_finish() {
            base.call(self, req, callback);
        }

        function handleDelete(cbk){
            if(module.knox_client){
                // Remove file from S3 Bucket
                self.value = null;
                if(cbk)
                    cbk();
            }
            else
                fs.unlink(self.directory + self.value.path, cbk);
            self.value = null;
        }

        function handle_upload(err) {
            if (err) console.trace(err);
            if (!req.files || !req.files[self.name] || !req.files[self.name].name) {
                on_finish();
                return;
            }
            var uploaded_file = req.files[self.name];
            // copy file from temp location
            if (module.knox_client) {
                var stream = fs.createReadStream(uploaded_file.path);
                var filename_to_upload = '/' + self.create_filename(uploaded_file.name);
                module.knox_client.putStream(stream, filename_to_upload, {'Content-Length': uploaded_file.size}, function (err, res) {
                    if (err) {
                        //noinspection JSUnresolvedVariable
                        if (err.socket && err.socket._httpMessage) {
                            res = err;
                        } else {
                            console.error('upload to amazon failed', err.stack || err);
                            callback(err);
                            return;
                        }
                    }

                    fs.unlink(uploaded_file.path);
                    //noinspection JSUnresolvedVariable
                    var http_message = res.socket._httpMessage;
                    var url = http_message.url.replace(/https:/, 'http:');
                    self.value = {
                        path: uploaded_file.name,
                        url: url,
                        size: uploaded_file.size};
                    on_finish();
                });
            } else {
                var input_stream = fs.createReadStream(uploaded_file.path);
                var filename = self.create_filename(uploaded_file);
                var output_stream = fs.createWriteStream(path.join(self.directory, filename));
                input_stream.pipe(output_stream);
                output_stream.on("end", function (err) {
                    if (err) console.trace(err);
                    fs.unlink(uploaded_file.path, function (err) {
                        if (err) console.trace(err);
                        self.value = {
                            path: filename,
                            url: '/cdn/' + filename,
                            size: uploaded_file.size
                        };
                        on_finish();
                    });
                });
            }
        }

        // delete old file is needed/requested
        if (self.value && self.value.path && (req.body[self.name + '_clear'] || (req.files[self.name] && req.files[self.name].name))) {
            handleDelete(handle_upload);
        }
        else {
            handle_upload();
        }

    }
});


var FilepickerField = exports.FilepickerField = BaseField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || widgets.FilepickerWidget;
        this._super(options);
    },
    to_schema: function () {
        return {
            url: String,
            filename: Number,
            mimetype: String,
            size: Number,
            isWriteable: Boolean
        }
    },
    clean_value: function (req, callback) {
        this.value = this.value || {};
        if (_.isString(this.value)) this.value = JSON.parse(this.value);
        if (req.body[this.name + '_clear']) {
            this.value = null;
        }
        callback(null);
    }
});


var PictureField = exports.PictureField = BaseField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || widgets.PictureWidget;
        this._super(options);
    },
    to_schema: function () {
        return {
            public_id: String,
            version: Number,
            signature: String,
            width: Number,
            height: Number,
            format: String,
            resource_type: String,
            url: String,
            secure_url: String,
            eager: [Object],
            original_name: String,
            original_size: Number
        }

    },
    clean_value: function (req, callback) {
        var self = this;
        self.value = self.value || {};
        if (_.isString(self.value)) self.value = JSON.parse(String(self.value));

        if (self.value && self.value.url && req.body[self.name + '_clear']) {
            self.value = null;
        }
        var upload_input_name = self.name + '_file';
        if (req.files && req.files[upload_input_name] && req.files[upload_input_name].name) {
            cloudinary.uploader.upload(req.files[upload_input_name].path, function (result) {
                result.original_name = req.files[upload_input_name].name;
                result.original_size = req.files[upload_input_name].size;
                self.value = result;
                callback(null);
            });
        } else
            callback(null);
    }
});


var GeoPointField = exports.GeoPointField = BaseField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || widgets.MapWidget;
        this._super(options);
    },
    clean_value: function (req, callback) {
        var str = this.value;
        var parts = str.split(',');
        if (parts.length !== 2 || parts[0] === '' || parts[1] === '')
            this.value = null;
        else {
            this.value = { geometry: { lat: Number(parts[0]), lng: Number(parts[1])}};
            if (this.name + '_address' in req.body) {
                this.value.address = req.body[this.name + '_address'];
            }
        }
        this._super(req, callback);
    }
});


var MixedField = exports.MixedField = BaseField.extend({
    init: function (options) {
        options = options || {};
        options.widget = options.widget || widgets.TextAreaWidget;
        this._super(options);
    },
    clean_value: function (req, callback) {
        var str = String(this.value);
        try {
            this.value = JSON.parse(str);
        }
        catch (ex) {
            console.error('not a json', ex);
        }
        this._super(req, callback);
    },
    render: function (res) {
        this.value = JSON.stringify(this.value);
        this._super(res);
    }
});
