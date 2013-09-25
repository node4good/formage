$(function() {
    $.each($('.model'), function(k, v) {
        var self = $(this);
        $.ajax({type:   'GET',
            url:    root + '/json/documents',
            data:   'collection=' + encodeURIComponent($(this).attr('rel')) +
                '&start=0&count=5',
            success:function(results) {
                $('#viewAll_' + self.attr('rel')).html('View All ' + results.totalCount);
                self.html('');
                var table = $('<table />');
                $.each(results.documents, function(k, v) {
                    var row = $('<tr />');
                    var i = 0;
                    for (j in v) {
                        if (j != '_id') {
                            if (i === 0) {
                                row.append($('<td />').append($('<a />').attr('href', root + '/model/' + self.attr('rel') + '/document/' + v['_id']).html(v[j])));
                            } else {
                                row.append($('<td />').html(v[j]));
                            }
                            i += 1;
                        }
                    }
                    table.append(row);
                });
                self.append(table);
            },
            error:  function() {
                alert('error');
            }
        });
    });
});