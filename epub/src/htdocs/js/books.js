var onDownloadClick = function () {

    var $book = $(this);

    var $btn = $book.find('span.downloadBtn');

    if ($btn.hasClass('disabled')) return;

    var $buttons = $('span.downloadBtn');

    $buttons.addClass('disabled');

    showSpinner($btn);

    var id = this.id;

    var onDone = function () {

        $buttons.removeClass('disabled');

        hideSpinner($btn);
    };

    $.ajax({

        url: '/generate/' + id,
        async: true,

        success: function (data) {

            onDone();

            document.location.href = '/download/' + id;
        },
        error: function (jqXHR, textStatus, errorThrown) {

            onDone();
        }
    });
};

$(function () {

    var $bookList = $('ul#bookList');

    $bookList.on('click', 'li.book', onDownloadClick);
});