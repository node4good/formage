!function ($) {
    $.parseQueryString = function parseQueryString() {
        var search = unescape(location.search).substr(1);
        var params = search.split("&");
        var ret = {};
        for (var i = 0; i < params.length; i++) {
            var pair = params[i].split("=");
            if (!pair[0].length) continue;
            ret[pair[0]] = pair[1];
        }
        ret.toParam = function () {return '?' + $.param(this);}
        return ret;
    }
}(jQuery);
