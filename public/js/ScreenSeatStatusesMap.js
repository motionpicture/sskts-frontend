"use strict";
(function () {
    var ScreenSeatStatusesMap = function (target) {
        this.screen = target;
        this.scale = 0;
        this.init();
        this.setEvent();
    }
    
    ScreenSeatStatusesMap.prototype = {
        //初期化
        init: function () {
            this.state = ScreenSeatStatusesMap.STATE_DEFAULT;
            this.scaleDown();
        },
        //イベント登録
        setEvent: function () {
            var _this = this;
            this.screen.on('click', '.screen-inner', function(event) {
                event.preventDefault();
                if (!_this.isZoom() && $('.screen .device-type-sp').is(':visible')) {
                    var scroll = _this.screen.find('.screen-scroll');
                    var pos = {
                        x: event.clientX - scroll.offset().left,
                        y: event.clientY - scroll.offset().top
                    };                    
                    var scrollPos = {
                        x: pos.x / _this.scale - _this.screen.width() / 2,
                        y: pos.y/ _this.scale - _this.screen.height() / 2,
                    }
                    _this.scaleUp();
                    scroll.scrollLeft(scrollPos.x);
                    scroll.scrollTop(scrollPos.y);
                    // _this.screen.find('.screen-scroll').animate({
                    //     scrollLeft: scrollPos.x, scrollTop: scrollPos.y
                    // }, 300);
                }
            });
            $(window).on('resize', function() {
                _this.init();
            });
        },
        //拡大
        scaleUp: function () {
            var scroll = this.screen.find('.screen-scroll');
            var inner = this.screen.find('.screen-inner');
            this.state = ScreenSeatStatusesMap.STATE_ZOOM;
            this.screen.addClass('zoom');
            this.scale = 1;
            scroll.css({transform:'scale('+ this.scale +')'});
        },
        //縮小
        scaleDown: function () {
            var scroll = this.screen.find('.screen-scroll');
            var inner = this.screen.find('.screen-inner');
            this.state = ScreenSeatStatusesMap.STATE_DEFAULT;
            this.screen.removeClass('zoom');
            this.scale = this.screen.width() / inner.width();
            scroll.height(inner.height() * this.scale);
            scroll.css({
                transformOrigin: '0 0',
                transform:'scale('+ this.scale +')'
            });
        },
        //拡大判定
        isZoom: function() {
            var result = false;
            if (this.state === ScreenSeatStatusesMap.STATE_ZOOM) result = true;
            return result;
        }
    };
    
    ScreenSeatStatusesMap.STATE_DEFAULT = 0;
    ScreenSeatStatusesMap.STATE_ZOOM = 1;
    SASAKI = SASAKI || {};
    SASAKI.ScreenSeatStatusesMap = ScreenSeatStatusesMap;
}());
