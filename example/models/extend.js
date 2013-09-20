//noinspection JSUnresolvedVariable
var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types,
    formage = require('../../');


var ReversedWidget = formage.widgets.TextWidget.extend({
    render: function (res) {
        this.value = this.value.split("").reverse().join("");
        this.attrs.style = '-moz-transform: scale(-1, 1); -webkit-transform: scale(-1, 1); transform: scale(-1, 1);';
        this._super(res);
    }
});


var ReversedField = formage.fields.StringField.extend({
    init: function (options) {
        options = options || {};
        options.widget = ReversedWidget;
        this._super(options);
    },
    clean_value: function (req, callback) {
        this.value = this.value.split("").reverse().join("");
        this._super(req, callback);
    }
});


var schema = new mongoose.Schema({
    reversed: { type: String, formageField: ReversedField}
});


var model = module.exports = mongoose.model('extend', schema);
model.formage = {
    form: formage.AdminForm.extend({
        render: function (res, options) {
            this._super(res, options);
            res.write(
                "<div class='watermark'>Extending with Custom Form</div>" +
                "<style>.watermark {position: absolute; top: 50%; opacity: 0.25; font-size: 3em; width: 50%; text-align: center; z-index: 1000; transform:rotate(45deg); -ms-transform: rotate(45deg); -webkit-transform: rotate(45deg); }</style>"
            );
        }
    })
};
