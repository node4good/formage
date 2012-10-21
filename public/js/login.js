$(document).ready(function() {
    $('#username').focus();

    $('form').submit(function(e) {
        e.preventDefault();

        var postData = 'username=' + encodeURIComponent($('#username').val()) +
            '&password=' + encodeURIComponent($('#password').val());
        $.ajax({
            type:'POST',
            url: root + '/json/login',
            data: postData,
            success: function(result) {
                location.href = root + '/';
            },
            error: function(xhr, textStatus) {
                alert(textStatus);
            }
        });
    });
});