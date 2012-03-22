exports.gen_salt_sync = function(num)
{
    return '';
};

exports.encrypt_sync = function(password,salt)
{
    return password;
};

exports.compare_sync = function(password,hashedPassword)
{
    return password == hashedPassword;
};

