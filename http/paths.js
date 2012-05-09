var routes = require('./routes/index.js')
    , routesJson = require('./routes/json.js')
    , path = require('path');

var path_join = function()
{
    var str = '';
    for(var i=0; i<arguments.length; i++)
    {
        var comp = arguments[i].replace(/^\//,'').replace(/\/$/,'');
        if(comp == '')
            continue;
        str += '/' + comp;
    }
    return str;
}

exports.registerPaths = function(app, root) {
    if (root.length > 1) {
        app.get(root, routes.index);
    } else {
        app.get('/', routes.index);
    }
    app.get(path_join(root, '/login'), routes.login);
    app.get(path_join(root, '/logout'), routes.logout);
    app.get(path_join(root, '/model/:modelName'), routes.model);
    app.get(path_join(root, '/model/:modelName/document/:documentId'), routes.document);
    app.post(path_join(root, '/model/:modelName/document/:documentId'), routes.document_post);

    app.post(path_join(root, '/json/login'), routesJson.login);
    app.post(path_join(root, '/json/dependencies'), routesJson.checkDependencies);
    app.get(path_join(root, '/json/documents'), routesJson.documents);
    app.post(path_join(root, '/json/model/:collectionName/order'), routesJson.orderDocuments);
    app.post(path_join(root, '/json/model/:collectionName/action/:actionId'), routesJson.actionDocuments);
    app.post(path_join(root, '/json/model/:collectionName/document'), routesJson.createDocument);
    app.put(path_join(root, '/json/model/:collectionName/document'), routesJson.updateDocument);
    app.delete(path_join(root,  '/json/model/:collectionName/document'), routesJson.deleteDocument);
    app.get(path_join(root, '/json/model/:collectionName/linkedDocumentsList'), routesJson.linkedDocumentsList);
}
