if (window.Aviary) window.featherEditor = new Aviary.Feather({
    apiKey: window.AVIARY_API_KEY,
    apiVersion: 3,
    theme: 'dark', // Check out our new 'light' and 'dark' themes!
    tools: 'resize,crop,enhance',
    appendTo: '',
    onSave: function (imageID, newURL) {
        var preview = document.getElementById(imageID);
        var OrigInkBlob = preview.InkBlob;
        window.filepicker.writeUrl(OrigInkBlob, newURL, function (NewInkBlob) {
            preview.src = NewInkBlob.url;
            var inputID = imageID.replace('_thumb', '');
            var $input = $('#' + inputID);
            $input.val(JSON.stringify(NewInkBlob));
            $input.parent().find('a').attr('href', NewInkBlob.url).text(NewInkBlob.filename);
            featherEditor.close();
        });
    }
});

function trigger_filepicker(imageID) {
    window.filepicker.pick({mimetype: 'image/*'}, function (InkBlob) {
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
