function joinClasses(val) {return Array.isArray(val) ? val.map(joinClasses).filter(nulls).join(' ') : val;};function nulls(val) {return val != null && val !== '';};var jade = {};
jade.attrs=function attrs(obj, escaped){
  var buf = []
    , terse = obj.terse;

  delete obj.terse;
  var keys = Object.keys(obj)
    , len = keys.length;

  if (len) {
    buf.push('');
    for (var i = 0; i < len; ++i) {
      var key = keys[i]
        , val = obj[key];

      if ('boolean' == typeof val || null == val) {
        if (val) {
          terse
            ? buf.push(key)
            : buf.push(key + '="' + key + '"');
        }
      } else if (0 == key.indexOf('data') && 'string' != typeof val) {
        buf.push(key + "='" + JSON.stringify(val) + "'");
      } else if ('class' == key) {
        if (escaped && escaped[key]){
          if (val = exports.escape(joinClasses(val))) {
            buf.push(key + '="' + val + '"');
          }
        } else {
          if (val = joinClasses(val)) {
            buf.push(key + '="' + val + '"');
          }
        }
      } else if (escaped && escaped[key]) {
        buf.push(key + '="' + exports.escape(val) + '"');
      } else {
        buf.push(key + '="' + val + '"');
      }
    }
  }

  return buf.join(' ');
};
jade.escape=exports.escape=function escape(html){
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};
module.exports.dialog_callback = function anonymous(locals) {
var buf = [];
var locals_ = (locals || {}),data = locals_.data;jade.indent = [];
buf.push("<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta http-equiv=\"Content-type\" content=\"text/html; charset=utf-8\">\n    <script>\n      var data = {id:\"" + (jade.escape((jade.interp = data.id) == null ? '' : jade.interp)) + "\",label:\"" + (jade.escape((jade.interp = data.label) == null ? '' : jade.interp)) + "\"};\n      window.opener.postMessage(data,window.location.protocol + '//' + window.location.hostname);\n      setTimeout(function(){\n          window.close();\n      },500);\n      \n    </script>\n  </head>\n  <body></body>\n</html>");;return buf.join("");
}; 

module.exports.document = function anonymous(locals) {
var buf = [];
var locals_ = (locals || {}),pageTitle = locals_.pageTitle,rootPath = locals_.rootPath,renderedHead = locals_.renderedHead,global_head = locals_.global_head,dialog = locals_.dialog,adminTitle = locals_.adminTitle,model_name = locals_.model_name,model_label = locals_.model_label,isDialog = locals_.isDialog,errors = locals_.errors,form = locals_.form,subCollections = locals_.subCollections,allow_delete = locals_.allow_delete,actions = locals_.actions,userPanel = locals_.userPanel,version = locals_.version,global_script = locals_.global_script;jade.indent = [];
buf.push("<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\">\n    <title>" + (null == (jade.interp = pageTitle) ? "" : jade.interp) + "</title>\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/ui-lightness/jquery-ui-1.10.2.custom.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/bootstrap/css/bootstrap.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/datetimepicker/bootstrap-datetimepicker.min.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/select2/select2.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/main.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/forms.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/maps.css') }, {"rel":true,"href":true})) + ">\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/jquery-1.9.1.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/jquery-ui-1.10.2.custom.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/bootstrap/js/bootstrap.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/datetimepicker/bootstrap-datetimepicker.min.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/ckeditor/ckeditor.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/select2/select2.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':("" + (rootPath) + "/vendor/bootbox.min.js") }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/clienstrum.js') }, {"src":true})) + "></script>\n    <script>var root = '" + (jade.escape((jade.interp = rootPath) == null ? '' : jade.interp)) + "';</script>" + (null == (jade.interp = renderedHead) ? "" : jade.interp) + "" + (((jade.interp = global_head) == null ? '' : jade.interp)) + "\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/maps.js') }, {"src":true})) + "></script>\n  </head>\n  <body>");
if (!dialog)
{
buf.push("\n    <header class=\"navbar navbar-static-top\">\n      <div class=\"navbar-inner\">\n        <div class=\"container\">\n          <div class=\"btn-group pull-right\"><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/'), "class": [('btn'),('btn-inverse')] }, {"href":true})) + "><i class=\"icon-home icon-white\"></i>&nbsp;Admin</a><a href=\"/\" class=\"btn\"><i class=\"icon-share\"></i>&nbsp;Site</a><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/logout'), "class": [('btn')] }, {"href":true})) + ">\n              <div class=\"icon-lock\"></div>&nbsp;Logout</a></div>\n          <h1><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/') }, {"href":true})) + ">" + (jade.escape((jade.interp = adminTitle) == null ? '' : jade.interp)) + "</a><span class=\"divider\">/</span><a" + (jade.attrs({ terse: true, 'href':("" + (rootPath) + "/model/" + (model_name) + "") }, {"href":true})) + ">" + (jade.escape((jade.interp = model_label) == null ? '' : jade.interp)) + "</a><span class=\"divider\">/</span>editor</h1>\n        </div>\n      </div>\n    </header>");
}
buf.push("\n    <div class=\"container\">\n      <div id=\"old-version\" style=\"position: fixed;bottom: 1em;right: 1em;width: 30em;height: 4em;border-radius: 10px;display: block;opacity: 0.8;display:none\" class=\"alert alert-error\">\n        <button type=\"button\" data-dismiss=\"alert\" class=\"close\">&times;</button><strong>Warning;</strong>There is a newer version of formage.\n      </div>\n      <div id=\"content\">");
if (!isDialog)
{
buf.push("\n        <div class=\"page-header\">\n          <h2>" + (jade.escape((jade.interp = model_label) == null ? '' : jade.interp)) + " editor</h2>\n        </div>");
}
if (Object.keys(errors).length)
{
buf.push("\n        <p class=\"alert alert-error\">Saving failed, fix the following errors and try again.</p>");
}
if (errors.exception)
{
buf.push("\n        <p class=\"alert alert-error\">" + (jade.escape((jade.interp = errors.exception) == null ? '' : jade.interp)) + "</p>");
}
buf.push("\n        <form id=\"document\" enctype=\"multipart/form-data\" method=\"post\" class=\"clearfix\">" + (null == (jade.interp = form) ? "" : jade.interp));
if(subCollections && subCollections.length)
{
// iterate subCollections
;(function(){
  var $$obj = subCollections;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var sub = $$obj[$index];

buf.push("<a" + (jade.attrs({ terse: true, 'href':("" + (rootPath) + "/model/" + (sub.model) + "?" + (sub.field) + "=" + (sub.value) + ""), "class": [('subCollection')] }, {"href":true})) + ">" + (jade.escape((jade.interp = sub.label) == null ? '' : jade.interp)) + " - " + (jade.escape((jade.interp = sub.count? sub.count + ' Items' : 'No items') == null ? '' : jade.interp)) + "</a>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var sub = $$obj[$index];

buf.push("<a" + (jade.attrs({ terse: true, 'href':("" + (rootPath) + "/model/" + (sub.model) + "?" + (sub.field) + "=" + (sub.value) + ""), "class": [('subCollection')] }, {"href":true})) + ">" + (jade.escape((jade.interp = sub.label) == null ? '' : jade.interp)) + " - " + (jade.escape((jade.interp = sub.count? sub.count + ' Items' : 'No items') == null ? '' : jade.interp)) + "</a>");
    }

  }
}).call(this);

}
buf.push("\n          <p class=\"submit btn-group\">\n            <button id=\"saveButton\" type=\"submit\" data-saving-text=\"Saving...\" class=\"btn btn-large btn-primary\">Save</button><a" + (jade.attrs({ terse: true, 'id':('cancelButton'), 'href':("" + (rootPath) + "/model/" + (model_name) + ""), "class": [('btn'),('btn-large')] }, {"href":true})) + ">Cancel</a>");
if (allow_delete)
{
buf.push("\n            <button id=\"deleteButton\" type=\"button\" data-loading-text=\"Deleting...\" class=\"btn btn-large btn-danger\">Delete</button>");
}
// iterate actions
;(function(){
  var $$obj = actions;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var action = $$obj[$index];

if (action.id != 'delete')
{
buf.push("\n            <button" + (jade.attrs({ terse: true, 'value':('' + (action.id) + ''), "class": [('action'),('btn'),('btn-large')] }, {"value":true})) + ">" + (jade.escape((jade.interp = action.label) == null ? '' : jade.interp)) + "</button>");
}
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var action = $$obj[$index];

if (action.id != 'delete')
{
buf.push("\n            <button" + (jade.attrs({ terse: true, 'value':('' + (action.id) + ''), "class": [('action'),('btn'),('btn-large')] }, {"value":true})) + ">" + (jade.escape((jade.interp = action.label) == null ? '' : jade.interp)) + "</button>");
}
    }

  }
}).call(this);

