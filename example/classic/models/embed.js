//noinspection JSUnresolvedVariable
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  SchemaTypes = Schema.Types;


var schema = new mongoose.Schema({
  embeded: {
    name1: String,
    list1: [
      {
        name2: String,
        embeded2: {
          name3: String,
          list3: [
            {
              name4: String,
              embeded4: {
                nested_string5: { type: String },
                nested_string_req5: { type: String, required: true },
                list5: [Number],
                pic: SchemaTypes.Picture,
                pics: [SchemaTypes.Picture],
                refs: [
                  { type: SchemaTypes.ObjectId, ref: 'pages' }
                ]
              }
            }
          ]
        }
      }
    ]
  }
});
var model = module.exports = mongoose.model('embed', schema);
