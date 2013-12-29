'use strict';
var _ = require('lodash-contrib'),
    util = require('util'),
    fs = require('fs'),
    path = require('path'),
    Fields = require('./fields'),
    Promise = require('mpromise');


function create_filename(file) {
    var ext = path.extname(file.name);
    var basename = path.basename(file.name, ext);
    var filename = util.format('%s_%d%s', basename, Date.now(), ext);
    return filename;
}

module.exports = Fields.BaseField.extend({
    init: function (options) {
        options.widget = options.widget || 'FileWidget';
        if (!options.upload_to) throw new TypeError('FileField require setting "upload_to"');
        this.directory = options.upload_to;
        this._super(options);
    },
    unbind: function () {
        this._super();
        this.value = _.omit(this.value, 'ws');
        if (this.value && this.value.size === 0) this.value = null;
    },
    pre_process: function () {
        var p = new Promise;
        var self = this;

        function handleDelete(cbk) {
            if (module.knox_client) {
                // TODO: Remove file from S3 Bucket
                cbk();
            } else {
                fs.unlink(self.directory + self.value.path, cbk);
            }
            self.value = null;
        }

        function handle_upload(err) {
            if (err) console.trace(err);
            if (!self.data || !self.data[self.name] || !self.data[self.name].name) {
                p.fulfill();
                return;
            }
            var uploaded_file = self.data[self.name];
            // copy file from temp location
            if (module.knox_client) {
                var stream = fs.createReadStream(uploaded_file.path);
                var filename_to_upload = '/' + create_filename(uploaded_file.name);
                module.knox_client.putStream(stream, filename_to_upload, {'Content-Length': uploaded_file.size}, function (err, res) {
                    if (err) {
                        if (err.socket && err.socket._httpMessage) {
                            res = err;
                        } else {
                            console.error('upload to amazon failed', err.stack || err);
                            p.reject(err);
                            return;
                        }
                    }

                    fs.unlink(uploaded_file.path);
                    //noinspection JSUnresolvedVariable
                    var http_message = res.socket._httpMessage;
                    var url = http_message.url.replace(/https:/, 'http:');
                    self.value = {
                        path: uploaded_file.name,
                        url: url,
                        size: uploaded_file.size
                    };
                    p.fulfill();
                });
            } else {
                var input_stream = fs.createReadStream(uploaded_file.path);
                var filename = create_filename(uploaded_file);
                var output_stream = fs.createWriteStream(path.join(self.directory, filename));
                input_stream.pipe(output_stream);
                output_stream.on("finish", function (err) {
                    if (err) throw err;
                    fs.unlink(uploaded_file.path, function (err) {
                        if (err) throw err;
                        self.value = {
                            path: filename,
                            url: '/cdn/' + filename,
                            size: uploaded_file.size
                        };
                        p.fulfill();
                    });
                });
            }
        }

        // delete old file is requested
        if (self.value && 'path' in self.value && self.data && self.data[self.name + '_clear']) {
            handleDelete(handle_upload);
        // delete temp file
        } else if (self.data && self.data[self.name] && self.data[self.name].filename) {
            handleDelete(p.resolve.bind(p));
        } else {
            handle_upload();
        }
        return p;
    }
});


module.exports.setAmazonCredentials = function (credentials) {
    try {
        var knox = require('knox');
        module.knox_client = knox.createClient(credentials);
    } catch (e) {
        console.log(e.message);
    }
};
