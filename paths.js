
var path_join = function() {
    var str = '';
    for(var i=0; i<arguments.length; i++)
    {
        var comp = arguments[i].replace(/^\//,'').replace(/\/$/,'');
        if(comp == '')
            continue;
        str += '/' + comp;
    }
    return str;
};

exports.registerPaths = function(admin,app, root) {

    var method = function(func){
        return function(req,res){
            func.call(admin,req,res);
        };
    };

    if (root.length > 1) {
        app.get(root, method(admin.index));
    } else {
        app.get('/', method(admin.index));
    }
    app.get(path_join(root, '/login'), method(admin.login));
    app.get(path_join(root, '/logout'), method(admin.logout));
    app.get(path_join(root, '/model/:modelName'), method(admin.model));
    app.get(path_join(root, '/model/:modelName/document/:documentId'), method(admin.document));
    app.post(path_join(root, '/model/:modelName/document/:documentId'), method(admin.documentPost));

    app.post(path_join(root, '/json/login'), method(admin.loginPost));
    app.post(path_join(root, '/json/dependencies'), method(admin.checkDependencies));
    app.post(path_join(root, '/json/model/:collectionName/order'), method(admin.orderDocuments));
    app.post(path_join(root, '/json/model/:modelName/action/:actionId'), method(admin.actionDocuments));
    app.delete(path_join(root,  '/json/model/:collectionName/document'), method(admin.deleteDocument));
};
