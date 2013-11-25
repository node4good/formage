$(function () {
    if (!window.FILEPICKER_API_KEY) return;
    filepicker.setKey(window.FILEPICKER_API_KEY);
    if (window.AVIARY_API_KEY) {
        var featherEditor = new Aviary.Feather({
            apiKey: window.AVIARY_API_KEY,
            apiVersion: 3,
            theme: 'dark', // Check out our new 'light' and 'dark' themes!
            tools: 'resize,crop,enhance',
            appendTo: '',
            onSave: function (imageID, newURL) {
                var preview = document.getElementById(imageID);
                var InkBlob = preview.InkBlob;
                InkBlob.url = newURL;
                preview.src = newURL;
                var inputID = imageID.replace('_thumb', '');
                document.getElementById(inputID).value = JSON.stringify(InkBlob);
                featherEditor.close();
            }
        });
    }

    window.trigger_filepicker = function trigger_filepicker(imageID) {
        filepicker.pick({mimetype: 'image/*'}, function (InkBlob) {
            var preview = document.getElementById(imageID);
            preview.src = InkBlob.url;
            preview.InkBlob = InkBlob;
            if (featherEditor) {
                featherEditor.launch({image: imageID, url: InkBlob.url});
            } else {
                var inputID = imageID.replace('_thumb', '');
                document.getElementById(inputID).value = JSON.stringify(InkBlob);
            }

        });
    }
});
