$(function () {
    totalPrice();
    var modal = new SASAKI.Modal();
    /**
         * 券種クリックイベント
         */
    $(document).on('click', '.modal[data-modal="ticket-type"] a', function (event) {
        event.preventDefault();
        var ticket = $(this).attr('data-ticket');
        var triggerIndex = $('.modal[data-modal="ticket-type"]').attr('data-modal-trigger-index');
        var target = modal.getTrigger().parent().parent().parent();
        target.find('.button')
            .removeClass('button')
            .addClass('ghost-button');
        target.find('dd').attr('data-ticket', ticket)
        target.find('dd a').text(JSON.parse(ticket).ticket_name_kana);
        modal.close();
        totalPrice();
    });

    /**
     * 次へクリックイベント
     */
    $(document).on('click', '.next-button button', function (event) {
        event.preventDefault();
        var result = [];
        var flag = true;
        $('.seats li').each(function (index, elm) {
            var code = $(elm).find('dt').text();
            var ticket = ($(elm).find('dd').attr('data-ticket')) ? JSON.parse($(elm).find('dd').attr('data-ticket')) : null;
            result.push({
                code: code,
                ticket: ticket
            });
            if (!code || !ticket) {
                flag = false;
            }
        });

        if (!flag) {
            alert('未選択');
        } else {
            // location.hrefにpostする
            var form = $('form');
            var dom = $('<input type="hidden" name="seat_codes">').val(JSON.stringify(result));
            form.append(dom);
            form.submit();
        }
    });
})

function totalPrice() {
    var price = 0;
    $('.seats li').each(function (index, elm) {
        if ($(elm).find('dd').attr('data-ticket')) {
            var data = JSON.parse($(elm).find('dd').attr('data-ticket'));
            price += data.sale_price;
        }
    });
    $('.total .price strong').text(price);
}