buf.push("\n          </p>\n        </form>");
if (!isDialog)
{
buf.push("\n        <div id=\"myModal\" tabindex=\"-1\" role=\"dialog\" style=\"width:1060px;height:624px\" class=\"modal hide fade\">\n          <div class=\"modal-header\">\n            <button type=\"button\" data-dismiss=\"modal\" class=\"close\">×</button>\n            <h3 id=\"myModalLabel\">&nbsp;</h3>\n          </div>\n          <div style=\"max-height:inherit\" class=\"modal-body\">\n            <iframe src=\"\" style=\"zoom: 0.60;\" width=\"99.6%\" height=\"800\" frameborder=\"0\"></iframe>\n          </div>\n        </div>");
}
buf.push("\n      </div>");
if (!dialog)
{
buf.push("\n      <footer class=\"footer\">");
if (userPanel)
{
buf.push("\n        <p class=\"user-panel\">" + (((jade.interp = userPanel) == null ? '' : jade.interp)) + "</p>");
}
buf.push("\n        <p><a href=\"http://github.com/Empeeric/formage\">Formage</a>&nbsp;" + (jade.escape((jade.interp = version) == null ? '' : jade.interp)) + ", from&nbsp;<a href=\"http://empeeric.com\">Empeeric</a></p><a href=\"http://github.com/Empeeric/formage\"><img" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/images/logo-40.png') }, {"src":true})) + "></a>\n      </footer>");
}
buf.push("\n    </div>\n    <script>\n      var model = '" + (jade.escape((jade.interp = model_name) == null ? '' : jade.interp)) + "';\n      var isDialog = " + (((jade.interp = JSON.stringify(Boolean(isDialog))) == null ? '' : jade.interp)) + ";\n      \n    </script>\n    <script" + (jade.attrs({ terse: true, 'src':("" + (rootPath) + "/js/document.js") }, {"src":true})) + "></script>" + (((jade.interp = global_script) == null ? '' : jade.interp)) + "\n  </body>\n</html>");;return buf.join("");
}; 

