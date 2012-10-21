$(document).ready(function() {
    $('#deleteButton').click(function() {
        $.post(root + '/json/dependencies',{model:"#{modelName}",id:$('#document_id').val()},function(result){
            var msg = result.length ? 'there are some entities related to this entity: "' + result.join(', ') + '"' : 'Are you sure you want to delete?';
            if(window.confirm(msg))
            {
                $.ajax({
                    type:'DELETE',
                    url: root + '/json/model/#{collectionName}/document?document_id=' + encodeURIComponent($('#document_id').val()),
                    success:function(result) {
                        go_back();
                    },
                    error:function(xhr, textStatus) {
                        alert('Unable to delete');
                    }
                });
            }
        });
    });
});