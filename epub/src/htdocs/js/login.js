function isTouchDevice() {

    if (typeof window.ontouchstart === 'undefined') {

        return false;
    }

    if (!navigator.userAgent.match(/Linux/)) {

        return false;
    }

    if (!navigator.userAgent.match(/Mobile Safari/)) {

        return false;
    }

    return true;
}

$(function () {

    var $select = $('select');

    $select.chosen();

    var $loginBtn = $('span#login');

    var $form = $('form');

    $loginBtn.click(function () {

        showSpinner($loginBtn);

        $form.submit();
    });

    $form.keyup(function (e) {

        if (e.keyCode !== 13) return;

        $loginBtn.click();
    })

    var $error = $('div#errorWrapper');

    if ($error.length) {

        var doHide = function () {

            $error.fadeOut(1000);
        };

        setTimeout(doHide, 3000);
    }

    var $nameInput = $('input#name');

    var $focusInput = $nameInput;

    if (isTouchDevice()) {

        var $passInput = $('input#pass');

        $.each([$nameInput, $passInput], function (_, $input) {

            var $wrapper = Dom.span('inputWrapper');

            var $numInput = Dom.input('shown');

            var randStr = Math.random().toString(36).substring(3);

            var onChange = function () {

                $numInput.val(this.value);
            };

            $input.replaceWith($wrapper)
                .appendTo($wrapper)
                .addClass('hidden')
                .attr('id', randStr)
                .attr('type', 'number')
                .removeAttr('name')
                .bind('blur focus keydown keyup input propertychange', onChange);

            $numInput.insertBefore($input)
                .attr('type', 'password')
                .attr('disabled', 'disabled');
        });

        $form.submit(function (e) {

            e.preventDefault();

            $nameInput.attr('name', 'name');
            $passInput.attr('name', 'pass');

            this.submit();

            return false;
        });
    }

    $focusInput.focus();
});