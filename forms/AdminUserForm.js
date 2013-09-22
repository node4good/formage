var formage = require('../index'),
    AdminForm = formage.AdminForm,
    widgets = formage.widgets,
    Users = formage.models.MongooseAdminUser,
    crypt = require('../utils/crypt');



exports.AdminUserForm = AdminForm.extend({
    init: function (request, options) {
        this._super(request, options, Users);
    },


    get_fields: function () {
        this._super();
        var fields = this.fields;
        delete fields['passwordHash'];
        this.fields['current_password'] = new fields.StringField({widget: widgets.PasswordWidget, label: 'Current Password'});
        this.fields['password'] = new fields.StringField({widget: widgets.PasswordWidget, label: 'New Password'});
        this.fields['password_again'] = new fields.StringField({widget: widgets.PasswordWidget, label: 'Again'});
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
                if (crypt.compareSync(data.current_password, self.instance.passwordHash)) {
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
            this.instance.passwordHash = crypt.encryptSync(this.data.password);
        this._super(callback);
    }
});
