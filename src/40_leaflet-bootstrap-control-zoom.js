/****************************************************************************
leaflet-bootstrap-control-zoom.js

Create a zoom-control inside a bsButtonBox
Can be used as leaflet standard zoom control with Bootstrap style

****************************************************************************/
(function ($, L, window, document, undefined) {
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
            historyEnabled: true,
            semiTransparent: false,

            tooltipDirection: 'top',

            popupTrigger: 'contextmenu',
            popupText   : {da:'Inds.', en:'Set.'},

            content     :'',

            map_setView_options: {animate: false} //options for map.setView(center, zoom, options). Can beoverwriten
        },

        initialize: function ( options ) {
            if (window.bsIsTouch)
                //Zoom- and history buttons are shown in a bsModal-box
                this.forceOptions = {showHistory: true};
            else
                //The Button-Box is allways extended. The history-buttons are hiden/shown using popup
                this.forceOptions = {isExtended: true, addOnClose: false};


            //Adjust options
            if (window.bsIsTouch)
                options.content = {
                    clickable          : false,
                    semiTransparent    : true,
                    noVerticalPadding  : true,
                    noHorizontalPadding: true,
                    header             : {text: {da:'Zoom/Center', en:'Zoom/Centre'}},
                    inclHeader         : options.historyEnabled,
                    content            : 'This is not empty'
                };

            //Set default BsButtonBox-options and own options
            L.Control.BsButtonBox.prototype.initialize.call(this, options);

            if (!this.options.historyEnabled)
                this.options.showHistory = false;

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

            //Set options.positionIsLeft = true if the control is in the left-side of the map
            this.options.positionIsLeft = includes(pos, 'LEFT');

            //Set popup-item(s)
            if (!window.bsIsTouch && this.options.historyEnabled){
                this.options.popupList = [
/* SLIDER REMOVED FOR NOW. Waits for better slider-zoom in leaflet
                    {text: 'Zoom'},
                    {type:'checkbox', text: {da:'Vis skylder', en:'Show slider'}, selected: this.options.showSlider, onChange: $.proxy(this._showSlider, this), closeOnClick: true},
//*/
                    {id: 'showHistory', type:'checkbox', text: {da:'Vis historik-knapper', en:'Show History Buttons'}, selected: this.options.showHistory, onChange: $.proxy(this._showHistory, this), closeOnClick: true},
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

            if (this.options.historyEnabled){
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
                            {id:'history_last',    icon: 'fa-arrow-to-right', bigIcon: true, onClick: $.proxy(this.historyList.goLast,    this.historyList) },
                            {id:'history_forward', icon: 'fa-angle-right'   , bigIcon: true, onClick: $.proxy(this.historyList.goForward, this.historyList) },
                        ]} )
                    )
//HER                        .css('margin-right', '2px')
                        .find('.btn')
                            .addClass('disabled')
                            .css({
                                'border-top-left-radius': '0px',
                                'border-bottom-left-radius': '0px'
                            });

                if (this.options.positionIsLeft)
                    $forwardButtons.parent().appendTo($contentContainer);
                else
                    $forwardButtons.parent().prependTo($contentContainer);

                $backButtons =
                    $.bsButtonGroup( $.extend(buttonGroupOptions, {
                        list: [
                            {id:'history_first', icon: 'fa-arrow-to-left', bigIcon: true, onClick: $.proxy(this.historyList.goFirst, this.historyList) },
                            {id:'history_back',  icon: 'fa-angle-left'   , bigIcon: true, onClick: $.proxy(this.historyList.goBack,  this.historyList) },
                        ]} )
                    )
                        .prependTo($contentContainer)
                        .insertBefore( $forwardButtons.parent() )
                        .find('.btn')
                            .addClass('disabled')
                            .css({
                                'border-top-right-radius': '0px',
                                'border-bottom-right-radius': '0px'
                            });

                //Set margin to zoom-buttons
                if (this.options.positionIsLeft)
                    $backButtons.parent().css('margin-left', '2px');
                else
                    $forwardButtons.parent().css('margin-right', '2px');

                $contentContainer.find('.btn-group-vertical').css('margin-top', 0);

                this.showHistory(this.options.showHistory);

            }   //end of if (this.options.historyEnabled){...

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
//*/
            map.whenReady(this._onLoad, this);

            return result;
        },

        onRemove: function (map) {
            map.off('moveend', this._onMoveEnd, this);
        },


        enableHistory: function(on){
            this.options.historyEnabled = (on === undefined) ? true : !!on;
            return this;
        },

        disableHistory: function(){
            return this.enableHistory(false);
        },

        _getZoomCenter: function() {
            return {
                zoom  : this._map.getZoom(),
                center: this._map.getCenter()
            };
        },
        _setZoomCenter: function( zoomCenter ) {
            this._map.setView( zoomCenter.center, zoomCenter.zoom, this.options.map_setView_options );
        },

        _onLoad: function(){
            this._map.on('moveend', this._onMoveEnd, this);
            this._onMoveEnd();
        },

        _onMoveEnd: function(){
            if (this.options.historyEnabled){
                this.historyList.callAction = false;
                this.historyList.add( this._getZoomCenter() );
                this.historyList._callOnUpdate();
            }
        },

        _showHistory: function(id, show){
            this.showHistory(show);
        },

        showHistory: function(show){
            this.options.showHistory = show;
            this.$contentContainer.modernizrToggle('history', !!this.options.showHistory);
            this._onChange();
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
//*/
        _updateDisabled: function () {
            var map      = this.zoom._map,
                zoom     = map.getZoom(),
                disabled = !!this.zoom._disabled;

            this.$zoomInButton = this.$zoomInButton || $(this.zoom._zoomInButton);
            this.$zoomInButton.toggleClass ( 'disabled', disabled || (zoom === map.getMaxZoom()) );

            this.$zoomOutButton = this.$zoomOutButton || $(this.zoom._zoomOutButton);
            this.$zoomOutButton.toggleClass( 'disabled', disabled || (zoom === map.getMinZoom()) );

/* SLIDER REMOVED FOR NOW. Waits for better slider-zoom in leaflet
            this._updateSlider();
//*/
        },


        getState: function(BsButtonBox_getState){
            return function () {
                return $.extend({showHistory: this.options.showHistory}, BsButtonBox_getState.call(this) );
            };
        }(L.Control.BsButtonBox.prototype.getState),

        setState: function(BsButtonBox_setState){
            return function (options) {
                BsButtonBox_setState.call(this, options);
                this.showHistory(this.options.showHistory);
                return this;
            };
        }(L.Control.BsButtonBox.prototype.setState),



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

