/****************************************************************************
leaflet-bootstrap-control-position.js

Create a control with mouse or map-center position
Options for selectiong position-format and to activate context-menu

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var controlPositionMarkerPane = 'controlPositionMarkerPane',

        iconCursorPosition = 'fa-mouse-pointer',
        iconMapCenter      = 'fa-lb-center-marker';

//    var HAS_CONTEXTMENU = false; //TO DO

    /********************************************************************************
    L.Control.bsPosition
    ********************************************************************************/
    L.Control.BsPosition = L.Control.BsButtonBox.extend({
        options: {
            position    : 'bottomright',
            text       : '',
            icon       : [[
                iconCursorPosition + ' icon-show-for-checked',
                iconMapCenter      + ' icon-hide-for-checked'
            ]],
            width           : 'auto',
            semiTransparent : true,
            popupPlacement  : 'top',
            tooltipDirection: 'top',

            content     : {
                semiTransparent    : true,
                clickable          : true,
                noHeader           : true,
                noVerticalPadding  : true,
                noHorizontalPadding: true,
                content            : 'This is not empty'
            },

            isExtended        : false,
            showCursorPosition: true,
            selectFormat      : null    //function() to select format for position using latlng-format (fcoo/latlng-format)
        },

        initialize: function ( options ) {
            //Set default BsButtonBox-options
            L.Control.BsButtonBox.prototype.initialize.call(this, options);
            L.Util.setOptions(this, options);

            this.options.onToggle = $.proxy( this.setCenterMarker, this );

            if (window.bsIsTouch)
                this.options.showCursorPosition = false;

            //Adjust tooltipDirection and popupPlacement to position
            if (this.options.position.toUpperCase().indexOf('TOP') !== -1)
                this.options.popupPlacement = this.options.tooltipDirection = 'bottom';

            //Set popup-item(s)
            var popupList = [];
            if (!window.bsIsTouch)
                popupList = [
                    {text: {da:'Position ved', en:'Position at'} },
                    {
                        radioGroupId: 'bsPosition',
                        type        : 'radio',
                        closeOnClick: true,
                        onChange: $.proxy(this._setModeFromRadio, this),
                        list: [
                            {id:'cursor',     icon: iconCursorPosition, text: {da:'Cursor', en:'Cursor'},          selected: this.options.showCursorPosition },
                            {id:'map-center', icon: iconMapCenter,      text: {da:'Kortcentrum', en:'Map Center'}, selected: !this.options.showCursorPosition },
                        ]
                    }
                ];

            if (this.options.selectFormat)
                popupList.push(
                    {type:'button', closeOnClick: true, lineBefore: true, text: {da:'Format...', en:'Format...'}, onClick: this.options.selectFormat}
                );
            this.options.popupList = popupList.length ? popupList : null;

            //Set format-options and event for change of format

            //latLngFormatSeparator = separator used in formatting the latLng-string. Using <br> for all geo-ref formats
            this.latLngFormatSeparator = '<br>';

            //latLngFormatWidth = min-width of the position-element for different latlng-formats
            this.latLngFormatWidth = {};

            window.latLngFormat.onChange( $.proxy( this._onLatLngFormatChanged, this ));
        },

        onAdd: function(map){
            //Create pane to contain marker for map center. Is placed just below popup-pane
            if (!map.getPane(controlPositionMarkerPane)){
                var zIndex = $(map.getPanes().popupPane).css('z-index');

                map.createPane(controlPositionMarkerPane);
                map[controlPositionMarkerPane] = map.getPane(controlPositionMarkerPane);
                $(map[controlPositionMarkerPane]).css('z-index', zIndex-1 );
            }

            //Append the cross in the center of the map
            this.centerMarker = L.marker([0,0], {
                icon: L.divIcon({
                    className : 'leaflet-position-marker show-for-control-position-map-center',
                    iconSize  : [36, 36],
                    iconAnchor: [18, 18],
                }),
                pane: controlPositionMarkerPane
            });

            this.centerMarker.addTo(map);
            this.$centerMarker = $(this.centerMarker.getElement());


            this.$mapContainer = $(map.getContainer());

            //Create the content for the control
            var result = L.Control.BsButtonBox.prototype.onAdd.call(this, map ),
                $contentContainer = this.$contentContainer.bsModal.$body;

            //Empty and remove borders on modal
            this.$contentContainer.bsModal.$modalContent.css('border', 'none');
            $contentContainer.empty();

            //Create two sets of button-input-button
            var cursorOptions = {
                    insideFormGroup: false,
                    noValidation   : true,
                    noBorder       : true,
                    type           : 'text',
                    text           : function( $inner ){ $inner.addClass('cursor'); },
                    class :'show-for-control-position-cursor',
                    before: {
                        type:'button',
                        square: true,
                        semiTransparent: true,
                        icon: iconCursorPosition
                    },
                    after: {
                        type:'button',
                        square: true,
                        semiTransparent: true,
                        icon: L.BsControl.prototype.options.rightClickIcon,
                        onClick: function(){
                            window.notyInfo(
                                { icon: L.BsControl.prototype.options.rightClickIcon,
                                  text: { da: 'Højre-klik på kortet for at se info om positionen',
                                          en: 'Right-click on the map to see info on the position'
                                        }
                                },
                                { layout: 'center', timeout: 4000 }
                            );
                        }
                    },
                },
                mapCenterOptions = $.extend(true, {}, cursorOptions);


            mapCenterOptions = $.extend(mapCenterOptions, {
                class:'show-for-control-position-map-center',
            });
            mapCenterOptions.text = function( $inner ){ $inner.addClass('center'); };

            mapCenterOptions.before.icon = iconMapCenter;

            mapCenterOptions.after.icon = 'fa-lb-contextmenu';
            mapCenterOptions.after.onClick = function(){ alert('TODO: Show contentmenu in map center'); return false; };

            $contentContainer
                ._bsAppendContent( cursorOptions )
                ._bsAppendContent( mapCenterOptions );

            //Use the added class name to find the two containers for cursor- and map center position
            this.$cursorPosition = $contentContainer.find('.cursor').parent().empty().addClass('position').text('12345');
            this.$centerPosition = $contentContainer.find('.center').parent().empty().addClass('position').text('654321');

            //Remove tooltips from the two buttons to the right
            var $rightButtons = $contentContainer.find('.input-group-append .btn');
            $rightButtons.on('click', $.proxy(this.hidePopup, this ));
            this.removeTooltip( $rightButtons );

            //Add events to update position
             map.on('mouseposition', this._onMousePosition, this);

            map.on('move', this._onMapMove, this);
            map.on('moveend', this._onMapMoveEnd, this);

            map.on('load', this._onLoad, this);

            //Set/update latlng-format
            this._onLatLngFormatChanged(window.latLngFormat.options.formatId);

            return result;
        },

        onRemove: function (map) {
            this.$centerMarker.remove();

            map.off('load', this._onLoad, this);
//            map.off('zoomlevelschange', this._setSliderRange, this);

            map.off('mouseposition', this._onMousePosition, this);
            map.off('move', this._onMapMove, this);
            map.off('moveend', this._onMapMoveEnd, this);

        },

        _onLoad: function(){
            this.setMode( this.options.showCursorPosition );
            this.setCenterMarker( this.isExtended );
        },

        _setModeFromRadio: function( id ){
            this.setMode( id == 'cursor' );
        },

        setMode( showCursorPosition ){
            this.options.showCursorPosition = showCursorPosition;

            var isCursor = !!this.options.showCursorPosition;

            this._updatePositions();

            this.bsButton.modernizrToggle( 'checked', isCursor );
            this.$mapContainer
                .modernizrToggle( 'control-position-cursor', isCursor )
                .modernizrToggle( 'control-position-map-center',  !isCursor );
        },

        setCenterMarker: function( show ){
            show ? this.$centerMarker.show() : this.$centerMarker.hide();
        },


        _onLatLngFormatChanged: function( newFormatId ){
            this.latLngFormatId = newFormatId;
            this.latLngFormatSeparator =
                [window.latLngFormat.LATLNGFORMAT_DMSS, window.latLngFormat.LATLNGFORMAT_DMM, window.latLngFormat.LATLNGFORMAT_DD].indexOf(newFormatId) >= 0 ?
                '<br>' : '';

            //Reste min-width
            this.$cursorPosition.css('min-width', 'initial');
            this.$centerPosition.css('min-width', 'initial');

            this._updatePositions();
        },

        _updatePositions: function(){
            if (!this._map._loaded) return;

            //Update cursor position. It is updated two time to ensure correct min-width even if no mouse-position is saved
            this._onMousePosition( this.mouseEvent );
            var mouseEvent = this.mouseEventWithLatLng;
            if (mouseEvent && mouseEvent.latlng)
                this._onMousePosition( mouseEvent );

            //Update center position
            this._onMapMoveEnd();
        },

        _saveAndSetMinWidth: function(){
            if (!this.isExtended) return;

            var minWidth = this.latLngFormatWidth[this.latLngFormatId] =
                    Math.max(
                        this.latLngFormatWidth[this.latLngFormatId] || 0,
                        this.options.showCursorPosition ?
                            this.$cursorPosition.outerWidth() :
                            this.$centerPosition.outerWidth()
                    );
            this.$cursorPosition.css('min-width', minWidth+'px');
            this.$centerPosition.css('min-width', minWidth+'px');
        },

        _formatLatLng: function( latlng ){
            return latlng.format({separator: this.latLngFormatSeparator});
        },

        _onMousePosition: function ( mouseEvent ) {
            if ((this.mouseEvent ? this.mouseEvent.latlng : null) != (mouseEvent ? mouseEvent.latlng : null)){
                if (mouseEvent && mouseEvent.latlng)
                    this.$cursorPosition.html( this._formatLatLng( mouseEvent.latlng ) );
                else {
                    this._saveAndSetMinWidth();
                    this.$cursorPosition.html('&nbsp;');
                }
            }
            this.mouseEvent = mouseEvent;
            if (mouseEvent && mouseEvent.latlng)
                this.mouseEventWithLatLng = mouseEvent;
        },

        _onMapMove: function(){
            if (this.isExtended && !this.options.showCursorPosition)
                this._onMapMoveEnd();
        },

        _onMapMoveEnd: function(){
            this.centerMarker.setLatLng(this._map.getCenter());
            this.$centerPosition.html( this._formatLatLng( this._map.getCenter() ) );
        }

    });//end of L.Control.BsPosition

    //********************************************************************************
    L.Map.mergeOptions({
        bsPositionControl: false,
        bsPositionOptions: {}
    });

    L.Map.addInitHook(function () {
        if (this.options.bsPositionControl) {
            this.bsPositionControl = L.control.bsPosition(this.options.bsPositionOptions);
            this.addControl(this.bsPositionControl);
        }
    });

    L.control.bsPosition = function(options){ return new L.Control.BsPosition(options); };

}(jQuery, L, this, document));

