
var crypto = require('crypto');

var salt = 'wherestheninja';

exports.setSeed = function(seed)
{
    salt = seed;
};

exports.gen_salt_sync = function(num)
{
    return salt;
};

var encrypt_sync = exports.encrypt_sync = function(password)
{

    return password ? crypto.createHmac('sha1', salt).update(password).digest('hex') : password;
};

var compare_sync = exports.compare_sync = function(raw,hashed)
{
    return (!hashed && !raw) || hashed == encrypt_sync(raw);
};