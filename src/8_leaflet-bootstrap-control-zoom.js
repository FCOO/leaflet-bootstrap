/****************************************************************************
leaflet-bootstrap-control-zoom.js

Create a zoom-control inside a bsButtonBox
Can be used as leaflet standard zoom control with Bootstrap style

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    /********************************************************************************
    L.Control.bsZoom
    Extending default zoom control in a BsButtonBox with
    - Slider  - NOT INCLUDED Wait for leaflet to have "scale-zoom" a la Google maps or OpenLayer
    - History - Inspired by leaflet-history @ https://github.com/cscott530/leaflet-history by Chris Scott https://github.com/cscott530
    - History-modal - Modal window with all zoom/center from history - NOT IMPLEMENTED
    FURTURE POSIBILITIES:
    - Mark center,zoom as Favorites
    - Select from list of Favorites
    ********************************************************************************/
    L.Control.BsZoom = L.Control.BsButtonBox.extend({
        options: {
            position    : 'bottomright',
            zoomInTitle : '',
            zoomOutTitle: '',

            text       : '&#177;', // = +/- char
            bigIcon    : true,
            width      : 'auto',
            extended   : false,
            showSlider : false,
            showHistory: false,

            semiTransparent: false,

            tooltipDirection: 'top',

            popupTrigger: 'contextmenu',
            popupText   : {da:'Inds.', en:'Set.'},

            content     :'',
        },

        initialize: function ( options ) {
            //Adjust options
            if (window.bsIsTouch){
                //Zoom- and history buttons are shown in a bsModal-box
                options.showHistory = true;
                options.content = {
                    clickable          : false,
                    semiTransparent    : true,
                    noVerticalPadding  : true,
                    noHorizontalPadding: true,
                    header: {text: {da:'Zoom/Center', en:'Zoom/Centre'}},
                    content: 'This is not empty'
                };
            }
            else {
                //The Button-Box is allways extended. The history-buttons are hiden/shown using popup
                options.extended   = true;
                options.addOnClose = false;
            }

            //Set default BsButtonBox-options and own options
            L.Control.BsButtonBox.prototype.initialize.call(this, options);
            L.Util.setOptions(this, options);

            //Adjust popupPlacement to position
            function includes(pos, substring){
                return pos.indexOf(substring) !== -1;
            }
            var pos = this.options.position.toUpperCase(),
                placement = '';

            if (pos == "TOPCENTER") placement = 'bottom';
            else if (pos == "BOTTOMCENTER") placement = 'top';
            else if (includes(pos, 'LEFT')) placement = 'right';
            else if (includes(pos, 'RIGHT')) placement = 'left';

            this.options.popupPlacement = placement;

            if (includes(pos, 'TOP'))
                this.options.tooltipDirection = 'bottom';

            //Set popup-item(s)
            if (!window.bsIsTouch){
                this.options.popupList = [
//                    {text: 'Zoom'},
//                    {type:'checkbox', text: {da:'Vis skylder', en:'Show slider'}, selected: this.options.showSlider, onChange: $.proxy(this._showSlider, this), closeOnClick: true},
                    {type:'checkbox', text: {da:'Vis historik-knapper', en:'Show History Buttons'}, selected: this.options.showHistory, onChange: $.proxy(this._showHistory, this), closeOnClick: true},
//                    {type:'content',  content: $historyContent,                   closeOnClick: false, lineBefore: true}
                ];
            }
        },


        onAdd: function(map){
            //Create default leaflet zoom-control
            this.zoom = L.control.zoom({zoomInTitle: '', zoomOutTitle: '', position: this.options.position });

            //Overwrite default _updateDisabled
            this.zoom._updateDisabled = $.proxy(this._updateDisabled, this);

            //Add zoom-control to map
            this.zoom.addTo(map);

			var result = L.Control.BsButtonBox.prototype.onAdd.call(this, map ),
                //If touch-mode => Create the content inside the bsModal-body else create it inside the control
                $contentContainer = window.bsIsTouch ? this.$contentContainer.bsModal.$body : this.$contentContainer;

            $contentContainer.empty();

            //Adjust zoom-container to be a button-group container and move to new container and adjust zoom-buttons to bsButton
            var bsButtonGroupClassNames = $.bsButtonGroup({vertical:true, center:true}).attr('class'),
                bsButtonClassNames = $.bsButton({square: true, bigIcon: true}).attr('class'),
                $zoomContainer = $(this.zoom._container);

            $zoomContainer
                .removeClass()
                .addClass( bsButtonGroupClassNames )
                .appendTo( $contentContainer );

            $zoomContainer.children()
                .removeClass()
                .addClass( bsButtonClassNames );

            //$-elements with popup buttons to go back/to first and go forward/to last. Will be set later
            var $backButtons, $forwardButtons;

            //Create historyList to save a list of center,zoom from the map
            this.historyList = new window.HistoryList({
                action  : $.proxy(this._setZoomCenter, this ),
                onUpdate: function( backAvail, forwardAvail ){
                    if (!$backButtons) return;
                    $backButtons.toggleClass('disabled', !backAvail );
                    $forwardButtons.toggleClass('disabled', !forwardAvail );
                },
                compare: function(zoomCenter1, zoomCenter2){
                    return (zoomCenter1.zoom == zoomCenter2.zoom) && zoomCenter1.center.equals(zoomCenter2.center);
                }

            });

            //Append history-buttons as two vertical bsButtonGroup
            var buttonGroupOptions = {
                class   : 'show-for-history',
                vertical: true,
                center  : true,
                buttonOptions: {
                    square: true
                },
            };

            $forwardButtons =
                $.bsButtonGroup( $.extend(buttonGroupOptions, {
                    list: [
                        {id:'history_last',    icon: 'fa-arrow-to-right' , onClick: $.proxy(this.historyList.goLast,    this.historyList) },
                        {id:'history_forward', icon: 'fa-arrow-right'    , onClick: $.proxy(this.historyList.goForward, this.historyList) },
                    ]} )
                )
                    .css('margin-right', '2px')
                    .prependTo($contentContainer)
                    .find('.btn')
                        .addClass('disabled')
                        .css({
                            'border-top-left-radius': '0px',
                            'border-bottom-left-radius': '0px'
                        });

            $backButtons =
                $.bsButtonGroup( $.extend(buttonGroupOptions, {
                    list: [
                        {id:'history_first', icon: 'fa-arrow-to-left', onClick: $.proxy(this.historyList.goFirst, this.historyList) },
                        {id:'history_back',  icon: 'fa-arrow-left'   , onClick: $.proxy(this.historyList.goBack,  this.historyList) },
                    ]} )
                )
                    .prependTo($contentContainer)
                    .find('.btn')
                        .addClass('disabled')
                        .css({
                            'border-top-right-radius': '0px',
                            'border-bottom-right-radius': '0px'
                        });

            $contentContainer.find('.btn-group-vertical').css('margin-top', 0);

            this._showHistory( '', this.options.showHistory);

/* SLIDER REMOVED FOR NOW. Waits for better slider-zoom in leaflet
            //Create zoom-slider between zoom-out and zoom-in buttons
            this._slider = $('<input type="text"/>');
            this._slider.insertAfter( $(this.zoom._zoomInButton) );

            this._slider.bootstrapSlider({
                orientation : 'vertical',
                reversed    : true,
                handle      : 'not-used',
                tooltip     : 'hide'
            });

            //Set style for slider-handle as bsButton
            this.$sliderContainer = $(this._slider.bootstrapSlider('getElement'));
            this.$sliderContainer
                .children('.slider-handle')
                    .addClass( bsButtonClassNames )
                    .html( '<hr/>');

            this._slider.on('change', $.proxy(this._onSliderChange, this));
            this._slider.on('slideStart', $.proxy(this._onSlideStart, this));
            this._slider.on('slideStop', $.proxy(this._onSlideStop, this));
            map.on('zoomlevelschange', this._setSliderRange, this);

            this._showSlider('', this.options.showSlider);
*/
            map.whenReady(this._onLoad, this);

            return result;
        },

        onRemove: function (map) {
            map.off('moveend', this._onMoveEnd, this);
        },

        _getZoomCenter: function() {
            return {
                zoom  : this._map.getZoom(),
                center: this._map.getCenter()
            };
        },
        _setZoomCenter: function( zoomCenter ) {
            this._map.setView( zoomCenter.center, zoomCenter.zoom, {animate: false} );
        },

        _onLoad: function(){
            this._map.on('moveend', this._onMoveEnd, this);
            this._onMoveEnd();
        },

        _onMoveEnd: function(){
            this.historyList.callAction = false;
            this.historyList.add( this._getZoomCenter() );
            this.historyList._callOnUpdate();
        },

        _showHistory: function(id, show){
            this.options.showHistory = show;
            this.$contentContainer.modernizrToggle('history', !!this.options.showHistory);
        },

/* SLIDER REMOVED FOR NOW. Waits for better slider-zoom in leaflet
        _showSlider: function(id, show){
            this.options.showSlider = show;
            show ? this.$sliderContainer.show() : this.$sliderContainer.hide();
        },

        _onSlideStart: function(){
            this.mapZoomAnimation = this._map.options.zoomAnimation;
            this._map.options.zoomAnimation = false;
            this.isSliding = true;
        },

        _onSlideStop: function(){
            this.isSliding = false;
            this._map.options.zoomAnimation = this.mapZoomAnimation;
        },

        _onSliderChange: function(event){
            if (this.isSliding)
                this.historyList.addToList = false;

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
            if (this._slider)
                this._slider.bootstrapSlider('setValue', this._map.getZoom());
        },
*/
        _updateDisabled: function () {
            var map      = this.zoom._map,
                zoom     = map.getZoom(),
                disabled = !!this.zoom._disabled;

            this.$zoomInButton = this.$zoomInButton || $(this.zoom._zoomInButton);
            this.$zoomInButton.toggleClass ( 'disabled', disabled || (zoom === map.getMaxZoom()) );

            this.$zoomOutButton = this.$zoomOutButton || $(this.zoom._zoomOutButton);
            this.$zoomOutButton.toggleClass( 'disabled', disabled || (zoom === map.getMinZoom()) );

//            this._updateSlider();
        },

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