module.exports.layout = function anonymous(locals) {
var buf = [];
var locals_ = (locals || {}),pageTitle = locals_.pageTitle,rootPath = locals_.rootPath,renderedHead = locals_.renderedHead,global_head = locals_.global_head,dialog = locals_.dialog,adminTitle = locals_.adminTitle,userPanel = locals_.userPanel,version = locals_.version,global_script = locals_.global_script;jade.indent = [];
buf.push("<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\">\n    <title>" + (null == (jade.interp = pageTitle) ? "" : jade.interp) + "</title>\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/ui-lightness/jquery-ui-1.10.2.custom.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/bootstrap/css/bootstrap.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/datetimepicker/bootstrap-datetimepicker.min.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/select2/select2.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/main.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/forms.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/maps.css') }, {"rel":true,"href":true})) + ">\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/jquery-1.9.1.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/jquery-ui-1.10.2.custom.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/bootstrap/js/bootstrap.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/datetimepicker/bootstrap-datetimepicker.min.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/ckeditor/ckeditor.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/select2/select2.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':("" + (rootPath) + "/vendor/bootbox.min.js") }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/clienstrum.js') }, {"src":true})) + "></script>\n    <script>var root = '" + (jade.escape((jade.interp = rootPath) == null ? '' : jade.interp)) + "';</script>" + (null == (jade.interp = renderedHead) ? "" : jade.interp) + "" + (((jade.interp = global_head) == null ? '' : jade.interp)) + "\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/maps.js') }, {"src":true})) + "></script>\n  </head>\n  <body>");
if (!dialog)
{
buf.push("\n    <header class=\"navbar navbar-static-top\">\n      <div class=\"navbar-inner\">\n        <div class=\"container\">\n          <div class=\"btn-group pull-right\"><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/'), "class": [('btn'),('btn-inverse')] }, {"href":true})) + "><i class=\"icon-home icon-white\"></i>&nbsp;Admin</a><a href=\"/\" class=\"btn\"><i class=\"icon-share\"></i>&nbsp;Site</a><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/logout'), "class": [('btn')] }, {"href":true})) + ">\n              <div class=\"icon-lock\"></div>&nbsp;Logout</a></div>\n          <h1><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/') }, {"href":true})) + ">" + (jade.escape((jade.interp = adminTitle) == null ? '' : jade.interp)) + "</a>\n          </h1>\n        </div>\n      </div>\n    </header>");
}
buf.push("\n    <div class=\"container\">\n      <div id=\"old-version\" style=\"position: fixed;bottom: 1em;right: 1em;width: 30em;height: 4em;border-radius: 10px;display: block;opacity: 0.8;display:none\" class=\"alert alert-error\">\n        <button type=\"button\" data-dismiss=\"alert\" class=\"close\">&times;</button><strong>Warning;</strong>There is a newer version of formage.\n      </div>\n      <div id=\"content\">\n      </div>");
if (!dialog)
{
buf.push("\n      <footer class=\"footer\">");
if (userPanel)
{
buf.push("\n        <p class=\"user-panel\">" + (((jade.interp = userPanel) == null ? '' : jade.interp)) + "</p>");
}
buf.push("\n        <p><a href=\"http://github.com/Empeeric/formage\">Formage</a>&nbsp;" + (jade.escape((jade.interp = version) == null ? '' : jade.interp)) + ", from&nbsp;<a href=\"http://empeeric.com\">Empeeric</a></p><a href=\"http://github.com/Empeeric/formage\"><img" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/images/logo-40.png') }, {"src":true})) + "></a>\n      </footer>");
}
buf.push("\n    </div>" + (((jade.interp = global_script) == null ? '' : jade.interp)) + "\n  </body>\n</html>");;return buf.join("");
}; 

module.exports.login = function anonymous(locals) {
var buf = [];
var locals_ = (locals || {}),pageTitle = locals_.pageTitle,rootPath = locals_.rootPath,renderedHead = locals_.renderedHead,global_head = locals_.global_head,dialog = locals_.dialog,adminTitle = locals_.adminTitle,error = locals_.error,userPanel = locals_.userPanel,version = locals_.version,global_script = locals_.global_script;jade.indent = [];
buf.push("<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\">\n    <title>" + (null == (jade.interp = pageTitle) ? "" : jade.interp) + "</title>\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/ui-lightness/jquery-ui-1.10.2.custom.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/bootstrap/css/bootstrap.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/datetimepicker/bootstrap-datetimepicker.min.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/select2/select2.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/main.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/forms.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/maps.css') }, {"rel":true,"href":true})) + ">\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/jquery-1.9.1.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/jquery-ui-1.10.2.custom.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/bootstrap/js/bootstrap.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/datetimepicker/bootstrap-datetimepicker.min.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/ckeditor/ckeditor.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/select2/select2.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':("" + (rootPath) + "/vendor/bootbox.min.js") }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/clienstrum.js') }, {"src":true})) + "></script>\n    <script>var root = '" + (jade.escape((jade.interp = rootPath) == null ? '' : jade.interp)) + "';</script>" + (null == (jade.interp = renderedHead) ? "" : jade.interp) + "" + (((jade.interp = global_head) == null ? '' : jade.interp)) + "\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/maps.js') }, {"src":true})) + "></script>\n  </head>\n  <body>");
if (!dialog)
{
buf.push("\n    <header class=\"navbar navbar-static-top\">\n      <div class=\"navbar-inner\">\n        <div class=\"container\">\n          <h1><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/') }, {"href":true})) + ">" + (jade.escape((jade.interp = adminTitle) == null ? '' : jade.interp)) + "</a>\n          </h1>\n        </div>\n      </div>\n    </header>");
}
buf.push("\n    <div class=\"container\">\n      <div id=\"old-version\" style=\"position: fixed;bottom: 1em;right: 1em;width: 30em;height: 4em;border-radius: 10px;display: block;opacity: 0.8;display:none\" class=\"alert alert-error\">\n        <button type=\"button\" data-dismiss=\"alert\" class=\"close\">&times;</button><strong>Warning;</strong>There is a newer version of formage.\n      </div>\n      <div id=\"content\">\n        <form id=\"login\" role=\"form\" method=\"post\" action=\"#\" class=\"form-horizontal\">");
if ( (error))
{
buf.push("\n          <p class=\"controls\"><strong class=\"text-error\">Wrong username or password.</strong></p>");
}
buf.push("\n          <div class=\"control-group\">\n            <label for=\"username\" class=\"control-label\">Username</label>\n            <div class=\"controls\">\n              <input id=\"username\" type=\"text\" name=\"username\">\n            </div>\n          </div>\n          <div class=\"control-group\">\n            <label for=\"password\" class=\"control-label\">Password</label>\n            <div class=\"controls\">\n              <input id=\"password\" type=\"password\" name=\"password\">\n            </div>\n          </div>\n          <div class=\"controls\">\n            <button id=\"loginButton\" type=\"submit\" class=\"btn\">Login</button>\n          </div>\n        </form>\n      </div>");
if (!dialog)
{
buf.push("\n      <footer class=\"footer\">");
if (userPanel)
{
buf.push("\n        <p class=\"user-panel\">" + (((jade.interp = userPanel) == null ? '' : jade.interp)) + "</p>");
}
buf.push("\n        <p><a href=\"http://github.com/Empeeric/formage\">Formage</a>&nbsp;" + (jade.escape((jade.interp = version) == null ? '' : jade.interp)) + ", from&nbsp;<a href=\"http://empeeric.com\">Empeeric</a></p><a href=\"http://github.com/Empeeric/formage\"><img" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/images/logo-40.png') }, {"src":true})) + "></a>\n      </footer>");
}
buf.push("\n    </div>" + (((jade.interp = global_script) == null ? '' : jade.interp)) + "\n  </body>\n</html>");;return buf.join("");
}; 

module.exports.model = function anonymous(locals) {
var buf = [];
var locals_ = (locals || {}),pageTitle = locals_.pageTitle,rootPath = locals_.rootPath,renderedHead = locals_.renderedHead,global_head = locals_.global_head,dialog = locals_.dialog,adminTitle = locals_.adminTitle,label = locals_.label,filters = locals_.filters,model_name = locals_.model_name,current_filters = locals_.current_filters,makeLink = locals_.makeLink,creatable = locals_.creatable,newTypes = locals_.newTypes,search = locals_.search,search_value = locals_.search_value,sortable = locals_.sortable,actions = locals_.actions,dataTable = locals_.dataTable,start = locals_.start,total_count = locals_.total_count,cloneable = locals_.cloneable,count = locals_.count,userPanel = locals_.userPanel,version = locals_.version,global_script = locals_.global_script;jade.indent = [];
var fielddesc_mixin = function(value, type, document_url){
var block = this.block, attributes = this.attributes || {}, escaped = this.escaped || {};
var value_url = value && value.url;
var cloudinary_url = value_url && value.url.split('/upload/')[0] + '/upload/c_fill,h_80,w_80/' + value.public_id + '.png';
var geomery = value && value.geometry && value.geometry.lat + ',' + value.geometry.lng;
var maps_url = geomery && 'https://maps.google.com/?q=' + geomery;
var filename = value && value.filename;
var date_string = value && value.toISOString ? value.toISOString().split('T')[0] : '';
switch (type){
case 'Picture':
buf.push("<a" + (jade.attrs({ 'href':(value_url), 'target':('_blank') }, {"href":true,"target":true})) + "><img" + (jade.attrs({ 'src':(cloudinary_url) }, {"src":true})) + "/></a>");
  break;
case 'Html':
buf.push(null == (jade.interp = value) ? "" : jade.interp);
  break;
case 'Filepicker':
if (value)
{
buf.push("<a" + (jade.attrs({ 'href':(value_url), 'target':('_blank') }, {"href":true,"target":true})) + ">");
if (value.isWriteable && value.mimetype.indexOf('image') != 0)
{
buf.push(jade.escape(null == (jade.interp = filename) ? "" : jade.interp));
}
else
{
buf.push("<img" + (jade.attrs({ 'src':(value_url+'/convert?fit=crop&w=80&h=80') }, {"src":true})) + "/>");
}
buf.push("</a>");
}
  break;
case 'File':
buf.push("<a" + (jade.attrs({ 'href':(value_url), 'target':('_blank') }, {"href":true,"target":true})) + ">" + (jade.escape(null == (jade.interp = filename) ? "" : jade.interp)) + "</a>");
  break;
case 'GeoPoint':
buf.push("<a" + (jade.attrs({ 'href':(maps_url), 'target':('_blank') }, {"href":true,"target":true})) + ">" + (jade.escape(null == (jade.interp = geomery) ? "" : jade.interp)) + "</a>");
  break;
case 'Boolean':
buf.push("\n");
buf.push.apply(buf, jade.indent);
buf.push("<div class=\"bool\"><i" + (jade.attrs({ "class": [((value ? 'icon-ok' : 'icon-remove'))] }, {"class":true})) + "></i></div>");
  break;
case 'Date':
buf.push("<a" + (jade.attrs({ 'href':(document_url) }, {"href":true})) + ">" + (jade.escape(null == (jade.interp = date_string) ? "" : jade.interp)) + "</a>");
  break;
default:
buf.push("<a" + (jade.attrs({ 'href':(document_url) }, {"href":true})) + ">" + (jade.escape(null == (jade.interp = value) ? "" : jade.interp)) + "</a>");
  break;
}
};
buf.push("<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\">\n    <title>" + (null == (jade.interp = pageTitle) ? "" : jade.interp) + "</title>\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/ui-lightness/jquery-ui-1.10.2.custom.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/bootstrap/css/bootstrap.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/datetimepicker/bootstrap-datetimepicker.min.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/select2/select2.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/main.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/forms.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/maps.css') }, {"rel":true,"href":true})) + ">\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/jquery-1.9.1.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/jquery-ui-1.10.2.custom.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/bootstrap/js/bootstrap.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/datetimepicker/bootstrap-datetimepicker.min.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/ckeditor/ckeditor.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/select2/select2.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':("" + (rootPath) + "/vendor/bootbox.min.js") }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/clienstrum.js') }, {"src":true})) + "></script>\n    <script>var root = '" + (jade.escape((jade.interp = rootPath) == null ? '' : jade.interp)) + "';</script>" + (null == (jade.interp = renderedHead) ? "" : jade.interp) + "" + (((jade.interp = global_head) == null ? '' : jade.interp)) + "\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/maps.js') }, {"src":true})) + "></script>\n  </head>\n  <body>");
if (!dialog)
{
buf.push("\n    <header class=\"navbar navbar-static-top\">\n      <div class=\"navbar-inner\">\n        <div class=\"container\">\n          <div class=\"btn-group pull-right\"><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/'), "class": [('btn'),('btn-inverse')] }, {"href":true})) + "><i class=\"icon-home icon-white\"></i>&nbsp;Admin</a><a href=\"/\" class=\"btn\"><i class=\"icon-share\"></i>&nbsp;Site</a><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/logout'), "class": [('btn')] }, {"href":true})) + ">\n              <div class=\"icon-lock\"></div>&nbsp;Logout</a></div>\n          <h1><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/') }, {"href":true})) + ">" + (jade.escape((jade.interp = adminTitle) == null ? '' : jade.interp)) + "</a><span class=\"divider\">/</span>" + (jade.escape((jade.interp = label) == null ? '' : jade.interp)) + "</h1>\n        </div>\n      </div>\n    </header>");
}
buf.push("\n    <div class=\"container\">\n      <div id=\"old-version\" style=\"position: fixed;bottom: 1em;right: 1em;width: 30em;height: 4em;border-radius: 10px;display: block;opacity: 0.8;display:none\" class=\"alert alert-error\">\n        <button type=\"button\" data-dismiss=\"alert\" class=\"close\">&times;</button><strong>Warning;</strong>There is a newer version of formage.\n      </div>\n      <div id=\"content\">\n        <div class=\"page-header\">\n          <h2>" + (jade.escape((jade.interp = label) == null ? '' : jade.interp)) + "</h2>\n        </div>\n        <div id=\"content\" class=\"clearfix\">");
if (filters.length)
{
buf.push("\n          <div id=\"filters\">\n            <div class=\"well\">\n              <h3><i class=\"icon-filter\"></i>Filters<small class=\"pull-right\"><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/model/' + (model_name) + '') }, {"href":true})) + ">Clear</a></small></h3>\n              <ul class=\"nav nav-list\">");
// iterate filters
;(function(){
  var $$obj = filters;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var filter = $$obj[$index];

buf.push("\n                <li class=\"nav-header\"><strong>" + (jade.escape((jade.interp = filter.key) == null ? '' : jade.interp)) + ":</strong></li>");
if (current_filters[filter.key])
{
buf.push("\n                <li><a" + (jade.attrs({ terse: true, 'href':('' + (makeLink(filter.key,"")) + '') }, {"href":true})) + ">All</a></li>");
}
else
{
buf.push("\n                <li class=\"active\"><strong>All</strong></li>");
}
// iterate filter.values
;(function(){
  var $$obj = filter.values;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var value = $$obj[$index];

if (value)
{
buf.push("\n                <li>");
if (current_filters[filter.key] !== String(value.value) )
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (makeLink(filter.key, value.value)) + '') }, {"href":true})) + ">" + (jade.escape((jade.interp = value.text) == null ? '' : jade.interp)) + "</a>");
}
else
{
buf.push("<strong>" + (jade.escape((jade.interp = value.text) == null ? '' : jade.interp)) + "</strong>");
}
buf.push("\n                </li>");
}
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var value = $$obj[$index];

