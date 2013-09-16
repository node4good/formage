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
var locals_ = (locals || {}),data = locals_.data;buf.push("<!DOCTYPE html><html lang=\"en\"><head><meta http-equiv=\"Content-type\" content=\"text/html; charset=utf-8\"><script>var data = {id:\"" + (jade.escape((jade.interp = data.id) == null ? '' : jade.interp)) + "\",label:\"" + (jade.escape((jade.interp = data.label) == null ? '' : jade.interp)) + "\"};\nwindow.opener.postMessage(data,window.location.protocol + '//' + window.location.hostname);\nsetTimeout(function(){\n    window.close();\n},500);\n</script></head><body></body></html>");;return buf.join("");
}; 

module.exports.document = function anonymous(locals) {
var buf = [];
var locals_ = (locals || {}),pageTitle = locals_.pageTitle,rootPath = locals_.rootPath,renderedHead = locals_.renderedHead,model = locals_.model,global_head = locals_.global_head,dialog = locals_.dialog,adminTitle = locals_.adminTitle,model_name = locals_.model_name,model_label = locals_.model_label,errors = locals_.errors,renderedDocument = locals_.renderedDocument,subCollections = locals_.subCollections,allow_delete = locals_.allow_delete,actions = locals_.actions,userPanel = locals_.userPanel,version = locals_.version,global_script = locals_.global_script;buf.push("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>" + (null == (jade.interp = pageTitle) ? "" : jade.interp) + "</title><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/ui-lightness/jquery-ui-1.10.2.custom.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/bootstrap/css/bootstrap.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/main.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/forms.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/datepicker/datepicker.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/timepicker/timepicker.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/bootstrap-datetimepicker.min.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/maps.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/select2/select2.css') }, {"rel":true,"href":true})) + "><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/lib/jquery-1.9.1.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/lib/jquery-ui-1.10.2.custom.min.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/bootstrap/js/bootstrap.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/timepicker/bootstrap-timepicker.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/bootstrap-datetimepicker.min.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/ckeditor/ckeditor.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/datepicker/bootstrap-datepicker.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/maps.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/select2/select2.js') }, {"src":true})) + "></script><script src=\"//api.filepicker.io/v1/filepicker.js\"></script><script>var root = '" + (jade.escape((jade.interp = rootPath) == null ? '' : jade.interp)) + "';</script>" + (null == (jade.interp = typeof(renderedHead) != 'undefined' ? renderedHead : '') ? "" : jade.interp));
if (model.static)
{
if (model.static.js)
{
// iterate model.static.js
;(function(){
  var $$obj = model.static.js;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var f = $$obj[$index];

buf.push("<script" + (jade.attrs({ terse: true, 'src':(f) }, {"src":true})) + "></script>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var f = $$obj[$index];

buf.push("<script" + (jade.attrs({ terse: true, 'src':(f) }, {"src":true})) + "></script>");
    }

  }
}).call(this);

}
if (model.static.css)
{
// iterate model.static.css
;(function(){
  var $$obj = model.static.css;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var f = $$obj[$index];

buf.push("<link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':(f) }, {"rel":true,"href":true})) + ">");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var f = $$obj[$index];

buf.push("<link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':(f) }, {"rel":true,"href":true})) + ">");
    }

  }
}).call(this);

}
}
buf.push("" + (((jade.interp = global_head) == null ? '' : jade.interp)) + "</head><body>");
if (!dialog)
{
buf.push("<header class=\"navbar navbar-static-top\"><div class=\"navbar-inner\"><div class=\"container\"><div class=\"btn-group pull-right\"><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/'), "class": [('btn'),('btn-inverse')] }, {"href":true})) + "><i class=\"icon-home icon-white\"></i> Admin</a><a href=\"/\" class=\"btn\"><i class=\"icon-share\"></i> Site</a><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/logout'), "class": [('btn')] }, {"href":true})) + "><div class=\"icon-lock\"></div> Logout</a></div><h1><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/') }, {"href":true})) + ">" + (jade.escape((jade.interp = adminTitle) == null ? '' : jade.interp)) + "</a><span class=\"divider\">/</span><a" + (jade.attrs({ terse: true, 'href':("" + (rootPath) + "/model/" + (model_name) + "") }, {"href":true})) + ">" + (jade.escape((jade.interp = model_label) == null ? '' : jade.interp)) + "</a><span class=\"divider\">/</span>editor</h1></div></div></header>");
}
buf.push("<div class=\"container\"><div id=\"old-version\" style=\"position: fixed;bottom: 1em;right: 1em;width: 30em;height: 4em;border-radius: 10px;display: block;opacity: 0.8;display:none\" class=\"alert alert-error\"><button type=\"button\" data-dismiss=\"alert\" class=\"close\">&times;</button><strong>Warning;</strong> There is a newer version of formage.</div><div id=\"content\"><div class=\"page-header\"><h2>" + (jade.escape((jade.interp = model_label) == null ? '' : jade.interp)) + " editor</h2></div>");
if (errors)
{
buf.push("<p class=\"alert alert-error\">Saving failed, fix the following errors and try again.</p>");
}
buf.push("<form id=\"document\" enctype=\"multipart/form-data\" method=\"post\" class=\"clearfix\">" + (null == (jade.interp = renderedDocument) ? "" : jade.interp));
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
buf.push("<p class=\"submit btn-group\"><button id=\"saveButton\" type=\"submit\" data-saving-text=\"Saving...\" class=\"btn btn-large btn-primary\">Save</button><a" + (jade.attrs({ terse: true, 'id':('cancelButton'), 'href':("" + (rootPath) + "/model/" + (model_name) + ""), "class": [('btn'),('btn-large')] }, {"href":true})) + ">Cancel</a>");
if (allow_delete)
{
buf.push("<button id=\"deleteButton\" type=\"button\" data-loading-text=\"Deleting...\" class=\"btn btn-large btn-danger\">Delete</button>");
}
// iterate actions
;(function(){
  var $$obj = actions;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var action = $$obj[$index];

if (action.value != 'delete')
{
buf.push("<button" + (jade.attrs({ terse: true, 'value':('' + (action.value) + ''), "class": [('action'),('btn'),('btn-large')] }, {"value":true})) + ">" + (jade.escape((jade.interp = action.label) == null ? '' : jade.interp)) + "</button>");
}
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var action = $$obj[$index];

if (action.value != 'delete')
{
buf.push("<button" + (jade.attrs({ terse: true, 'value':('' + (action.value) + ''), "class": [('action'),('btn'),('btn-large')] }, {"value":true})) + ">" + (jade.escape((jade.interp = action.label) == null ? '' : jade.interp)) + "</button>");
}
    }

  }
}).call(this);

