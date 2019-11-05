/****************************************************************************
leaflet-bootstrap-control-zoom.js

Create a zoom-control inside a bsButtonBox
Can be used as leaflet standard zoom control with Bootstrap style

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    /********************************************************************************
    L.Control.bsZoom
    ********************************************************************************/
    L.Control.BsZoom = L.Control.Zoom.extend({
        options: {
            text     : '&#177;', // = +/- char
            bigIcon  : true,
            position : 'bottomright',
            width    : 'auto',
            extended : true,
            semiTransparent: false,
            returnFromClick: true,

            zoomInTitle : '',
            zoomOutTitle: '',

popupList: [{type:'check', text:'Davs'}],
            content: null
        },

        onAdd: function (map) {
            var zoomResult = L.Control.Zoom.prototype.onAdd.call(this, map ),
                $zoomResult = $(zoomResult),
                bsButtonBox = L.control.bsButtonBox(this.options),
                result = bsButtonBox.onAdd( map ),
                $contentContainer = bsButtonBox.$contentContainer;

            this.bsButtonBox = bsButtonBox;
            this.bsButtonBox._container = result;

            //Adjust container to be a button-group container
            var bsButtonGroupClassNames = $.bsButtonGroup({vertical:true, center:true}).attr('class');
            $contentContainer.addClass( bsButtonGroupClassNames );

            //Adjust buttons to bsButton and move to new container
            var bsButtonClassNames = $.bsButton({square: true, bigIcon: true}).attr('class');
            $zoomResult.children()
                .removeClass()
                .addClass(bsButtonClassNames)
                //Fire event on control-container because Leaflet prevent propergation
                .on('touchstart mousedown contextmenu', function(event){
                    $(map._controlContainer).trigger(event.type+".jbs.popover");
                })
                .appendTo( $contentContainer );

            //Create zoom-slider between zoom-out and zoom-in buttons
            this._slider = $('<input type="text"/>');
            this._slider.insertAfter( $(this._zoomInButton) );

            this._slider.bootstrapSlider({
                orientation : 'vertical',
                reversed    : true,
                handle      : 'not-used',
                tooltip     : 'hide'
            });

            //Set style for slider-handle as bsButton
            $(this._slider.bootstrapSlider('getElement'))
                .children('.slider-handle')
                    .addClass( bsButtonClassNames )
                    .html( '<hr/>');

            this._slider.on('change', $.proxy(this._onSliderChange, this));
            this._slider.on('slideStart', $.proxy(this._onSlideStart, this));
            this._slider.on('slideStop', $.proxy(this._onSlideStop, this));
            map.on('zoomlevelschange', this._setSliderRange, this);

            return result;
        },

        onRemove: function (map) {
            map.off('zoomlevelschange', this._setSliderRange, this);
            this.bsButtonBox.onRemove(map);
            return L.Control.Zoom.prototype.onRemove.call(this, map );
        },

        _onSlideStart: function(){
            this.isSliding = true;
        },
        _onSlideStop: function(){
            this.isSliding = false;
        },

        _onSliderChange: function(event){
            this._map.setZoom(event.value.newValue, {
                animate    : !this.isSliding,
                noMoveStart: !this.isSliding
            });
        },

        _setSliderRange: function(){
            var map = this._map,
                minZoom = map.getMinZoom(),
                maxZoom = map.getMaxZoom();

            //Update min and max
            this._slider
                .bootstrapSlider('setAttribute', 'min',   minZoom)
                .bootstrapSlider('setAttribute', 'max',   maxZoom)
                .bootstrapSlider('setAttribute', 'step',  map.options.zoomSnap);

            this._updateSlider();
        },

        _updateSlider: function(){
            var zoom = this._map.getZoom();
            if (this._slider)
                this._slider.bootstrapSlider('setValue', zoom);

        },

        _updateDisabled: function () {
            var map      = this._map,
                zoom     = map.getZoom(),
                disabled = !!this._disabled;

            this.$zoomInButton = this.$zoomInButton || $(this._zoomInButton);
            this.$zoomInButton.toggleClass ( 'disabled', disabled || (zoom === map.getMaxZoom()) );

            this.$zoomOutButton = this.$zoomOutButton || $(this._zoomOutButton);
            this.$zoomOutButton.toggleClass( 'disabled', disabled || (zoom === map.getMinZoom()) );

            this._updateSlider();

        }

   });//end of L.Control.BsZoom


    //********************************************************************************
    L.Map.mergeOptions({
        bsZoomControl: false,
        bsZoomOptions: {}
    });

    L.Map.addInitHook(function () {
        if (this.options.bsZoomControl) {
            this.bsZoomControl = L.control.bsZoom(this.options.bsZoomOptions);
            this.addControl(this.bsZoomControl);
        }
    });

    L.control.bsZoom = function(options){ return new L.Control.BsZoom(options); };

}(jQuery, L, this, document));

