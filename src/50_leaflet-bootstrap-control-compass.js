/****************************************************************************
leaflet-bootstrap-compass-device.js

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    L.Control.BsCompass = L.Control.BsButtonBox.extend({
        options: {
            position: "topcenter",
            prepend : true,

            icons: {
                device   : 'compass-device fa-mobile',
                landscape: 'compass-device-landscape fa-image text-light',
                portrait : 'compass-device-portrait fa-portrait text-light',
                arrow    : 'compass-arrow fa-caret-up'
            },


            extraLargeIcon: true,
            bigSquare     : true,

            class: 'lb-compass-btn no-device-orientation',

            //semiTransparent : true,
            transparent : true,

            content: {
                header          : {
                    icon: 'fa-compass',
                    text: {da: 'Kompas', en: 'Compass'}
                },
                _icons: {
                    extend  : { onClick: function(){/*Empty*/} },
                    diminish: { onClick: function(){/*Empty*/} }
                },
                clickable           : false,
                noVerticalPadding   : false,
                noHorizontalPadding : false,
                scroll              : false,
                semiTransparent     : false, //true,
                width               : 300,
                content             : '<div class="_no-layer">HER</div>',
            },
        },

        /*******************************************
        initialize
        *******************************************/
        initialize: function(options) {
            this.options = $.extend(true, this.options, options);

            if (!this.options.icon){
                var iconList = [];
                $.each(this.options.icons, function(id, iconNames){
                    iconList.push( iconNames);
                });

                iconList.push('fa-slash no-device-orientation-slash');

                this.options.icon = [iconList];
            }
            L.Control.BsButtonBox.prototype.initialize.call(this);
        },

        /*******************************************
        onAdd
        *******************************************/
        onAdd: function(map) {
            var result = L.Control.BsButtonBox.prototype.onAdd.call(this, map);

            this.$modalContent = this.$contentContainer.bsModal.$content;

            window.geolocation.onDeviceorientation(this.update, this);

//HER            var containerList = this.bsButton.find('.container-stacked-icons');

//HERconsole.log(this);


//HER            this.$modalContent = this.$contentContainer.bsModal.$content;

/*
            //Manually implement extend and diminish functionality
            var $header = this.$contentContainer.bsModal.$header;
            this.extendIcon = $header.find('[data-header-icon-id="extend"]');
            this.extendIcon.on('click', $.proxy(this.extendAll, this) );

            this.diminishIcon = $header.find('[data-header-icon-id="diminish"]');
            this.diminishIcon.on('click', $.proxy(this.diminishAll, this) );

            //Add the 'No layer' text
            this.$noLayer = this.$modalContent.find('.no-layer')
                    .i18n({da: 'Ingen ting...', en:'Nothing...'})
                    .addClass('text-center w-100 text-secondary');

            this.update();
*/
            return result;
        },

        /*******************************************
        update
        *******************************************/
        update: function( event = {}) {
            var orientation = event.deviceorientation || (event.deviceorientation === 0) ? event.deviceorientation : null;

            this.bsButton.css('transform', 'rotate('+ (orientation || 0) + 'deg)');
            this.bsButton.toggleClass('no-device-orientation', orientation === null);

var orientation = (screen.orientation || {}).type || screen.mozOrientation || screen.msOrientation;

this.$modalContent.html(
    'w.o= '+window.orientation +
    '<br>w.s.ori= '+window.screen.orientation +
    '<br>w.s.mozOri= '+window.screen.mozOrientation +
    '<br>w.s.msOri= '+window.screen.msOrientation +

    '<br>a= '+event.alpha +
    '<br>b= '+event.beta
);

            return this;
        },

    }); //end of L.Control.BsCompass

    //Install L.Control.BsCompass
    L.Map.mergeOptions({
        bsCompassControl: false,
        bsCompassOptions: {}
    });

    L.Map.addInitHook(function () {
        if (this.options.bsCompassControl){
            this.bsCompassControl = new L.Control.BsCompass( this.options.bsCompassOptions );
            this.addControl(this.bsCompassControl);
        }
    });


}(jQuery, L, this, document));