if (value)
{
buf.push("\n                <li>");
if (current_filters[filter.key] !== String(value.value) )
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (makeLink(filter.key, value.value)) + '') }, {"href":true})) + ">" + (jade.escape((jade.interp = value.text) == null ? '' : jade.interp)) + "</a>");
}
else
{
buf.push("<strong>" + (jade.escape((jade.interp = value.text) == null ? '' : jade.interp)) + "</strong>");
}
buf.push("\n                </li>");
}
    }

  }
}).call(this);

if (filter.isString)
{
buf.push("\n                <div class=\"input-append\">\n                  <input" + (jade.attrs({ terse: true, 'type':('text'), 'name':('' + (filter.key) + ''), 'value':('' + (current_filters[filter.key] || "") + ''), "class": [('literal')] }, {"type":true,"name":true,"value":true})) + "><span class=\"add-on\">\n                    <button" + (jade.attrs({ terse: true, 'data-href':('' + (makeLink(filter.key, "__replace__")) + ''), "class": [('icon-calendar'),('free_search')] }, {"data-href":true})) + "></button></span>\n                </div>");
}
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var filter = $$obj[$index];

buf.push("\n                <li class=\"nav-header\"><strong>" + (jade.escape((jade.interp = filter.key) == null ? '' : jade.interp)) + ":</strong></li>");
if (current_filters[filter.key])
{
buf.push("\n                <li><a" + (jade.attrs({ terse: true, 'href':('' + (makeLink(filter.key,"")) + '') }, {"href":true})) + ">All</a></li>");
}
else
{
buf.push("\n                <li class=\"active\"><strong>All</strong></li>");
}
// iterate filter.values
;(function(){
  var $$obj = filter.values;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var value = $$obj[$index];

if (value)
{
buf.push("\n                <li>");
if (current_filters[filter.key] !== String(value.value) )
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (makeLink(filter.key, value.value)) + '') }, {"href":true})) + ">" + (jade.escape((jade.interp = value.text) == null ? '' : jade.interp)) + "</a>");
}
else
{
buf.push("<strong>" + (jade.escape((jade.interp = value.text) == null ? '' : jade.interp)) + "</strong>");
}
buf.push("\n                </li>");
}
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var value = $$obj[$index];

