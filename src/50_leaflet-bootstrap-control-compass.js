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
            iconCompass: 'fa-arrow-alt-circle-up', //'fa-compass lb-compass-adjust',

            extraLargeIcon: true,
            bigSquare     : true,

            class: 'lb-compass-btn no-device-orientation rotate',

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
                width               : 140,
                content             : '<div class="lb-conpass-content"></div><div class="lb-conpass-content-error" style="display:none; text-align:center"></div>',
            },

            adjustOrientationElement: function(/* $element, control */){
                //Adjust ther element displaying the orientation as text - Can be set by other
            },
            setOrientationNumber: function( orientation, $element/*, control */){
                $element.html(orientation+'&deg;');
            }

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


            /*
            Create info-cont = 3x2 boxes with
              |  Fixed device   |       Arrow       | Rotated device |
              | Rotated compass | Direction as text | Fixed compas   |
            */

            var $modalContent =
                    this.$contentContainer.bsModal.$content.find('.lb-conpass-content');

            $modalContent.addClass('d-flex flex-row flex-wrap justify-content-center');

            var $div;
            function createDiv(){
                $div = $('<div/>');
                $div.appendTo($modalContent);
            }

            function createButton(icon, className = ''){
                createDiv();
                var $button = $.bsButton({
                        bigIcon    : true,
                        square     : true,
                        noBorder   : true,
                        noShadow   : true,
                        transparent: true,
                        class      : 'disabled show-as-normal ' + className,
                        icon       : icon
                    });
                $div.append($button);
                return $button;
            }


            //Fixed device
            createButton(this.options.icon, 'lb-compass-btn fixed');

            //Arrow
            createButton(this.options.icons.arrow);

            //Rotated device
            createButton(this.options.icon, 'lb-compass-btn rotate');


            //Rotated compass
            createButton(this.options.iconCompass  + ' the-compass', 'rotate-compass');

            //Direction as text
            createDiv();
            this.$orientation = $div;
            this.options.adjustOrientationElement(this.$orientation, this);

            //Fixed compas
            createButton(this.options.iconCompass);


            //Create error-info
            this.$contentContainer.bsModal.$content.find('.lb-conpass-content-error')._bsAddHtml({
                text: {
                    da: 'Det var ikke muligt at bestemme din enheds orientering',
                    en: 'It was not possible to detect the orientation of your device'
                }
            });

            window.geolocation.onDeviceorientation(this.update, this);

            return result;
        },

        /*******************************************
        update
        *******************************************/
        update: function( event = {}) {

            var orientation = event.deviceorientation || (event.deviceorientation === 0) ? event.deviceorientation : null,
                orientationSecondary = (event.type || '').toUpperCase().includes("SECONDARY");

            /* test
            orientation = 160;
            orientationSecondary = true;
            */

            $('html')
                .toggleClass('orientation-primary',   !orientationSecondary)
                .toggleClass('orientation-secondary',  orientationSecondary);

            this.$container.find('.rotate').css('transform', 'rotate('+ (orientation || 0) + 'deg)');
            this.$container.find('.rotate-compass').css('transform', 'rotate('+ -(orientation || 0) + 'deg)');

            this.bsButton.parent().toggleClass('no-device-orientation', orientation === null);

            this.options.setOrientationNumber(orientation, this.$orientation, this);

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