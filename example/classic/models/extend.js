//noinspection JSUnresolvedVariable
var mongoose = require('mongoose'),
    MongooseSchema = mongoose.Schema,
    MongooseTypes = mongoose.Types,
    util = require('util'),
    formage = require('../../../.');


var ReversedWidget = formage.widgets.TextWidget.extend({
    render: function (res) {
        this.value = (this.value || '').split("").reverse().join("");
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


var TwoDWidget = formage.widgets.TextWidget.extend({
    render: function (res) {
        var value = this.value || {};
        var lat = value.lat;
        var lng = value.lng;
        var name = this.name;
        this.name = name + '_lat';
        this.value = lat;
        this._super(res);
        this.name = name + '_lng';
        this.value = lng;
        this._super(res);
    }
});


var TwoDField = formage.fields.StringField.extend({
    init: function (options) {
        options = options || {};
        options.widget = TwoDWidget;
        this._super(options);
    },
    clean_value: function (req, callback) {
        var lat = Number(req.body[this.name + '_lat']);
        var lng = Number(req.body[this.name + '_lng']);
        this.value = { lat: lat, lng: lng};
        this._super(req, callback);
    }
});
var TwoD = function TwoD(path, options) {
    TwoD.super_.call(this, path, options);
};
util.inherits(TwoD, MongooseSchema.Types.Mixed);
MongooseTypes.TwoD = Object;
MongooseSchema.Types.TwoD = TwoD;


var schema = new MongooseSchema({
    reversed: { type: String, formageField: ReversedField},
    two_d: { type: TwoD, formageField: TwoDField}
});
var model = module.exports = mongoose.model('extend', schema);

var CustomForm = function () {
    this.init.apply(this, arguments);
};
util.inherits(CustomForm, formage.AdminForm);
CustomForm.prototype.render = function (res, options) {
    formage.AdminForm.prototype.render.call(this, res, options);
    res.write(
        "<div class='watermark'>Extending with Custom Form</div>" +
            "<style>.watermark {position: absolute; top: 50%; opacity: 0.25; font-size: 3em; width: 50%; text-align: center; z-index: 1000; transform:rotate(45deg); -ms-transform: rotate(45deg); -webkit-transform: rotate(45deg); }</style>"
    );
};

model.formage = {
    form: CustomForm
};