if (value)
{
buf.push("\n                <li>");
if (current_filters[filter.key] !== String(value.value) )
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (makeLink(filter.key, value.value)) + '') }, {"href":true})) + ">" + (jade.escape((jade.interp = value.text) == null ? '' : jade.interp)) + "</a>");
}
else
{
buf.push("<strong>" + (jade.escape((jade.interp = value.text) == null ? '' : jade.interp)) + "</strong>");
}
buf.push("\n                </li>");
}
    }

  }
}).call(this);

if (filter.isString)
{
buf.push("\n                <div class=\"input-append\">\n                  <input" + (jade.attrs({ terse: true, 'type':('text'), 'name':('' + (filter.key) + ''), 'value':('' + (current_filters[filter.key] || "") + ''), "class": [('literal')] }, {"type":true,"name":true,"value":true})) + "><span class=\"add-on\">\n                    <button" + (jade.attrs({ terse: true, 'data-href':('' + (makeLink(filter.key, "__replace__")) + ''), "class": [('icon-calendar'),('free_search')] }, {"data-href":true})) + "></button></span>\n                </div>");
}
    }

  }
}).call(this);

buf.push("\n              </ul>\n            </div>\n          </div>");
}
buf.push("\n          <div>\n            <div class=\"btn-toolbar clearfix\">");
if (creatable)
{
if (newTypes.length === 0)
buf.push("<a" + (jade.attrs({ terse: true, 'href':("" + (rootPath) + "/model/" + (model_name) + "/document/new" + (makeLink()) + ""), "class": [('btn'),('pull-right'),('btn-warning')] }, {"href":true})) + "><i class=\"icon-plus icon-white\"></i>&nbsp;New Item&nbsp;</a>");
else
{
buf.push("\n              <div class=\"btn-group pull-right\">\n                <button type=\"button\" data-toggle=\"dropdown\" class=\"btn btn-warning dropdown-toggle\"><i class=\"icon-plus icon-white\"></i>&nbsp;New Item&nbsp;</button>\n                <ul class=\"dropdown-menu\">");
// iterate newTypes
;(function(){
  var $$obj = newTypes;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var type = $$obj[$index];

buf.push("\n                  <li><a" + (jade.attrs({ terse: true, 'href':("" + (rootPath) + "/model/" + (type) + "/document/new" + (makeLink()) + "") }, {"href":true})) + ">" + (jade.escape((jade.interp = type) == null ? '' : jade.interp)) + "</a></li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var type = $$obj[$index];

buf.push("\n                  <li><a" + (jade.attrs({ terse: true, 'href':("" + (rootPath) + "/model/" + (type) + "/document/new" + (makeLink()) + "") }, {"href":true})) + ">" + (jade.escape((jade.interp = type) == null ? '' : jade.interp)) + "</a></li>");
    }

  }
}).call(this);

buf.push("\n                </ul>\n              </div>");
}
}
if (search)
{
buf.push("\n              <div>\n                <form class=\"form-inline\">\n                  <input" + (jade.attrs({ terse: true, 'type':("text"), 'name':("_search"), 'value':("" + (search_value) + ""), "class": [("span5")] }, {"type":true,"name":true,"value":true,"class":true})) + ">");
for(var key in current_filters)
{
if(key != "_search")
{
buf.push("\n                  <input" + (jade.attrs({ terse: true, 'type':("hidden"), 'name':("" + (key) + ""), 'value':("" + (current_filters[key]) + "") }, {"type":true,"name":true,"value":true})) + ">");
}
}
if(dialog)
{
buf.push("\n                  <input type=\"hidden\" name=\"_dialog\" value=\"yes\">");
}
buf.push("\n                  <button type=\"submit\" class=\"btn\">Search</button>\n                </form>\n              </div>");
}
if (sortable)
{
buf.push("\n              <button id=\"reorder\" data-loading-text=\"Saving...\" data-saved-text=\"Saved!\" class=\"btn btn-success pull-left hide\"><i class=\"icon-ok icon-white\"></i>Save Order</button>");
}
if (actions.length && dataTable.data.length)
{
buf.push("\n              <div id=\"actions\" class=\"input-prepend hide\"><span class=\"add-on\">With selected: &nbsp;</span>\n                <div class=\"btn-group\">");
// iterate actions
;(function(){
  var $$obj = actions;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var action = $$obj[$index];

if ( (action.id == 'delete'))
{
buf.push("\n                  <button" + (jade.attrs({ terse: true, 'value':('' + (action.id) + ''), "class": [('btn'),('btn-danger')] }, {"value":true})) + "><i class=\"icon-trash icon-white\"></i>&nbsp;" + (jade.escape((jade.interp = action.label) == null ? '' : jade.interp)) + "</button>");
}
else
{
buf.push("\n                  <button" + (jade.attrs({ terse: true, 'value':('' + (action.id) + ''), "class": [('btn')] }, {"value":true})) + ">" + (jade.escape((jade.interp = action.label) == null ? '' : jade.interp)) + "</button>");
}
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var action = $$obj[$index];

if ( (action.id == 'delete'))
{
buf.push("\n                  <button" + (jade.attrs({ terse: true, 'value':('' + (action.id) + ''), "class": [('btn'),('btn-danger')] }, {"value":true})) + "><i class=\"icon-trash icon-white\"></i>&nbsp;" + (jade.escape((jade.interp = action.label) == null ? '' : jade.interp)) + "</button>");
}
else
{
buf.push("\n                  <button" + (jade.attrs({ terse: true, 'value':('' + (action.id) + ''), "class": [('btn')] }, {"value":true})) + ">" + (jade.escape((jade.interp = action.label) == null ? '' : jade.interp)) + "</button>");
}
    }

  }
}).call(this);

