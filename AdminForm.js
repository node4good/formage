'use strict';
if (!module.parent) console.error('Please don\'t call me directly.I am just the main app\'s minion.') || process.process.exit(1);

var forms = require('./forms')
    , mongoose = require.main.require('mongoose')
    , fields = forms.fields
    , widgets = forms.widgets
    , MongooseForm = forms.forms.MongooseForm;

// Lazy load crypt
var crypt = function () {return require('./models/mongoose_admin_user').crypt;};

var api_loaded = false;
var api_path;

//noinspection JSHint
var _escaper = /[-[\]{}()*+?.,\\^$|#\s]/g;


var AdminForm = exports.AdminForm = MongooseForm.extend({
    init: function (request, options, model) {
        this._super(request, options, model);
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


exports.AdminUserForm = AdminForm.extend({
    init: function (request, options) {
        this._super(request, options, mongoose.model('_MongooseAdminUser'));
    },


    get_fields: function () {
        this._super();
        var fields = this.fields;
        delete fields['passwordHash'];
        this.fields['current_password'] = new forms.fields.StringField({widget: forms.widgets.PasswordWidget, label: 'Current Password'});
        this.fields['password'] = new forms.fields.StringField({widget: forms.widgets.PasswordWidget, label: 'New Password'});
        this.fields['password_again'] = new forms.fields.StringField({widget: forms.widgets.PasswordWidget, label: 'Again'});
        //noinspection JSUnresolvedVariable
        this.fieldsets[0].fields = ['username', 'is_superuser', 'permissions', 'current_password', 'password', 'password_again'];
        return fields;
    },


    is_valid: function (callback) {
        var self = this;
        this._super(function (err, result) {
            if (err || !result) return callback(err, result);
            var data = self.data || {current_password: '', password_again: 'x'};
            if (data.password) {
                if (crypt().compareSync(data.current_password, self.instance.passwordHash)) {
                    if (data.password != data.password_again) {
                        self.errors['password_again'] = self.fields['password_again'].errors = ['typed incorrectly'];
                    }
                } else {
                    self.errors['current_password'] = self.fields['current_password'].errors = ['Password incorrect'];
                }
            } else {
                delete data.password;
                delete data.current_password;
                delete data.password;
            }
            var hasErrors = Object.keys(self.errors).length;
            return callback(null, !hasErrors);
        });
    },


    actual_save: function (callback) {
        if (this.data.password)
            this.instance.passwordHash = crypt().encryptSync(this.data.password);
        this._super(callback);
    }
});



exports.loadApi = function () {
    var msg = (new Error).stack.split('\n')[1];
    console.error("[Deprecated] There's no need for .loadApi%s", msg);
};