buf.push("</p></form><div id=\"myModal\" tabindex=\"-1\" role=\"dialog\" style=\"width:1060px;height:624px\" class=\"modal hide fade\"><div class=\"modal-header\"><button type=\"button\" data-dismiss=\"modal\" class=\"close\">×</button><h3>Dialog</h3><div style=\"max-height:inherit\" class=\"modal-body\"><iframe src=\"\" style=\"zoom: 0.60;\" width=\"99.6%\" height=\"800\" frameborder=\"0\"></iframe></div><div class=\"modal-footer\"><button data-dismiss=\"modal\" class=\"btn\">OK</button></div></div></div></div>");
if (!dialog)
{
buf.push("<footer class=\"footer\">");
if (userPanel)
{
buf.push("<p class=\"user-panel\">" + (((jade.interp = userPanel) == null ? '' : jade.interp)) + "</p>");
}
buf.push("<p><a href=\"http://github.com/Empeeric/formage\">Formage</a> " + (jade.escape((jade.interp = version) == null ? '' : jade.interp)) + ", from&nbsp;<a href=\"http://empeeric.com\">Empeeric</a></p><a href=\"http://github.com/Empeeric/formage\"><img" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/images/logo-40.png') }, {"src":true})) + "></a></footer>");
}
buf.push("</div><script type=\"text/javascript\">var model = '" + (jade.escape((jade.interp = model_name) == null ? '' : jade.interp)) + "';\nvar dialog = " + (jade.escape((jade.interp = dialog) == null ? '' : jade.interp)) + ";\n</script><script" + (jade.attrs({ terse: true, 'src':("" + (rootPath) + "/js/lib/bootbox.min.js") }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':("" + (rootPath) + "/js/document.js") }, {"src":true})) + "></script>" + (((jade.interp = global_script) == null ? '' : jade.interp)) + "</body></html>");;return buf.join("");
}; 

module.exports.layout = function anonymous(locals) {
var buf = [];
var locals_ = (locals || {}),pageTitle = locals_.pageTitle,rootPath = locals_.rootPath,renderedHead = locals_.renderedHead,global_head = locals_.global_head,dialog = locals_.dialog,adminTitle = locals_.adminTitle,userPanel = locals_.userPanel,version = locals_.version,global_script = locals_.global_script;buf.push("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>" + (null == (jade.interp = pageTitle) ? "" : jade.interp) + "</title><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/ui-lightness/jquery-ui-1.10.2.custom.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/bootstrap/css/bootstrap.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/main.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/forms.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/datepicker/datepicker.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/timepicker/timepicker.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/bootstrap-datetimepicker.min.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/maps.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/select2/select2.css') }, {"rel":true,"href":true})) + "><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/lib/jquery-1.9.1.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/lib/jquery-ui-1.10.2.custom.min.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/bootstrap/js/bootstrap.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/timepicker/bootstrap-timepicker.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/bootstrap-datetimepicker.min.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/ckeditor/ckeditor.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/datepicker/bootstrap-datepicker.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/maps.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/select2/select2.js') }, {"src":true})) + "></script><script src=\"//api.filepicker.io/v1/filepicker.js\"></script><script>var root = '" + (jade.escape((jade.interp = rootPath) == null ? '' : jade.interp)) + "';</script>" + (null == (jade.interp = typeof(renderedHead) != 'undefined' ? renderedHead : '') ? "" : jade.interp) + "" + (((jade.interp = global_head) == null ? '' : jade.interp)) + "</head><body>");
if (!dialog)
{
buf.push("<header class=\"navbar navbar-static-top\"><div class=\"navbar-inner\"><div class=\"container\"><div class=\"btn-group pull-right\"><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/'), "class": [('btn'),('btn-inverse')] }, {"href":true})) + "><i class=\"icon-home icon-white\"></i> Admin</a><a href=\"/\" class=\"btn\"><i class=\"icon-share\"></i> Site</a><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/logout'), "class": [('btn')] }, {"href":true})) + "><div class=\"icon-lock\"></div> Logout</a></div><h1><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/') }, {"href":true})) + ">" + (jade.escape((jade.interp = adminTitle) == null ? '' : jade.interp)) + "</a></h1></div></div></header>");
}
buf.push("<div class=\"container\"><div id=\"old-version\" style=\"position: fixed;bottom: 1em;right: 1em;width: 30em;height: 4em;border-radius: 10px;display: block;opacity: 0.8;display:none\" class=\"alert alert-error\"><button type=\"button\" data-dismiss=\"alert\" class=\"close\">&times;</button><strong>Warning;</strong> There is a newer version of formage.</div><div id=\"content\"></div>");
if (!dialog)
{
buf.push("<footer class=\"footer\">");
if (userPanel)
{
buf.push("<p class=\"user-panel\">" + (((jade.interp = userPanel) == null ? '' : jade.interp)) + "</p>");
}
buf.push("<p><a href=\"http://github.com/Empeeric/formage\">Formage</a> " + (jade.escape((jade.interp = version) == null ? '' : jade.interp)) + ", from&nbsp;<a href=\"http://empeeric.com\">Empeeric</a></p><a href=\"http://github.com/Empeeric/formage\"><img" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/images/logo-40.png') }, {"src":true})) + "></a></footer>");
}
buf.push("</div>" + (((jade.interp = global_script) == null ? '' : jade.interp)) + "</body></html>");;return buf.join("");
}; 

module.exports.login = function anonymous(locals) {
var buf = [];
var locals_ = (locals || {}),pageTitle = locals_.pageTitle,rootPath = locals_.rootPath,renderedHead = locals_.renderedHead,global_head = locals_.global_head,dialog = locals_.dialog,adminTitle = locals_.adminTitle,error = locals_.error,userPanel = locals_.userPanel,version = locals_.version,global_script = locals_.global_script;buf.push("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>" + (null == (jade.interp = pageTitle) ? "" : jade.interp) + "</title><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/ui-lightness/jquery-ui-1.10.2.custom.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/bootstrap/css/bootstrap.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/main.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/forms.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/datepicker/datepicker.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/timepicker/timepicker.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/bootstrap-datetimepicker.min.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/maps.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/select2/select2.css') }, {"rel":true,"href":true})) + "><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/lib/jquery-1.9.1.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/lib/jquery-ui-1.10.2.custom.min.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/bootstrap/js/bootstrap.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/timepicker/bootstrap-timepicker.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/bootstrap-datetimepicker.min.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/ckeditor/ckeditor.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/datepicker/bootstrap-datepicker.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/maps.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/select2/select2.js') }, {"src":true})) + "></script><script src=\"//api.filepicker.io/v1/filepicker.js\"></script><script>var root = '" + (jade.escape((jade.interp = rootPath) == null ? '' : jade.interp)) + "';</script>" + (null == (jade.interp = typeof(renderedHead) != 'undefined' ? renderedHead : '') ? "" : jade.interp) + "" + (((jade.interp = global_head) == null ? '' : jade.interp)) + "</head><body>");
if (!dialog)
{
buf.push("<header class=\"navbar navbar-static-top\"><div class=\"navbar-inner\"><div class=\"container\"><h1><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/') }, {"href":true})) + ">" + (jade.escape((jade.interp = adminTitle) == null ? '' : jade.interp)) + "</a></h1></div></div></header>");
}
buf.push("<div class=\"container\"><div id=\"old-version\" style=\"position: fixed;bottom: 1em;right: 1em;width: 30em;height: 4em;border-radius: 10px;display: block;opacity: 0.8;display:none\" class=\"alert alert-error\"><button type=\"button\" data-dismiss=\"alert\" class=\"close\">&times;</button><strong>Warning;</strong> There is a newer version of formage.</div><div id=\"content\"><form id=\"login\" role=\"form\" method=\"post\" class=\"form-horizontal\">");
if ( (error))
{
buf.push("<p class=\"controls\"><strong class=\"text-error\">Wrong username or password.</strong></p>");
}
buf.push("<div class=\"control-group\"><label for=\"username\" class=\"control-label\">Username</label><div class=\"controls\"><input id=\"username\" type=\"text\" name=\"username\"></div></div><div class=\"control-group\"><label for=\"password\" class=\"control-label\">Password</label><div class=\"controls\"><input id=\"password\" type=\"password\" name=\"password\"></div></div><div class=\"controls\"><button id=\"loginButton\" type=\"submit\" class=\"btn\">Login</button></div></form></div>");
if (!dialog)
{
buf.push("<footer class=\"footer\">");
if (userPanel)
{
buf.push("<p class=\"user-panel\">" + (((jade.interp = userPanel) == null ? '' : jade.interp)) + "</p>");
}
buf.push("<p><a href=\"http://github.com/Empeeric/formage\">Formage</a> " + (jade.escape((jade.interp = version) == null ? '' : jade.interp)) + ", from&nbsp;<a href=\"http://empeeric.com\">Empeeric</a></p><a href=\"http://github.com/Empeeric/formage\"><img" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/images/logo-40.png') }, {"src":true})) + "></a></footer>");
}
buf.push("</div>" + (((jade.interp = global_script) == null ? '' : jade.interp)) + "</body></html>");;return buf.join("");
}; 

module.exports.model = function anonymous(locals) {
var buf = [];
var locals_ = (locals || {}),cloudinary = locals_.cloudinary,pageTitle = locals_.pageTitle,rootPath = locals_.rootPath,renderedHead = locals_.renderedHead,global_head = locals_.global_head,dialog = locals_.dialog,adminTitle = locals_.adminTitle,model = locals_.model,filters = locals_.filters,creatable = locals_.creatable,model_name = locals_.model_name,makeLink = locals_.makeLink,search = locals_.search,search_value = locals_.search_value,current_filters = locals_.current_filters,sortable = locals_.sortable,actions = locals_.actions,documents = locals_.documents,start = locals_.start,total_count = locals_.total_count,list_fields = locals_.list_fields,orderLink = locals_.orderLink,fieldLabel = locals_.fieldLabel,cloneable = locals_.cloneable,editable = locals_.editable,count = locals_.count,userPanel = locals_.userPanel,version = locals_.version,global_script = locals_.global_script;var fielddesc_mixin = function(value, type){
var block = this.block, attributes = this.attributes || {}, escaped = this.escaped || {};
var cloudinary_url = value && value.public_id && cloudinary.url(value.public_id + '.png', { width: 80, height: 80, crop: 'fill' })
switch (type){
case 'Picture':
buf.push("<img" + (jade.attrs({ 'src':(cloudinary_url) }, {"src":true})) + "/>");
  break;
case 'File':
buf.push("<span>" + (jade.escape((jade.interp = value ? value.filename : '') == null ? '' : jade.interp)) + "</span>");
  break;
case 'Filepicker':
buf.push("<span>" + (jade.escape((jade.interp = value ? value.filename : '') == null ? '' : jade.interp)) + "</span>");
  break;
default:
buf.push("<span>" + (jade.escape((jade.interp = value) == null ? '' : jade.interp)) + "</span>");
  break;
}
};
buf.push("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>" + (null == (jade.interp = pageTitle) ? "" : jade.interp) + "</title><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/ui-lightness/jquery-ui-1.10.2.custom.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/bootstrap/css/bootstrap.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/main.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/forms.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/datepicker/datepicker.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/timepicker/timepicker.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/bootstrap-datetimepicker.min.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/maps.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/select2/select2.css') }, {"rel":true,"href":true})) + "><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/lib/jquery-1.9.1.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/lib/jquery-ui-1.10.2.custom.min.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/bootstrap/js/bootstrap.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/timepicker/bootstrap-timepicker.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/bootstrap-datetimepicker.min.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/ckeditor/ckeditor.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/datepicker/bootstrap-datepicker.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/maps.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/select2/select2.js') }, {"src":true})) + "></script><script src=\"//api.filepicker.io/v1/filepicker.js\"></script><script>var root = '" + (jade.escape((jade.interp = rootPath) == null ? '' : jade.interp)) + "';</script>" + (null == (jade.interp = typeof(renderedHead) != 'undefined' ? renderedHead : '') ? "" : jade.interp) + "" + (((jade.interp = global_head) == null ? '' : jade.interp)) + "</head><body>");
if (!dialog)
{
buf.push("<header class=\"navbar navbar-static-top\"><div class=\"navbar-inner\"><div class=\"container\"><div class=\"btn-group pull-right\"><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/'), "class": [('btn'),('btn-inverse')] }, {"href":true})) + "><i class=\"icon-home icon-white\"></i> Admin</a><a href=\"/\" class=\"btn\"><i class=\"icon-share\"></i> Site</a><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/logout'), "class": [('btn')] }, {"href":true})) + "><div class=\"icon-lock\"></div> Logout</a></div><h1><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/') }, {"href":true})) + ">" + (jade.escape((jade.interp = adminTitle) == null ? '' : jade.interp)) + "</a><span class=\"divider\">/</span>" + (jade.escape((jade.interp = model.label) == null ? '' : jade.interp)) + "</h1></div></div></header>");
}
buf.push("<div class=\"container\"><div id=\"old-version\" style=\"position: fixed;bottom: 1em;right: 1em;width: 30em;height: 4em;border-radius: 10px;display: block;opacity: 0.8;display:none\" class=\"alert alert-error\"><button type=\"button\" data-dismiss=\"alert\" class=\"close\">&times;</button><strong>Warning;</strong> There is a newer version of formage.</div><div id=\"content\"><div class=\"page-header\"><h2>" + (jade.escape((jade.interp = model.label) == null ? '' : jade.interp)) + "</h2></div><div id=\"content\" class=\"row\"><div" + (jade.attrs({ terse: true, "class": [('span' + (filters.length ? 9 : 12) + '')] }, {"class":true})) + "><div class=\"btn-toolbar clearfix\">");
if (creatable)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':("" + (rootPath) + "/model/" + (model_name) + "/document/new" + (makeLink()) + ""), "class": [('btn'),('pull-right'),('btn-warning')] }, {"href":true})) + "><i class=\"icon-plus icon-white\"></i> New&nbsp;");
if (model.singular)
{
buf.push("<strong>" + (jade.escape((jade.interp = model.singular) == null ? '' : jade.interp)) + "</strong>");
}
else
{
buf.push("<strong>" + (jade.escape((jade.interp = model_name) == null ? '' : jade.interp)) + "</strong> item");
}
buf.push("</a>");
}
if (search)
{
buf.push("<p><form><input" + (jade.attrs({ terse: true, 'type':("text"), 'name':("_search"), 'value':("" + (search_value) + ""), 'style':("width:300px") }, {"type":true,"name":true,"value":true,"style":true})) + ">");
for(var key in current_filters)
{
if(key != "_search")
{
buf.push("<input" + (jade.attrs({ terse: true, 'type':("hidden"), 'name':("" + (key) + ""), 'value':("" + (current_filters[key]) + "") }, {"type":true,"name":true,"value":true})) + ">");
}
}
if(dialog)
{
buf.push("<input type=\"hidden\" name=\"_dialog\" value=\"yes\">");
}
buf.push("<button type=\"submit\">Search</button></form></p>");
}
if (sortable)
{
buf.push("<button id=\"reorder\" data-loading-text=\"Saving...\" data-saved-text=\"Saved!\" class=\"btn btn-success pull-left hide\"><i class=\"icon-ok icon-white\"></i> Save Order</button>");
}
if (actions.length && documents.length)
{
buf.push("<div id=\"actions\" class=\"input-prepend hide\"><span class=\"add-on\">With selected: &nbsp;</span><div class=\"btn-group\">");
// iterate actions
;(function(){
  var $$obj = actions;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var action = $$obj[$index];

if ( (action.value == 'delete'))
{
buf.push("<button" + (jade.attrs({ terse: true, 'value':('' + (action.value) + ''), "class": [('btn'),('btn-danger')] }, {"value":true})) + "><i class=\"icon-trash icon-white\"></i> " + (jade.escape((jade.interp = action.label) == null ? '' : jade.interp)) + "</button>");
}
else
{
buf.push("<button" + (jade.attrs({ terse: true, 'value':('' + (action.value) + ''), "class": [('btn')] }, {"value":true})) + ">" + (jade.escape((jade.interp = action.label) == null ? '' : jade.interp)) + "</button>");
}
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var action = $$obj[$index];

if ( (action.value == 'delete'))
{
buf.push("<button" + (jade.attrs({ terse: true, 'value':('' + (action.value) + ''), "class": [('btn'),('btn-danger')] }, {"value":true})) + "><i class=\"icon-trash icon-white\"></i> " + (jade.escape((jade.interp = action.label) == null ? '' : jade.interp)) + "</button>");
}
else
{
buf.push("<button" + (jade.attrs({ terse: true, 'value':('' + (action.value) + ''), "class": [('btn')] }, {"value":true})) + ">" + (jade.escape((jade.interp = action.label) == null ? '' : jade.interp)) + "</button>");
}
    }

  }
}).call(this);

buf.push("</div></div>");
}
buf.push("</div>");
if (!documents.length)
{
buf.push("<p class=\"center\">No documents yet</p>");
}
else
{
buf.push("<p class=\"counter\">Viewing " + (jade.escape((jade.interp = start+1) == null ? '' : jade.interp)) + "–" + (jade.escape((jade.interp = start + documents.length) == null ? '' : jade.interp)) + " of " + (jade.escape((jade.interp = total_count) == null ? '' : jade.interp)) + " documents</p><table class=\"table table-bordered table-hover\"><thead><tr><th class=\"center\"><input type=\"checkbox\" class=\"select-all-rows\"></th>");
// iterate list_fields
;(function(){
  var $$obj = list_fields;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var field = $$obj[$index];

buf.push("<th class=\"table-header-repeat line-left minwidth-1 center\"><a" + (jade.attrs({ terse: true, 'href':('' + (orderLink(field)) + '') }, {"href":true})) + ">" + (jade.escape((jade.interp = fieldLabel(field)) == null ? '' : jade.interp)) + "</a></th>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var field = $$obj[$index];

buf.push("<th class=\"table-header-repeat line-left minwidth-1 center\"><a" + (jade.attrs({ terse: true, 'href':('' + (orderLink(field)) + '') }, {"href":true})) + ">" + (jade.escape((jade.interp = fieldLabel(field)) == null ? '' : jade.interp)) + "</a></th>");
    }

  }
}).call(this);

if ( cloneable)
{
buf.push("<th>&nbsp;</th>");
}
buf.push("</tr></thead><tbody" + (jade.attrs({ terse: true, "class": [(sortable?'sortable':'')] }, {"class":true})) + ">");
// iterate documents
;(function(){
  var $$obj = documents;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var doc = $$obj[$index];

var url = rootPath + '/model/' + model_name + '/document/' + doc._id
buf.push("<tr" + (jade.attrs({ terse: true, 'id':(doc._id) }, {"id":true})) + "><td class=\"span1 center\"><input type=\"checkbox\" class=\"select-row\">");
if ( sortable)
{
buf.push("<span class=\"list-drag\"><i class=\"icon-resize-vertical\"></i></span>");
}
buf.push("</td>");
// iterate list_fields
;(function(){
  var $$obj = list_fields;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var field = $$obj[$index];

var type = model.model.schema.paths[field].options.type.name
var value = doc[field]
buf.push("<td" + (jade.attrs({ terse: true, "class": [('span3'),('center'),((type == 'Picture') ? 'picture' : '')] }, {"class":true})) + ">");
if ( (editable))
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':(url) }, {"href":true})) + ">");
fielddesc_mixin(value, type);
buf.push("</a>");
}
else
{
fielddesc_mixin(value, type);
}
buf.push("</td>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var field = $$obj[$index];

var type = model.model.schema.paths[field].options.type.name
var value = doc[field]
buf.push("<td" + (jade.attrs({ terse: true, "class": [('span3'),('center'),((type == 'Picture') ? 'picture' : '')] }, {"class":true})) + ">");
if ( (editable))
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':(url) }, {"href":true})) + ">");
fielddesc_mixin(value, type);
buf.push("</a>");
}
else
{
fielddesc_mixin(value, type);
}
buf.push("</td>");
    }

  }
}).call(this);

buf.push("<td class=\"span2 center\"><div class=\"btn-group\"><a" + (jade.attrs({ terse: true, 'href':(url), "class": [('btn'),('btn-primary')] }, {"href":true})) + ">Edit</a>");
if ( cloneable)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':("" + (rootPath) + "/model/" + (model_name) + "/document/new?orig=" + (doc._id) + ""), "class": [('btn'),('btn-default')] }, {"href":true})) + ">Duplicate</a>");
}
buf.push("</div></td></tr>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var doc = $$obj[$index];

var url = rootPath + '/model/' + model_name + '/document/' + doc._id
buf.push("<tr" + (jade.attrs({ terse: true, 'id':(doc._id) }, {"id":true})) + "><td class=\"span1 center\"><input type=\"checkbox\" class=\"select-row\">");
if ( sortable)
{
buf.push("<span class=\"list-drag\"><i class=\"icon-resize-vertical\"></i></span>");
}
buf.push("</td>");
// iterate list_fields
;(function(){
  var $$obj = list_fields;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var field = $$obj[$index];

var type = model.model.schema.paths[field].options.type.name
var value = doc[field]
buf.push("<td" + (jade.attrs({ terse: true, "class": [('span3'),('center'),((type == 'Picture') ? 'picture' : '')] }, {"class":true})) + ">");
if ( (editable))
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':(url) }, {"href":true})) + ">");
fielddesc_mixin(value, type);
buf.push("</a>");
}
else
{
fielddesc_mixin(value, type);
}
buf.push("</td>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var field = $$obj[$index];

var type = model.model.schema.paths[field].options.type.name
var value = doc[field]
buf.push("<td" + (jade.attrs({ terse: true, "class": [('span3'),('center'),((type == 'Picture') ? 'picture' : '')] }, {"class":true})) + ">");
if ( (editable))
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':(url) }, {"href":true})) + ">");
fielddesc_mixin(value, type);
buf.push("</a>");
}
else
{
fielddesc_mixin(value, type);
}
buf.push("</td>");
    }

  }
}).call(this);

buf.push("<td class=\"span2 center\"><div class=\"btn-group\"><a" + (jade.attrs({ terse: true, 'href':(url), "class": [('btn'),('btn-primary')] }, {"href":true})) + ">Edit</a>");
if ( cloneable)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':("" + (rootPath) + "/model/" + (model_name) + "/document/new?orig=" + (doc._id) + ""), "class": [('btn'),('btn-default')] }, {"href":true})) + ">Duplicate</a>");
}
buf.push("</div></td></tr>");
    }

  }
}).call(this);

