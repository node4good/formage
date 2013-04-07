var deleteDocument = function() {
    $('#deleteButton').button('loading');
    $.post(
        root + '/json/dependencies',
        {
            model: model,
            id: $('#document_id').val()
        },
        function(result){
            var msg = result.length
                ? 'there are some entities related to this entity: "' + result.join(', ') + '"'
                : 'Are you sure you want to delete?';

            if (confirm(msg))
                $.ajax({
                    type: 'DELETE',
                    url: root + '/json/model/' + model + '/document?document_id=' + encodeURIComponent($('#document_id').val()),
                    success: function(result) {
                        $('#deleteButton').button('reset');
                        location.href = location.href.split('/document/')[0];
                    },
                    error: function(xhr, textStatus) {
                        $('#deleteButton').button('reset');
                        alert('Unable to delete');
                        console.error('Deleting error', arguments);
                    }
                });
            else
                $('#deleteButton').button('reset');
        }
    );
};

$(function() {
    $('#deleteButton').click(deleteDocument);

    // ctrl+save to save
    //    $(window).keypress(function(e) {
    //        if (e.which == 115 && e.ctrlKey || event.which == 19) {
    //            e.preventDefault();
    //            $('form#document').submit();
    //            return false;
    //        }
    //    });
});