var util = require('util');

exports.writer_to_string = function (writer, limit) {
    limit = limit || 256;
    var buff = new Buffer(limit);
    var pointer = 0;
    writer({write: function (str) {
        if (str.length + pointer > limit) {
            limit = limit * 2;
            var new_buff = new Buffer(limit);
            new_buff.write(buff.toString('utf8', 0, pointer));
            delete buff;
            buff = new_buff;
        }
        pointer += buff.write(str, pointer);
    }});
    return buff.toString('utf8', 0, pointer);
};