buf.push("</tbody></table><p class=\"counter\">Viewing " + (jade.escape((jade.interp = start+1) == null ? '' : jade.interp)) + "–" + (jade.escape((jade.interp = start + documents.length) == null ? '' : jade.interp)) + " of " + (jade.escape((jade.interp = total_count) == null ? '' : jade.interp)) + " documents</p>");
if (total_count > count)
{
buf.push("<div class=\"pagination\"><ul>");
for (var i = 0, page = 1; i < total_count; i += count, page++)
{
if (start == i)
{
buf.push("<li class=\"active\"><span>" + (jade.escape((jade.interp = page) == null ? '' : jade.interp)) + "</span></li>");
}
else if (start/count <= page+5 && start/count >= page-5 || i == 0 || i+count >= total_count)
{
buf.push("<li><a" + (jade.attrs({ terse: true, 'href':('' + (makeLink("start",i)) + '') }, {"href":true})) + ">" + (jade.escape((jade.interp = page) == null ? '' : jade.interp)) + "</a></li>");
}
}
buf.push("</ul></div>");
}
}
buf.push("</div>");
if (filters.length)
{
buf.push("<div id=\"filters\" class=\"span3\"><div class=\"well\"><h3><i class=\"icon-filter\"></i>Filters<small class=\"pull-right\"><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/model/' + (model_name) + '') }, {"href":true})) + ">Clear</a></small></h3><ul class=\"nav nav-list\">");
// iterate filters
;(function(){
  var $$obj = filters;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var filter = $$obj[$index];

buf.push("<li class=\"nav-header\"><strong>" + (jade.escape((jade.interp = filter.key) == null ? '' : jade.interp)) + ":</strong></li>");
if (current_filters[filter.key])
{
buf.push("<li><a" + (jade.attrs({ terse: true, 'href':('' + (makeLink(filter.key,"")) + '') }, {"href":true})) + ">All</a></li>");
}
else
{
buf.push("<li class=\"active\"><strong>All</strong></li>");
}
// iterate filter.values
;(function(){
  var $$obj = filter.values;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var value = $$obj[$index];

if (value)
{
buf.push("<li>");
if (current_filters[filter.key] !== String(value.value) )
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (makeLink(filter.key, value.value)) + '') }, {"href":true})) + ">" + (jade.escape((jade.interp = value.text) == null ? '' : jade.interp)) + "</a>");
}
else
{
buf.push("<strong>" + (jade.escape((jade.interp = value.text) == null ? '' : jade.interp)) + "</strong>");
}
buf.push("</li>");
}
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var value = $$obj[$index];

