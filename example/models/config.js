var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types,
    AdminForm = require('../../AdminForm').AdminForm;

var schema = new mongoose.Schema({
    title: { type: String, required: true, label: 'כותרת'},
    email: { type: String, required: true, label: 'דוא"ל'},
    footer: {
        social: [
            {
                picture: { type: Types.Picture, label: 'תמונה'},
                url: { type: String, label: 'קישור'}
            }
        ],
        links: [
            {
                text: { type: String, label: 'טקסט'},
                url: { type: String, label: 'קישור'}
            }
        ]
    },
    mail_sent: {
        title: { type: String, require: true, label: 'כותרת'},
        text: { type: Types.Html, label: 'תוכן'}
    }
});


var model = module.exports = mongoose.model('config', schema);
model.single = true;
model.label = 'הגדרות';
model.formage = {
    section: 'Configuration',
    form: AdminForm.extend({
        render: function (res, options) {
            this._super(res, options);
            res.write(
                "<div class='watermark'>Custom Form Code</div>" +
                "<style>.watermark {position: absolute; top: 50%; opacity: 0.25; font-size: 3em; width: 50%; text-align: center; z-index: 1000; transform:rotate(-45deg); -ms-transform: rotate(-45deg); -webkit-transform: rotate(-45deg); }</style>"
            );
        }
    })
};
