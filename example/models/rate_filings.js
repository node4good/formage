var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var factors = [ 'BI', 'PD', 'MP', 'UNBI', 'UNPD', 'CDW', 'Comp', 'Coll' ];

var schema = new mongoose.Schema({
    title: String,
    data: Types.Text,
    factors: factors.reduce(function(seed, f) {
        seed[f] = Boolean;
        return seed;
    }, {}),
    references: {
        carrier: { type: Types.ObjectId }, //, ref: 'carriers'
        filing_id: String,
        page_number: Number,
        table_number: { type: Number, default: 1 }
    }
});

var m = module.exports = mongoose.model('rate_filings', schema);
m.singular = 'Rate Filing';
m.static = {
    js: [ '/rate_filings.js' ]
};