if (value)
{
buf.push("<li>");
if (current_filters[filter.key] !== String(value.value) )
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (makeLink(filter.key, value.value)) + '') }, {"href":true})) + ">" + (jade.escape((jade.interp = value.text) == null ? '' : jade.interp)) + "</a>");
}
else
{
buf.push("<strong>" + (jade.escape((jade.interp = value.text) == null ? '' : jade.interp)) + "</strong>");
}
buf.push("</li>");
}
    }

  }
}).call(this);

if (filter.isString)
{
buf.push("<div><input" + (jade.attrs({ terse: true, 'type':('text'), 'style':('width:217px; !important '), 'name':('' + (filter.key) + ''), 'value':('' + (current_filters[filter.key] || "") + '') }, {"type":true,"style":true,"name":true,"value":true})) + "><button" + (jade.attrs({ terse: true, 'data-href':('' + (makeLink(filter.key, "__replace__")) + ''), "class": [('free_search')] }, {"data-href":true})) + ">search</button></div>");
}
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var filter = $$obj[$index];

buf.push("<li class=\"nav-header\"><strong>" + (jade.escape((jade.interp = filter.key) == null ? '' : jade.interp)) + ":</strong></li>");
if (current_filters[filter.key])
{
buf.push("<li><a" + (jade.attrs({ terse: true, 'href':('' + (makeLink(filter.key,"")) + '') }, {"href":true})) + ">All</a></li>");
}
else
{
buf.push("<li class=\"active\"><strong>All</strong></li>");
}
// iterate filter.values
;(function(){
  var $$obj = filter.values;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var value = $$obj[$index];

if (value)
{
buf.push("<li>");
if (current_filters[filter.key] !== String(value.value) )
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (makeLink(filter.key, value.value)) + '') }, {"href":true})) + ">" + (jade.escape((jade.interp = value.text) == null ? '' : jade.interp)) + "</a>");
}
else
{
buf.push("<strong>" + (jade.escape((jade.interp = value.text) == null ? '' : jade.interp)) + "</strong>");
}
buf.push("</li>");
}
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var value = $$obj[$index];

