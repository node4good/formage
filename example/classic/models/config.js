//noinspection JSUnresolvedVariable
var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var schema = new mongoose.Schema({
    title: { type: String, label: 'כותרת'},
    footer: {
        links: [
            {
                text: { type: String, label: 'טקסט'},
                url: { type: String, label: 'קישור'}
            }
        ]
    }
});


schema.formage = {
    label: 'הגדרות',
    is_single: true,
    section: 'Configuration'
};
var model = module.exports = mongoose.model('config', schema);
