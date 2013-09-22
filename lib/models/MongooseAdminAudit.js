'use strict';
module.exports = function (mongoose) {
    var schema = new mongoose.Schema({
        created: {type: Date, required: true, 'default': new Date},
        user: {type: mongoose.Schema.ObjectId, required: true},
        model: String,
        collectionName: String,
        documentId: mongoose.Schema.ObjectId,
        action: {type: String, required: true},
        note: String
    });
    var model = mongoose.model('_FormageAudit_', schema);

    schema.methods.logActivity = function (user, modelName, collectionName, documentId, action, note, callback) {
        model.create({
            user: user.fields._id,
            model: modelName,
            collectionName: collectionName,
            documentId: documentId,
            action: action,
            note: note
        }, function (err, entry) {
            if (err) throw err;
            callback(null, entry);
        });
    };


    return model;
};