if (value)
{
buf.push("<li>");
if (current_filters[filter.key] !== String(value.value) )
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (makeLink(filter.key, value.value)) + '') }, {"href":true})) + ">" + (jade.escape((jade.interp = value.text) == null ? '' : jade.interp)) + "</a>");
}
else
{
buf.push("<strong>" + (jade.escape((jade.interp = value.text) == null ? '' : jade.interp)) + "</strong>");
}
buf.push("</li>");
}
    }

  }
}).call(this);

if (filter.isString)
{
buf.push("<div><input" + (jade.attrs({ terse: true, 'type':('text'), 'style':('width:217px; !important '), 'name':('' + (filter.key) + ''), 'value':('' + (current_filters[filter.key] || "") + '') }, {"type":true,"style":true,"name":true,"value":true})) + "><button" + (jade.attrs({ terse: true, 'data-href':('' + (makeLink(filter.key, "__replace__")) + ''), "class": [('free_search')] }, {"data-href":true})) + ">search</button></div>");
}
    }

  }
}).call(this);

buf.push("</ul></div></div>");
}
buf.push("</div></div>");
if (!dialog)
{
buf.push("<footer class=\"footer\">");
if (userPanel)
{
buf.push("<p class=\"user-panel\">" + (((jade.interp = userPanel) == null ? '' : jade.interp)) + "</p>");
}
buf.push("<p><a href=\"http://github.com/Empeeric/formage\">Formage</a> " + (jade.escape((jade.interp = version) == null ? '' : jade.interp)) + ", from&nbsp;<a href=\"http://empeeric.com\">Empeeric</a></p><a href=\"http://github.com/Empeeric/formage\"><img" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/images/logo-40.png') }, {"src":true})) + "></a></footer>");
}
buf.push("</div><script>var startIndex = " + (jade.escape((jade.interp = start) == null ? '' : jade.interp)) + ",\n    model = '" + (jade.escape((jade.interp = model_name) == null ? '' : jade.interp)) + "';\n    </script><script" + (jade.attrs({ terse: true, 'src':("" + (rootPath) + "/js/lib/bootbox.min.js") }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':("" + (rootPath) + "/js/model.js") }, {"src":true})) + "></script>" + (((jade.interp = global_script) == null ? '' : jade.interp)) + "</body></html>");;return buf.join("");
}; 

module.exports.models = function anonymous(locals) {
var buf = [];
var locals_ = (locals || {}),pageTitle = locals_.pageTitle,rootPath = locals_.rootPath,renderedHead = locals_.renderedHead,global_head = locals_.global_head,dialog = locals_.dialog,adminTitle = locals_.adminTitle,sections = locals_.sections,userPanel = locals_.userPanel,version = locals_.version,global_script = locals_.global_script;buf.push("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>" + (null == (jade.interp = pageTitle) ? "" : jade.interp) + "</title><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/ui-lightness/jquery-ui-1.10.2.custom.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/bootstrap/css/bootstrap.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/main.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/forms.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/datepicker/datepicker.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/timepicker/timepicker.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/vendor/bootstrap-datetimepicker.min.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/css/maps.css') }, {"rel":true,"href":true})) + "><link" + (jade.attrs({ terse: true, 'rel':('stylesheet'), 'href':('' + (rootPath) + '/select2/select2.css') }, {"rel":true,"href":true})) + "><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/lib/jquery-1.9.1.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/lib/jquery-ui-1.10.2.custom.min.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/bootstrap/js/bootstrap.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/timepicker/bootstrap-timepicker.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/vendor/bootstrap-datetimepicker.min.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/ckeditor/ckeditor.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/datepicker/bootstrap-datepicker.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/js/maps.js') }, {"src":true})) + "></script><script" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/select2/select2.js') }, {"src":true})) + "></script><script src=\"//api.filepicker.io/v1/filepicker.js\"></script><script>var root = '" + (jade.escape((jade.interp = rootPath) == null ? '' : jade.interp)) + "';</script>" + (null == (jade.interp = typeof(renderedHead) != 'undefined' ? renderedHead : '') ? "" : jade.interp) + "" + (((jade.interp = global_head) == null ? '' : jade.interp)) + "</head><body>");
if (!dialog)
{
buf.push("<header class=\"navbar navbar-static-top\"><div class=\"navbar-inner\"><div class=\"container\"><div class=\"btn-group pull-right\"><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/'), "class": [('btn'),('btn-inverse')] }, {"href":true})) + "><i class=\"icon-home icon-white\"></i> Admin</a><a href=\"/\" class=\"btn\"><i class=\"icon-share\"></i> Site</a><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/logout'), "class": [('btn')] }, {"href":true})) + "><div class=\"icon-lock\"></div> Logout</a></div><h1><a" + (jade.attrs({ terse: true, 'href':('' + (rootPath) + '/') }, {"href":true})) + ">" + (jade.escape((jade.interp = adminTitle) == null ? '' : jade.interp)) + "</a></h1></div></div></header>");
}
buf.push("<div class=\"container\"><div id=\"old-version\" style=\"position: fixed;bottom: 1em;right: 1em;width: 30em;height: 4em;border-radius: 10px;display: block;opacity: 0.8;display:none\" class=\"alert alert-error\"><button type=\"button\" data-dismiss=\"alert\" class=\"close\">&times;</button><strong>Warning;</strong> There is a newer version of formage.</div><div id=\"content\">");
// iterate sections
;(function(){
  var $$obj = sections;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var section = $$obj[$index];

buf.push("<div" + (jade.attrs({ terse: true, "class": [((sections.length > 1 ? 'section' : ''))] }, {"class":true})) + ">");
if (sections.length > 1)
{
buf.push("<h2><span>" + (jade.escape((jade.interp = section.name) == null ? '' : jade.interp)) + "</span></h2>");
}
buf.push("<ul class=\"models\">");
// iterate section.models
;(function(){
  var $$obj = section.models;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var model = $$obj[$index];

var url = rootPath + '/model/' + model.modelName
buf.push("<li><div class=\"btn-group pull-right\">");
if (model.is_single)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (url) + '/document/single'), "class": [('btn'),('btn-default')] }, {"href":true})) + ">Edit</a>");
}
else
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':(url), "class": [('btn'),('btn-info')] }, {"href":true})) + "><span" + (jade.attrs({ terse: true, 'id':('viewAll_' + (model.modelName) + '') }, {"id":true})) + ">View All</span></a><a" + (jade.attrs({ terse: true, 'href':('' + (url) + '/document/new'), "class": [('btn'),('btn-default')] }, {"href":true})) + ">New</a>");
}
buf.push("</div><a" + (jade.attrs({ terse: true, 'href':(url + (model.is_single ? '/document/single' : '')) }, {"href":true})) + "><h3>" + (jade.escape((jade.interp = model.label) == null ? '' : jade.interp)) + "</h3></a></li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var model = $$obj[$index];

var url = rootPath + '/model/' + model.modelName
buf.push("<li><div class=\"btn-group pull-right\">");
if (model.is_single)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (url) + '/document/single'), "class": [('btn'),('btn-default')] }, {"href":true})) + ">Edit</a>");
}
else
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':(url), "class": [('btn'),('btn-info')] }, {"href":true})) + "><span" + (jade.attrs({ terse: true, 'id':('viewAll_' + (model.modelName) + '') }, {"id":true})) + ">View All</span></a><a" + (jade.attrs({ terse: true, 'href':('' + (url) + '/document/new'), "class": [('btn'),('btn-default')] }, {"href":true})) + ">New</a>");
}
buf.push("</div><a" + (jade.attrs({ terse: true, 'href':(url + (model.is_single ? '/document/single' : '')) }, {"href":true})) + "><h3>" + (jade.escape((jade.interp = model.label) == null ? '' : jade.interp)) + "</h3></a></li>");
    }

  }
}).call(this);

