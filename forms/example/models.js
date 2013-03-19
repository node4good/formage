var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.ObjectId;

module.exports = {
    Book: mongoose.model('Book', new mongoose.Schema({
        name: String,
        pages: { type: Number, min: 14, max: 20000},
        published_at: Date,
        author: {type: ObjectId, ref: 'Author'},
        genre: {type: String, enum: ['Novel', 'Science fiction']}
    })),

    Author: mongoose.model('Author', new mongoose.Schema({
        name: {first: String, last: String},
        likes: [
            {book: {type: ObjectId, ref: 'Book'}, how: Number}
        ]
    }))
};

