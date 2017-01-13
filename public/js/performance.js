$(function () {
    getPerformance();
    $(document).on('click', '.search a', function (event) {
        event.preventDefault();
        getPerformance();
    });
});

function getPerformance() {
    var day = $('.date select').val();
    $.ajax({
        dataType: 'json',
        url: '/performance',
        type: 'POST',
        timeout: 100000,
        data: {
            day: day
        },
        beforeSend: function () {

        }
    }).done(function (res) {
        $('.performances').html('');
        if (res.error) {

        } else {
            var performances = res.result.performances;
            var dom = '';
            for (var i = 0, len = performances.length; i < len; i++) {
                var performance = performances[i];
                dom += '<li>' +
                    '<dl>' +
                        '<dt>鑑賞日 / スクリーン</dt>' +
                        '<dd>' + moment(performance.day).format('YYYY年MM月DD日') + ' / ' + performance.theater_name.ja + ' ' + performance.screen_name.ja + '</dd>' +
                        '<dt>作品名</dt>' +
                        '<dd>' + performance.film.name.ja + '</dd>' +
                        '<dd>' +
                            '<div class="button blue-button">' +
                                '<a href="/purchase/seat?id=' + performance._id + '">' + moment(performance.time_start, 'hmm').format('HH:mm') + ' - ' + moment(performance.time_end, 'hmm').format('HH:mm') + '</a>' +
                            '</div>' +
                        '</dd>' +
                    '</dl>' +
                '</li>';
            };
            $('.performances').append(dom);
        }
    }).fail(function (jqxhr, textStatus, error) {

    }).always(function () {

    });
}