buf.push("</ul></div>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var section = $$obj[$index];

buf.push("<div" + (jade.attrs({ terse: true, "class": [((sections.length > 1 ? 'section' : ''))] }, {"class":true})) + ">");
if (sections.length > 1)
{
buf.push("<h2><span>" + (jade.escape((jade.interp = section.name) == null ? '' : jade.interp)) + "</span></h2>");
}
buf.push("<ul class=\"models\">");
// iterate section.models
;(function(){
  var $$obj = section.models;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var model = $$obj[$index];

var url = rootPath + '/model/' + model.modelName
buf.push("<li><div class=\"btn-group pull-right\">");
if (model.is_single)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (url) + '/document/single'), "class": [('btn'),('btn-default')] }, {"href":true})) + ">Edit</a>");
}
else
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':(url), "class": [('btn'),('btn-info')] }, {"href":true})) + "><span" + (jade.attrs({ terse: true, 'id':('viewAll_' + (model.modelName) + '') }, {"id":true})) + ">View All</span></a><a" + (jade.attrs({ terse: true, 'href':('' + (url) + '/document/new'), "class": [('btn'),('btn-default')] }, {"href":true})) + ">New</a>");
}
buf.push("</div><a" + (jade.attrs({ terse: true, 'href':(url + (model.is_single ? '/document/single' : '')) }, {"href":true})) + "><h3>" + (jade.escape((jade.interp = model.label) == null ? '' : jade.interp)) + "</h3></a></li>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var model = $$obj[$index];

var url = rootPath + '/model/' + model.modelName
buf.push("<li><div class=\"btn-group pull-right\">");
if (model.is_single)
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':('' + (url) + '/document/single'), "class": [('btn'),('btn-default')] }, {"href":true})) + ">Edit</a>");
}
else
{
buf.push("<a" + (jade.attrs({ terse: true, 'href':(url), "class": [('btn'),('btn-info')] }, {"href":true})) + "><span" + (jade.attrs({ terse: true, 'id':('viewAll_' + (model.modelName) + '') }, {"id":true})) + ">View All</span></a><a" + (jade.attrs({ terse: true, 'href':('' + (url) + '/document/new'), "class": [('btn'),('btn-default')] }, {"href":true})) + ">New</a>");
}
buf.push("</div><a" + (jade.attrs({ terse: true, 'href':(url + (model.is_single ? '/document/single' : '')) }, {"href":true})) + "><h3>" + (jade.escape((jade.interp = model.label) == null ? '' : jade.interp)) + "</h3></a></li>");
    }

  }
}).call(this);

