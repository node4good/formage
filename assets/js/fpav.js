if (window.Aviary) window.featherEditor = new Aviary.Feather({
    apiKey: window.AVIARY_API_KEY,
    apiVersion: 3,
    theme: 'dark', // Check out our new 'light' and 'dark' themes!
    tools: 'resize,crop,enhance',
    appendTo: '',
    onSave: function (imageID, newURL) {
        var $image = $(document.getElementById(imageID));
        var OrigInkBlob = $image[0].InkBlob;
        window.filepicker.writeUrl(OrigInkBlob, newURL, function (NewInkBlob) {
            $image.attr('src', NewInkBlob.url + '?' + Date.now());
            var $input = $image.parent().parent().find('input');
            $input.val(JSON.stringify(NewInkBlob));
            $input.parent().find('a.file-link').attr('href', NewInkBlob.url);
            featherEditor.close();
        });
    }
});


function handle_file_picked($field, InkBlob) {
    var $image = $field.find('img.thumb-picker');
    $image.attr('src', InkBlob.url);
    $image[0].InkBlob = InkBlob;
    $field.find(".picker").text('Pick New File');
    $field.find(".editor").show();
    $field.find(".clearer").show();

    if (featherEditor) {
        featherEditor.launch({image: $image[0], url: InkBlob.url});
    } else {
        $field.find('input').val(JSON.stringify(InkBlob));
    }
}


function trigger_filepicker(e) {
    var $field = $(e.target).parent().parent();
    window.filepicker.pick({mimetype: 'image/*'}, handle_file_picked.bind(null, $field));
}


function trigger_refilepicker(e) {
    var $field = $(e.target).parent().parent();
    var serInkBlob = $field.find('input').val();
    var InkBlob = JSON.parse(serInkBlob);
    handle_file_picked($field, InkBlob);
}


function trigger_clearpicker(e) {
    var $field = $(e.target).parent().parent();
    $field.find('input').val('');
    $field.find(".picker").text('Pick File');
    $field.find(".editor").hide();
    $field.find(".clearer").hide();
    $field.find('img.thumb-picker').attr('src', 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D');
    $field.find('a.file-link').attr('href', '#')
}