buf.push("\n                </div>\n              </div>");
}
buf.push("\n            </div>");
if (!dataTable.data.length)
{
buf.push("\n            <p class=\"center\">No documents yet</p>");
}
else
{
buf.push("\n            <p class=\"counter\">Viewing " + (jade.escape((jade.interp = start+1) == null ? '' : jade.interp)) + "–" + (jade.escape((jade.interp = start + dataTable.data.length) == null ? '' : jade.interp)) + " of " + (jade.escape((jade.interp = total_count) == null ? '' : jade.interp)) + " documents</p>\n            <table class=\"table table-bordered table-hover\">\n              <colgroup class=\"selectors\">\n                <col width=\"60\" class=\"center\">\n              </colgroup>\n              <colgroup>");
// iterate dataTable.header
;(function(){
  var $$obj = dataTable.header;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var field = $$obj[$index];

buf.push("\n                <col" + (jade.attrs({ terse: true, "class": [(field.thClass)] }, {"class":true})) + ">");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var field = $$obj[$index];

buf.push("\n                <col" + (jade.attrs({ terse: true, "class": [(field.thClass)] }, {"class":true})) + ">");
    }

  }
}).call(this);

buf.push("\n              </colgroup>");
if ( cloneable)
{
buf.push("\n              <colgroup class=\"buttons\">\n                <col width=\"130\">\n              </colgroup>");
}
buf.push("\n              <thead>\n                <tr>\n                  <th class=\"center\">\n                    <input type=\"checkbox\" class=\"select-all-rows\">\n                  </th>");
// iterate dataTable.header
;(function(){
  var $$obj = dataTable.header;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var field = $$obj[$index];

buf.push("\n                  <th><a" + (jade.attrs({ terse: true, 'href':(field.href) }, {"href":true})) + ">" + (jade.escape((jade.interp = field.label) == null ? '' : jade.interp)) + "</a></th>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var field = $$obj[$index];

buf.push("\n                  <th><a" + (jade.attrs({ terse: true, 'href':(field.href) }, {"href":true})) + ">" + (jade.escape((jade.interp = field.label) == null ? '' : jade.interp)) + "</a></th>");
    }

  }
}).call(this);

if ( cloneable)
{
buf.push("\n                  <th>&nbsp;</th>");
}
buf.push("\n                </tr>\n              </thead>\n              <tbody" + (jade.attrs({ terse: true, "class": [(sortable?'sortable':'')] }, {"class":true})) + ">");
// iterate dataTable.data
;(function(){
  var $$obj = dataTable.data;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var row = $$obj[$index];

var document_url = rootPath + '/model/' + model_name + '/document/' + row.id
buf.push("\n                <tr" + (jade.attrs({ terse: true, 'id':(row.id) }, {"id":true})) + ">\n                  <td class=\"center\">\n                    <input type=\"checkbox\" class=\"select-row\">");
if ( sortable)
{
buf.push("<span class=\"list-drag\"><i class=\"icon-resize-vertical\"></i></span>");
}
buf.push("\n                  </td>");
// iterate row.data
;(function(){
  var $$obj = row.data;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var field = $$obj[$index];

buf.push("\n                  <td>");
jade.indent.push('                    ');
fielddesc_mixin(field.value, field.type, document_url);
jade.indent.pop();
buf.push("\n                  </td>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var field = $$obj[$index];

buf.push("\n                  <td>");
jade.indent.push('                    ');
fielddesc_mixin(field.value, field.type, document_url);
jade.indent.pop();
buf.push("\n                  </td>");
    }

  }
}).call(this);

buf.push("\n                  <td>\n                    <div class=\"btn-group\"><a" + (jade.attrs({ terse: true, 'href':(document_url), "class": [('btn'),('btn-primary')] }, {"href":true})) + ">Edit</a>");
if ( cloneable)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':("" + (rootPath) + "/model/" + (model_name) + "/document/new?orig=" + (row.id) + ""), "class": [('btn'),('btn-default')] }, {"href":true})) + ">Duplicate</a>");
}
buf.push("\n                    </div>\n                  </td>\n                </tr>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var row = $$obj[$index];

var document_url = rootPath + '/model/' + model_name + '/document/' + row.id
buf.push("\n                <tr" + (jade.attrs({ terse: true, 'id':(row.id) }, {"id":true})) + ">\n                  <td class=\"center\">\n                    <input type=\"checkbox\" class=\"select-row\">");
if ( sortable)
{
buf.push("<span class=\"list-drag\"><i class=\"icon-resize-vertical\"></i></span>");
}
buf.push("\n                  </td>");
// iterate row.data
;(function(){
  var $$obj = row.data;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var field = $$obj[$index];

buf.push("\n                  <td>");
jade.indent.push('                    ');
fielddesc_mixin(field.value, field.type, document_url);
jade.indent.pop();
buf.push("\n                  </td>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var field = $$obj[$index];

buf.push("\n                  <td>");
jade.indent.push('                    ');
fielddesc_mixin(field.value, field.type, document_url);
jade.indent.pop();
buf.push("\n                  </td>");
    }

  }
}).call(this);

