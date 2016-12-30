'use strict';
const _ = require('lodash-contrib');
const util = require('util');
const fs = require('fs');
const path = require('path');
const Fields = require('./fields');


function create_filename(file) {
    const ext = path.extname(file.name);
    const basename = path.basename(file.name, ext);
    const filename = util.format('%s_%d%s', basename, Date.now(), ext);
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
        const self = this;

        function handleDelete(res) {
            if (module.knox_client) {
                // TODO: Remove file from S3 Bucket
                res();
            } else {
                fs.unlink(self.directory + self.value.path, err => { if (err) throw err; else res(); });
            }
            self.value = null;
        }

        function handle_upload(res) {
            if (!self.data || !self.data[self.name] || !self.data[self.name].name) {
                return res();
            }
            const uploaded_file = self.data[self.name];
            // copy file from temp location
            if (module.knox_client) {
                const stream = fs.createReadStream(uploaded_file.path);
                const filename_to_upload = '/' + create_filename(uploaded_file.name);
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
                    const http_message = res.socket._httpMessage;
                    const url = http_message.url.replace(/https:/, 'http:');
                    self.value = {
                        path: uploaded_file.name,
                        url: url,
                        size: uploaded_file.size
                    };
                    res();
                });
            } else {
                const input_stream = fs.createReadStream(uploaded_file.path);
                const filename = create_filename(uploaded_file);
                const output_stream = fs.createWriteStream(path.join(self.directory, filename));
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
                        res();
                    });
                });
            }
        }

        // delete old file is requested
        return new Promise(res => {
            if (self.value && 'path' in self.value && self.data && self.data[self.name + '_clear']) {
                handleDelete(() => handle_upload(res));
                // delete temp file
            } else if (self.data && self.data[self.name] && self.data[self.name].filename) {
                handleDelete(res);
            } else {
                handle_upload(res);
            }
        });
    }
});


module.exports.setAmazonCredentials = function (credentials) {
    try {
        const knox = require('knox');
        module.knox_client = knox.createClient(credentials);
    } catch (e) {
        console.log(e.message);
    }
};
