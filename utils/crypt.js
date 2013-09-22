'use strict';
//noinspection SpellCheckingInspection
var salt = 'wherestheninja';
var crypto = require('crypto');
var crypt = module.exports = {
    encryptSync: function (password) {
        if (!password) return password;
        return crypto.createHmac('sha1', salt).update(password).digest('hex');
    },
    compareSync: function (raw, hashed) {
        var hashed_pass = crypt.encryptSync(raw);
        return (!hashed && !raw) || hashed == hashed_pass;
    }
};