buf.push("\n                  <td>\n                    <div class=\"btn-group\"><a" + (jade.attrs({ terse: true, 'href':(document_url), "class": [('btn'),('btn-primary')] }, {"href":true})) + ">Edit</a>");
if ( cloneable)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':("" + (rootPath) + "/model/" + (model_name) + "/document/new?orig=" + (row.id) + ""), "class": [('btn'),('btn-default')] }, {"href":true})) + ">Duplicate</a>");
}
buf.push("\n                    </div>\n                  </td>\n                </tr>");
    }

  }
}).call(this);

buf.push("\n              </tbody>\n            </table>\n            <p class=\"counter\">Viewing " + (jade.escape((jade.interp = start+1) == null ? '' : jade.interp)) + "–" + (jade.escape((jade.interp = start + dataTable.data.length) == null ? '' : jade.interp)) + " of " + (jade.escape((jade.interp = total_count) == null ? '' : jade.interp)) + " documents</p>");
if (total_count > count)
{
buf.push("\n            <div class=\"pagination\">\n              <ul>");
for (var i = 0, page = 1; i < total_count; i += count, page++)
{
if (start == i)
{
buf.push("\n                <li class=\"active\"><span>" + (jade.escape((jade.interp = page) == null ? '' : jade.interp)) + "</span></li>");
}
else if (start/count <= page+5 && start/count >= page-5 || i == 0 || i+count >= total_count)
{
buf.push("\n                <li><a" + (jade.attrs({ terse: true, 'href':('' + (makeLink("start",i)) + '') }, {"href":true})) + ">" + (jade.escape((jade.interp = page) == null ? '' : jade.interp)) + "</a></li>");
}
}
buf.push("\n              </ul>\n            </div>");
}
}
buf.push("\n          </div>\n        </div>\n      </div>");
if (!dialog)
{
buf.push("\n      <footer class=\"footer\">");
if (userPanel)
{
buf.push("\n        <p class=\"user-panel\">" + (((jade.interp = userPanel) == null ? '' : jade.interp)) + "</p>");
}
buf.push("\n        <p><a href=\"http://github.com/Empeeric/formage\">Formage</a>&nbsp;" + (jade.escape((jade.interp = version) == null ? '' : jade.interp)) + ", from&nbsp;<a href=\"http://empeeric.com\">Empeeric</a></p><a href=\"http://github.com/Empeeric/formage\"><img" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/images/logo-40.png') }, {"src":true})) + "></a>\n      </footer>");
}
buf.push("\n    </div>\n    <script>\n      var startIndex = " + (jade.escape((jade.interp = start) == null ? '' : jade.interp)) + ",\n      model = '" + (jade.escape((jade.interp = model_name) == null ? '' : jade.interp)) + "';\n      \n    </script>\n    <script" + (jade.attrs({ terse: true, 'src':("" + (rootPath) + "/js/model.js") }, {"src":true})) + "></script>" + (((jade.interp = global_script) == null ? '' : jade.interp)) + "\n  </body>\n</html>");;return buf.join("");
}; 

module.exports.models = function anonymous(locals) {
var buf = [];
var locals_ = (locals || {}),pageTitle = locals_.pageTitle,rootPath = locals_.rootPath,renderedHead = locals_.renderedHead,global_head = locals_.global_head,dialog = locals_.dialog,adminTitle = locals_.adminTitle,sections = locals_.sections,userPanel = locals_.userPanel,version = locals_.version,global_script = locals_.global_script;jade.indent = [];
buf.push("<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\">\n    <title>" + (null == (jade.interp = pageTitle) ? "" : jade.interp) + "</title>\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/ui-lightness/jquery-ui-1.10.2.custom.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/bootstrap/css/bootstrap.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/datetimepicker/bootstrap-datetimepicker.min.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/select2/select2.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/main.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/forms.css') }, {"rel":true,"href":true})) + ">\n    <link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/maps.css') }, {"rel":true,"href":true})) + ">\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/jquery-1.9.1.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/jquery-ui-1.10.2.custom.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/bootstrap/js/bootstrap.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/datetimepicker/bootstrap-datetimepicker.min.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/ckeditor/ckeditor.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/select2/select2.js') }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':("" + (rootPath) + "/vendor/bootbox.min.js") }, {"src":true})) + "></script>\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/clienstrum.js') }, {"src":true})) + "></script>\n    <script>var root = '" + (jade.escape((jade.interp = rootPath) == null ? '' : jade.interp)) + "';</script>" + (null == (jade.interp = renderedHead) ? "" : jade.interp) + "" + (((jade.interp = global_head) == null ? '' : jade.interp)) + "\n    <script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/maps.js') }, {"src":true})) + "></script>\n  </head>\n  <body>");
if (!dialog)
{
buf.push("\n    <header class=\"navbar navbar-static-top\">\n      <div class=\"navbar-inner\">\n        <div class=\"container\">\n          <div class=\"btn-group pull-right\"><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/'), "class": [('btn'),('btn-inverse')] }, {"href":true})) + "><i class=\"icon-home icon-white\"></i>&nbsp;Admin</a><a href=\"/\" class=\"btn\"><i class=\"icon-share\"></i>&nbsp;Site</a><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/logout'), "class": [('btn')] }, {"href":true})) + ">\n              <div class=\"icon-lock\"></div>&nbsp;Logout</a></div>\n          <h1><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/') }, {"href":true})) + ">" + (jade.escape((jade.interp = adminTitle) == null ? '' : jade.interp)) + "</a>\n          </h1>\n        </div>\n      </div>\n    </header>");
}
buf.push("\n    <div class=\"container\">\n      <div id=\"old-version\" style=\"position: fixed;bottom: 1em;right: 1em;width: 30em;height: 4em;border-radius: 10px;display: block;opacity: 0.8;display:none\" class=\"alert alert-error\">\n        <button type=\"button\" data-dismiss=\"alert\" class=\"close\">&times;</button><strong>Warning;</strong>There is a newer version of formage.\n      </div>\n      <div id=\"content\">");
// iterate sections
;(function(){
  var $$obj = sections;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var section = $$obj[$index];

buf.push("\n        <div" + (jade.attrs({ terse: true, "class": [((sections.length > 1 ? 'section' : ''))] }, {"class":true})) + ">");
if (sections.length > 1)
{
buf.push("\n          <h2><span>" + (jade.escape((jade.interp = section.name) == null ? '' : jade.interp)) + "</span></h2>");
}
buf.push("\n          <ul class=\"models\">");
// iterate section.models
;(function(){
  var $$obj = section.models;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var modelConfig = $$obj[$index];

var url = rootPath + '/model/' + modelConfig.modelName
buf.push("\n            <li>\n              <div class=\"btn-group pull-right\">");
if (modelConfig.is_single)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (url) + '/document/single'), "class": [('btn'),('btn-default')] }, {"href":true})) + ">Edit</a>");
}
else
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':(url), "class": [('btn'),('btn-info')] }, {"href":true})) + "><span" + (jade.attrs({ terse: true, 'id':('viewAll_' + (modelConfig.modelName) + '') }, {"id":true})) + ">View All</span></a>");
if (!modelConfig.model.discriminators || modelConfig.model.discriminators.length == 0)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (url) + '/document/new'), "class": [('btn'),('btn-default')] }, {"href":true})) + ">New</a>");
}
}
buf.push("\n              </div><a" + (jade.attrs({ terse: true, 'href':(url + (modelConfig.is_single ? '/document/single' : '')) }, {"href":true})) + ">\n                <h3>" + (jade.escape((jade.interp = modelConfig.label) == null ? '' : jade.interp)) + "</h3></a>\n            </li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var modelConfig = $$obj[$index];

var url = rootPath + '/model/' + modelConfig.modelName
buf.push("\n            <li>\n              <div class=\"btn-group pull-right\">");
if (modelConfig.is_single)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (url) + '/document/single'), "class": [('btn'),('btn-default')] }, {"href":true})) + ">Edit</a>");
}
else
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':(url), "class": [('btn'),('btn-info')] }, {"href":true})) + "><span" + (jade.attrs({ terse: true, 'id':('viewAll_' + (modelConfig.modelName) + '') }, {"id":true})) + ">View All</span></a>");
if (!modelConfig.model.discriminators || modelConfig.model.discriminators.length == 0)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (url) + '/document/new'), "class": [('btn'),('btn-default')] }, {"href":true})) + ">New</a>");
}
}
buf.push("\n              </div><a" + (jade.attrs({ terse: true, 'href':(url + (modelConfig.is_single ? '/document/single' : '')) }, {"href":true})) + ">\n                <h3>" + (jade.escape((jade.interp = modelConfig.label) == null ? '' : jade.interp)) + "</h3></a>\n            </li>");
    }

  }
}).call(this);

