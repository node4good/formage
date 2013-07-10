$(function () {
    $('#deleteButton').click(function () {
        $('#deleteButton').button('loading');
        $.post(
            root + '/json/dependencies',
            {
                model: window.model,
                id: $('#document_id').val()
            },
            function (result) {
                var msg = result.length
                    ? 'there are some entities related to this entity: "' + result.join(', ') + '"'
                    : 'Are you sure you want to delete?';

                bootbox.confirm(msg, function (res) {
                    if (!res) return $('#deleteButton').button('reset');
                    return $.ajax({
                        type: 'DELETE',
                        url: root + '/json/model/' + model + '/document?document_id=' + encodeURIComponent($('#document_id').val()),
                        success: function () {
                            $('#deleteButton').button('reset');
                            location.href = location.href.split('/document/')[0];
                        },
                        error: function (xhr, textStatus) {
                            $('#deleteButton').button('reset');
                            alert('Unable to delete');
                            console.error('Deleting error', arguments);
                        }
                    });
                })
            }
        );
    });
});