buf.push("</ul></div>");
    }

  }
}).call(this);

buf.push("</div>");
if (!dialog)
{
buf.push("<footer class=\"footer\">");
if (userPanel)
{
buf.push("<p class=\"user-panel\">" + (((jade.interp = userPanel) == null ? '' : jade.interp)) + "</p>");
}
buf.push("<p><a href=\"http://github.com/Empeeric/formage\">Formage</a> " + (jade.escape((jade.interp = version) == null ? '' : jade.interp)) + ", from&nbsp;<a href=\"http://empeeric.com\">Empeeric</a></p><a href=\"http://github.com/Empeeric/formage\"><img" + (jade.attrs({ terse: true, 'src':('' + (rootPath) + '/images/logo-40.png') }, {"src":true})) + "></a></footer>");
}
buf.push("</div><script" + (jade.attrs({ terse: true, 'src':("" + (rootPath) + "/js/models.js") }, {"src":true})) + "></script><script type=\"text/javascript\">$.getJSON('http://registry.npmjs.org/formage/latest?jsonp=?').done(function (pack) {\n    var version = '" + (jade.escape((jade.interp = version) == null ? '' : jade.interp)) + "';\n    var latest = pack.version;\n    if (latest > version)\n        $('#old-version').show('slow');\n});</script>" + (((jade.interp = global_script) == null ? '' : jade.interp)) + "</body></html>");;return buf.join("");
}; 

