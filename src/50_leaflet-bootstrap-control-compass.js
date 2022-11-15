/****************************************************************************
leaflet-bootstrap-compass-device.js

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var testMode = false;

    /*******************************************
    L.Control.BsCompass
    *******************************************/
    //To prevent the control from being updated to mush the control is only updated every bsCompassUpdateInterval ms
    var bsCompassUpdateInterval = 1000;



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

            semiTransparent : true,
            //transparent : true,

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
                width               : 156,
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

            //Link to format for direction
            if (this.options.selectFormat)
                this.options.content.footer =
                    {type:'button', closeOnClick: true, icon: 'fa-cog', text: {da:'Format...', en:'Format...'}, onClick: $.proxy(this.options.selectFormat, this)};



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
                    da: 'Det var ikke muligt at bestemme din enheds&nbsp;orientering',
                    en: 'It was not possible to detect the orientation of your&nbsp;device'
                }
            });


            this.needToUpdateControl = true;
            //Add interval to allow updating the DOM
            if (!this.intervalId)
                this.setIntervalId = window.setInterval( $.proxy( this.updateControl, this), bsCompassUpdateInterval) ;


            if (testMode){
                var _this = this;
                window.setInterval( function(){
                    _this.update({ deviceorientation: 360*Math.random() });
                }, 2);

            }
            else
                window.geolocation.onDeviceorientation(this.update, this);

            return result;
        },

        onRemove: function(){
            this.needToUpdateControl = false;
            if (this.intervalId){
                window.clearInterval(this.intervalId);
                this.intervalId = null;
            }

            return L.Control.BsButtonBox.prototype.onRemove ? L.Control.BsButtonBox.prototype.onRemove.apply(this, arguments) : this;
        },

        /*******************************************
        update
        *******************************************/
        update: function( event = {}) {
            var orientation = event.deviceorientation || (event.deviceorientation === 0) ? event.deviceorientation : null,
                orientationExists = orientation !== null,
                orientationEventType = event.type || '',
                orientationSecondary = orientationEventType.toUpperCase().includes("SECONDARY");

            if ( (orientation          !== this.orientation) ||
                 (orientationExists    !== this.orientationExists) ||
                 (orientationEventType !== this.orientationEventType) ||
                 (orientationSecondary !== this.orientationSecondary) ){

                this.orientation          = orientation;
                this.orientationExists    = orientationExists;
                this.orientationEventType = orientationEventType;
                this.orientationSecondary = orientationSecondary;

                this.needToUpdateControl = true;
            }
        },


        updateControl: function(){
            if (this.needToUpdateControl){
                this.needToUpdateControl = false;

                this.bsButton.parent().toggleClass('no-device-orientation', !this.orientationExists);

                if (this.orientationExists){
                    $('html')
                        .toggleClass('orientation-primary',   !this.orientationSecondary)
                        .toggleClass('orientation-secondary',  this.orientationSecondary);

                    this.$container.find('.rotate').css('transform', 'rotate('+ this.orientation + 'deg)');
                    this.$container.find('.rotate-compass').css('transform', 'rotate('+ -1*this.orientation + 'deg)');

                    var offset = 0;
                    switch (this.orientationEventType){
                        case 'portrait-primary'     : offset =   0; break;
                        case 'portrait-secondary'   : offset = 180; break;
                        case 'landscape-primary'    : offset =  90; break;
                        case 'landscape-secondary'  : offset = 270; break;
                    }

                    var orientation = Math.round( (this.orientation + offset +360) % 360 );

                    this.options.setOrientationNumber(orientation, this.$orientation, this);
                }
            }

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