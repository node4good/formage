$(function() {
    $('#username').focus();

    $('form').submit(function(e) {
        e.preventDefault();
        $('#loginButton').button('loading');

        $.ajax({
            type: 'POST',
            url: root + '/json/login',
            data: $(this).serialize(),
//            timeout: 5000,
            success: function(result) {
                location.href = root + '/';
            },
            error: function(xhr, textStatus) {
                $('#loginButton').button('reset');
                console.error('Login error', arguments);
                alert('Login Error');
            }
        });
    });
});