buf.push("\n          </ul>\n        </div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var section = $$obj[$index];

buf.push("\n        <div" + (jade.attrs({ terse: true, "class": [((sections.length > 1 ? 'section' : ''))] }, {"class":true})) + ">");
if (sections.length > 1)
{
buf.push("\n          <h2><span>" + (jade.escape((jade.interp = section.name) == null ? '' : jade.interp)) + "</span></h2>");
}
buf.push("\n          <ul class=\"models\">");
// iterate section.models
;(function(){
  var $$obj = section.models;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var modelConfig = $$obj[$index];

var url = rootPath + '/model/' + modelConfig.modelName
buf.push("\n            <li>\n              <div class=\"btn-group pull-right\">");
if (modelConfig.is_single)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (url) + '/document/single'), "class": [('btn'),('btn-default')] }, {"href":true})) + ">Edit</a>");
}
else
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':(url), "class": [('btn'),('btn-info')] }, {"href":true})) + "><span" + (jade.attrs({ terse: true, 'id':('viewAll_' + (modelConfig.modelName) + '') }, {"id":true})) + ">View All</span></a>");
if (!modelConfig.model.discriminators || modelConfig.model.discriminators.length == 0)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (url) + '/document/new'), "class": [('btn'),('btn-default')] }, {"href":true})) + ">New</a>");
}
}
buf.push("\n              </div><a" + (jade.attrs({ terse: true, 'href':(url + (modelConfig.is_single ? '/document/single' : '')) }, {"href":true})) + ">\n                <h3>" + (jade.escape((jade.interp = modelConfig.label) == null ? '' : jade.interp)) + "</h3></a>\n            </li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var modelConfig = $$obj[$index];

var url = rootPath + '/model/' + modelConfig.modelName
buf.push("\n            <li>\n              <div class=\"btn-group pull-right\">");
if (modelConfig.is_single)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (url) + '/document/single'), "class": [('btn'),('btn-default')] }, {"href":true})) + ">Edit</a>");
}
else
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':(url), "class": [('btn'),('btn-info')] }, {"href":true})) + "><span" + (jade.attrs({ terse: true, 'id':('viewAll_' + (modelConfig.modelName) + '') }, {"id":true})) + ">View All</span></a>");
if (!modelConfig.model.discriminators || modelConfig.model.discriminators.length == 0)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (url) + '/document/new'), "class": [('btn'),('btn-default')] }, {"href":true})) + ">New</a>");
}
}
buf.push("\n              </div><a" + (jade.attrs({ terse: true, 'href':(url + (modelConfig.is_single ? '/document/single' : '')) }, {"href":true})) + ">\n                <h3>" + (jade.escape((jade.interp = modelConfig.label) == null ? '' : jade.interp)) + "</h3></a>\n            </li>");
    }

  }
}).call(this);

buf.push("\n          </ul>\n        </div>");
    }

  }
}).call(this);

buf.push("\n      </div>");
if (!dialog)
{
buf.push("\n      <footer class=\"footer\">");
if (userPanel)
{
buf.push("\n        <p class=\"user-panel\">" + (((jade.interp = userPanel) == null ? '' : jade.interp)) + "</p>");
}
buf.push("\n        <p><a href=\"http://github.com/Empeeric/formage\">Formage</a>&nbsp;" + (jade.escape((jade.interp = version) == null ? '' : jade.interp)) + ", from&nbsp;<a href=\"http://empeeric.com\">Empeeric</a></p><a href=\"http://github.com/Empeeric/formage\"><img" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/images/logo-40.png') }, {"src":true})) + "></a>\n      </footer>");
}
buf.push("\n    </div>\n    <script" + (jade.attrs({ terse: true, 'src':("" + (rootPath) + "/js/models.js") }, {"src":true})) + "></script>\n    <script type=\"text/javascript\">\n      $.getJSON('http://registry.npmjs.org/formage/latest?jsonp=?').done(function (pack) {\n          var version = '" + (jade.escape((jade.interp = version) == null ? '' : jade.interp)) + "';\n          var latest = pack.version;\n          if (latest > version)\n              $('#old-version').show('slow');\n      });\n    </script>" + (((jade.interp = global_script) == null ? '' : jade.interp)) + "\n  </body>\n</html>");;return buf.join("");
}; 

