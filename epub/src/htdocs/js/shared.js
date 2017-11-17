var Dom = {

    createElement: function (type, cssClass) {

        var $element = $(document.createElement(type));

        if (cssClass) {

            $element.addClass(cssClass);
        }

        return $element;
    },

    li: function (cssClass) {

        return this.createElement('li', cssClass);
    },

    ul: function (cssClass) {

        return this.createElement('ul', cssClass);
    },

    div: function (cssClass) {

        return this.createElement('div', cssClass);
    },

    option: function (cssClass) {

        return this.createElement('option', cssClass);
    },

    span: function (cssClass) {

        return this.createElement('span', cssClass);
    },

    input: function (cssClass) {

        return this.createElement('input', cssClass);
    }
};

var isAniSupported = function () {

    return 'WebkitTransform' in document.body.style ||
        'MozTransform' in document.body.style ||
        'OTransform' in document.body.style ||
        'transform' in document.body.style;
};

var showSpinner = function ($element) {

    var $icon = $element.find('.ui-icon');

    $icon.hide();

    var aniSupported = isAniSupported();

    var className = aniSupported ? 'spinner' : 'loading';

    var $spinner = $icon.parent().find('.' + className);

    if ($spinner.length) return;

    $spinner = Dom.span(className);

    if (aniSupported) {

        for (var i = 1; i < 9; i++) {

            var $frame = Dom.div();
            $frame.attr('id', 'frame' + i)
                .addClass('blockG')
                .appendTo($spinner);
        }
    }

    $spinner.insertAfter($icon);
};

var hideSpinner = function ($element) {

    var $icon = $element.find('.ui-icon');

    var aniSupported = isAniSupported();

    var className = aniSupported ? 'spinner' : 'loading';

    var $spinner = $icon.parent().find('.' + className);

    if ($spinner.length == 0) return;

    $spinner.remove();
    $icon.show();
};