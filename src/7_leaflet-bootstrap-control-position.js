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
            inclContextmenu   : true,   //If true a button is added to the right with info for cursor and contextmenu for map center
            selectFormat      : null    //function() to select format for position using latlng-format (fcoo/latlng-format)
        },

        initialize: function ( options ) {
            //Set default BsButtonBox-options and own options
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


        addCenterMarker: function(map, isInOtherMap){
            //Create pane to contain marker for map center. Is placed just below popup-pane
            var mapId = L.Util.stamp(map);
            this.centerMarkers = this.centerMarkers || {};
            this.$mapContainers = this.$mapContainers || {};

            if (!map.getPane(controlPositionMarkerPane)){
                map.createPane(controlPositionMarkerPane);

                map.whenReady( function(){
                    var zIndex = $(this.getPanes().popupPane).css('z-index');
                    this[controlPositionMarkerPane] = this.getPane(controlPositionMarkerPane);
                    $(this[controlPositionMarkerPane]).css('z-index', zIndex-1 );
                }, map );
            }

            //Append the cross in the center of the map
            var centerMarker = L.marker([0,0], {
                icon: L.divIcon({
                    className : 'leaflet-position-marker show-for-control-position-map-center' + (isInOtherMap ? ' inside-other-map' : ''),
                    iconSize  : [36, 36],
                    iconAnchor: [18, 18],
                }),
                pane: controlPositionMarkerPane
            });
            centerMarker.addTo(map);
            this.centerMarkers[ mapId ] = centerMarker;

            this.$mapContainers[ mapId ] = $(map.getContainer());
        },

        onAdd: function(map){

/*
            //Create pane to contain marker for map center. Is placed just below popup-pane
            if (!map.getPane(controlPositionMarkerPane)){
                map.createPane(controlPositionMarkerPane);

                map.whenReady( function(){
                    var zIndex = $(this.getPanes().popupPane).css('z-index');
                    this[controlPositionMarkerPane] = this.getPane(controlPositionMarkerPane);
                    $(this[controlPositionMarkerPane]).css('z-index', zIndex-1 );
                }, map );
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
*/
            this.addCenterMarker(map);

//HER            this.$mapContainer = $(map.getContainer());

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
                    class          :'show-for-control-position-cursor',
                    before: {
                        type  : 'button',
                        square: true,
                        icon  : iconCursorPosition,
                        semiTransparent: true,
                    },
                    after: !this.options.inclContextmenu ? null : {
                        type  :'button',
                        square: true,
                        icon  : L.BsControl.prototype.options.rightClickIcon,
                        semiTransparent: true,
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

            if (this.options.inclContextmenu){
                mapCenterOptions.after.icon = 'fa-lb-contextmenu';
                mapCenterOptions.after.onClick = $.proxy(this._fireContentmenuOnMapCenter, this);
            }

            $contentContainer
                ._bsAppendContent( cursorOptions )
                ._bsAppendContent( mapCenterOptions );

            //Use the added class name to find the two containers for cursor- and map center position
            this.$cursorPosition = $contentContainer.find('.cursor').parent().empty().addClass('position text-monospace').html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
            this.$centerPosition = $contentContainer.find('.center').parent().empty().addClass('position text-monospace').html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');

            if (this.options.inclContextmenu){
                //Remove tooltips from the two buttons to the right
                var $rightButtons = $contentContainer.find('.input-group-append .btn');
                $rightButtons.on('click', $.proxy(this.hidePopup, this ));
                this.removeTooltip( $rightButtons );
            }

            //Add events to update position
             map.on('mouseposition', this._onMousePosition, this);

            map.on('move', this._onMapMove, this);
            map.on('moveend', this._onMapMoveEnd, this);

            map.whenReady(this._onLoad, this);

            //Set/update latlng-format
            this._onLatLngFormatChanged(window.latLngFormat.options.formatId);

            return result;
        },

        onRemove: function (map) {
//            this.centerMarker.remove();
            this.centerMarkers[L.Util(map)].remove();
            delete this.centerMarkers[L.Util(map)];
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

        setMode: function( showCursorPosition ){
            this.options.showCursorPosition = showCursorPosition;

            var isCursor = !!this.options.showCursorPosition;

            this._updatePositions();

            this.bsButton.modernizrToggle( 'checked', isCursor );

            $.each(this.$mapContainers, function(id, $container){
                $container
                    .modernizrToggle( 'control-position-cursor',       isCursor )
                    .modernizrToggle( 'control-position-map-center',  !isCursor );
            });
        },

        setCenterMarker: function( show ){
            $.each(this.centerMarkers, function(id, marker){
                var $icon = $(marker._icon);
                show ? $icon.show() : $icon.hide();
            });
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
            var position = this._map.getCenter();
            $.each( this.centerMarkers, function(id, marker){
                marker.setLatLng(position);
            });

            this.$centerPosition.html( this._formatLatLng( position ) );
        },

        _fireContentmenuOnMapCenter: function(){
            /*
            Find top element on the map center and fire contextmenu on it.
            Using excellent methods found on https://stackoverflow.com/questions/8813051/determine-which-element-the-mouse-pointer-is-on-top-of-in-javascript
            */
            var theElement = null,
                theLeafletElement = null,
                elements = [],
                visibility = [],
                centerLatLng = this._map.getCenter(),
                point = this._map.latLngToContainerPoint( centerLatLng ),
                _true = true; //Due to eslint test no-constant-condition

            while (_true) {
                var element = document.elementFromPoint(point.x, point.y);
                if (!element || element === document.documentElement)
                    break;

                elements.push(element);
                visibility.push(element.style.visibility);
                element.style.visibility = 'hidden'; // Temporarily hide the element (without changing the layout)
            }


            //Reset visibility
            $.each( elements, function(index, elem){
                elem.style.visibility = visibility[index];
            });

            //Find first element with contextmenu-options
            $.each( elements, function(index, elem){
                var leafletElem = $(elem).data('bsContentmenuOwner');
                if (leafletElem){
                    theElement        = elem;
                    theLeafletElement = leafletElem;
                    return false;
                }
            });

            //Fallback to fire on map
            if (!theLeafletElement){
                theElement  = this._map.getContainer();
                theLeafletElement = this._map;
            }

            //Fire contextmenu on founde elements
            this._map.fire( 'contextmenu', {
                latlng    : centerLatLng,
                calledFrom: theLeafletElement,
                originalEvent: {
                    target: theElement
                }
            });
        },

        /*****************************************************
        add and remove other maps
        *****************************************************/
        addOther: function(map){
            if (!map.bsPositionControl){
                map.bsPositionControl = this;
                map.on('mouseposition', map.bsPositionControl._onMousePosition, map.bsPositionControl);
                map.bsPositionControl.addCenterMarker(map, true);

                this.setMode( this.options.showCursorPosition );
            }
            return map;
        },


        removeOther: function(map){
            if (map.bsPositionControl){
                var mapId = L.Util.stamp(map);

                map.off('mouseposition', map.bsPositionControl._onMousePosition, map.bsPositionControl);
                this.centerMarkers[mapId].remove();
                delete this.centerMarkers[mapId];

                delete this.$mapContainers[mapId];

                map.bsPositionControl = null;
            }
            return map;
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

