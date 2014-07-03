//noinspection JSUnresolvedVariable
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    SchemaTypes = Schema.Types;


var schema = new mongoose.Schema({
    embeded: new Object({
        name1: String,
        list1: new Array({
            name2: String,
            embeded2: new Object({
                name3: String,
                list3: new Array({
                    name4: String,
                    embeded4: new Object({
                        nested_string5: { type: String },
                        nested_string_req5: { type: String, required: true },
                        list5: [Number],
                        refs: new Array({ type: SchemaTypes.ObjectId, ref: 'pages' })
                    })
                })
            })
        })
    })
});
module.exports = mongoose.model('embed', schema);
