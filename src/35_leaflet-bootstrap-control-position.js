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
            position    : 'bottomleft',
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
            mode              : 'CURSOR',
            inclContextmenu   : true,   //If true a button is added to the right with info for cursor and contextmenu for map center
            selectFormat      : null    //function() to select format for position using latlng-format (fcoo/latlng-format)
        },

        /************************************************************
        initialize
        ************************************************************/
        initialize: function ( options ) {
            if (window.bsIsTouch)
                //Zoom- and history buttons are shown in a bsModal-box
                this.forceOptions = {mode: 'MAPCENTER'};

            //Set default BsButtonBox-options and own options
            L.Control.BsButtonBox.prototype.initialize.call(this, options);

            //Adjust tooltipDirection and popupPlacement to position
            if (this.options.position.toUpperCase().indexOf('TOP') !== -1)
                this.options.popupPlacement = this.options.tooltipDirection = 'bottom';

            //Set popup-item(s)
            var popupList = [];
            if (!window.bsIsTouch)
                popupList = [
                    {text: {da:'Position ved', en:'Position at'} },
                    {
                        radioGroupId: 'mode',
                        type        : 'radio',
                        selectedId  : this.options.mode,
                        closeOnClick: true,
                        onChange: $.proxy(this.setMode, this),
                        list: [
                            {id:'CURSOR',    icon: iconCursorPosition, text: {da:'Cursor', en:'Cursor'},        },
                            {id:'MAPCENTER', icon: iconMapCenter,      text: {da:'Kortcentrum', en:'Map Center'}},
                        ]
                    }
                ];

            if (this.options.selectFormat)
                popupList.push(
                    {type:'button', closeOnClick: true, icon: 'fa-cog', text: {da:'Format...', en:'Format...'}, onClick: $.proxy(this.options.selectFormat, this)}
                );
            this.options.popupList = popupList.length ? popupList : null;

            //Set format-options and event for change of format

            //latLngFormatSeparator = separator used in formatting the latlng-string. Using <br> for all geo-ref formats
            this.latLngFormatSeparator = '<br>';

            //latLngFormatWidth = min-width of the position-element for different latlng-formats
            this.latLngFormatWidth = {};

            window.latLngFormat.onChange( $.proxy( this._onLatLngFormatChanged, this ));
        },

        /************************************************************
        addMapContainer
        ************************************************************/
        addMapContainer: function(map){
            this.$mapContainers = this.$mapContainers || {};
            this.$mapContainers[ L.Util.stamp(map) ] = $(map.getContainer());
        },

        /************************************************************
        addCenterMarker
        ************************************************************/
        addCenterMarker: function(map, isInOtherMap){
            //Create pane to contain marker for map center. Is placed just below tooltip-pane
            var mapId = L.Util.stamp(map);
            this.centerMarkers = this.centerMarkers || {};

            if (!map.getPane(controlPositionMarkerPane)){
                map.createPane(controlPositionMarkerPane);

                map.whenReady( function(){
                    var zIndex = $(this.getPanes().tooltipPane).css('z-index');
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
                interactive: false,
                pane       : controlPositionMarkerPane
            });
            centerMarker.addTo(map);
            this.centerMarkers[ mapId ] = centerMarker;
        },

        /************************************************************
        onAdd
        ************************************************************/
        onAdd: function(map){
            this.addMapContainer(map);
            this.addCenterMarker(map);

            //Create the content for the control
            var result = L.Control.BsButtonBox.prototype.onAdd.call(this, map );

            this.$innerContentContainer = this.$contentContainer.bsModal.$body;

            //Empty and remove borders on modal
            this.$contentContainer.bsModal.$modalContent.css('border', 'none');
            this.$innerContentContainer.empty();

            //Create two sets of button-input-button
            var cursorOptions = {
                    insideFormGroup: false,
                    noValidation   : true,
                    noBorder       : true,
                    type           : 'textbox',
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

            this.$innerContentContainer
                ._bsAppendContent( cursorOptions )
                ._bsAppendContent( mapCenterOptions );

            //Use the added class name to find the two containers for cursor- and map center position
            var contentClassName = 'hide-for-no-cursor-on-map bsPosition-content text-monospace justify-content-center align-items-center flex-grow-1';
            this.$cursorPosition = this.$innerContentContainer.find('.cursor').parent().empty().addClass(contentClassName).html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
            this.$centerPosition = this.$innerContentContainer.find('.center').parent().empty().addClass(contentClassName).html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');

            if (this.options.inclContextmenu){
                //Remove tooltips from the two buttons to the right
                var $rightButtons = this.$innerContentContainer.find('.input-group-append .btn');
                $rightButtons.on('click', $.proxy(this.hidePopup, this ));
                this.removeTooltip( $rightButtons );
            }

            //Add events to update position
             map.on('mouseposition', this._onMousePosition, this);
            $('body').on('mouseleave', $.proxy(this._onMousePosition, this));

            map.on('move', this._onMapMove, this);
            map.on('moveend', this._onMapMoveEnd, this);

            map.whenReady(this._onLoad, this);

            //Set/update latlng-format
            this._onLatLngFormatChanged(window.latLngFormat.options.formatId);

            return result;
        },


        /************************************************************
        *************************************************************
        infoBox
        add, hide, show and remove extra boxes with additional
        information on the position
        options for an infoBox =
            id       : STRING
            index    : NUMBER
            className: STRING
            before   : {
                icon   : STRING
                onClick: function. If null the left side will just be the icon
            },
            content : STRING or OBJECT or FUNCTION
            after   : As options.before
        *************************************************************
        ************************************************************/
        addInfoBox: function(options){
            this.infoBoxList = this.infoBoxList || [];
            this.infoBoxes = this.infoBoxes || [];

            options.index = options.index || this.infoBoxList.length;
            options.id = options.id || 'id'+options.index;

            var innerContainerClassName = 'info-box-'+options.index,
                boxOptions = {
                    insideFormGroup: false,
                    noValidation   : true,
                    noBorder       : true,
                    type           : 'textbox',
                    text           : function( $inner ){ $inner.addClass(innerContainerClassName); },
                    class          : (options.className || ''),
                    before: {
                        type   : 'button',
                        icon   : 'fa-_',
                        text   : '',
                        square : true,
                        class  : 'disabled show-as-normal',
                        semiTransparent: true
                    },
                    after: {
                        type   : 'button',
                        icon   : 'fa-_',
                        text   : '',
                        square : true,
                        class  : 'disabled show-as-normal',
                        semiTransparent: true
                    }

                };

            if (options.before){
                boxOptions.before.icon = options.before.icon || boxOptions.before.icon;
                if (options.before.onClick){
                    boxOptions.before.class    = '';
                    boxOptions.before.onClick  = options.before.onClick;
                }
            }

            if (this.options.inclContextmenu || options.after){
                options.after = options.after || {};
                boxOptions.after.icon = options.after.icon || boxOptions.after.icon;
                if (options.after.onClick){
                    boxOptions.after.class    = '';
                    boxOptions.after.onClick  = options.after.onClick;
                }
            }
            else
                delete boxOptions.after;

            this.$innerContentContainer._bsAppendContent( boxOptions );

            var $result  =
                    this.$innerContentContainer.find('.' + innerContainerClassName).parent()
                        .addClass('hide-for-no-cursor-on-map d-flex bsPosition-content justify-content-center align-items-center flex-grow-1'),
                infoBox = {
                    id               : options.id,
                    index            : options.index,
                    $container       : $result.parent(),
                    $contentContainer: $result
                };
            $result.empty()._bsAddHtml(options.content);

            //Remove tooltip from active buttons
            var _this = this;
            $result.parent().find('a:not(.disabled)').each(function(){ _this.removeTooltip( $(this) ); });


            this.infoBoxList.push(infoBox);
            this.infoBoxes[options.id] = infoBox;

            //Sort info-boxes by index
            this.infoBoxList.sort(function(box1, box2){ return box1.index - box2.index; });
            for (var i=0; i<this.infoBoxList.length; i++)
                this.infoBoxList[i].$container.detach().prependTo(this.$innerContentContainer);

            return $result;
        },


        /************************************************************
        getInfoBox
        ************************************************************/
        getInfoBox: function(idOrIndex){
            var result = null;
            if (typeof idOrIndex == 'string')
                return this.infoBoxes[idOrIndex];
            $.each(this.infoBoxList, function(dummy, infoBox){
                if (infoBox.index == idOrIndex)
                    result = infoBox;
            });
            return result;
        },

        /************************************************************
        removeInfoBox
        ************************************************************/
        removeInfoBox: function(idOrIndex){
            var _this = this,
                removeInfoBox = this.getInfoBox(idOrIndex);

            if (!removeInfoBox) return;

            removeInfoBox.$container.remove();

            $.each(this.infoBoxList, function(index, infoBox){
                if (infoBox.id == removeInfoBox.id){
                    _this.infoBoxList.splice(index, 1);
                    return true;
                }
            });
            delete this.infoBoxes[removeInfoBox.id];

            //Reste min-width and re-calc
            this.$cursorPosition.css('min-width', 'initial');
            this.$centerPosition.css('min-width', 'initial');

            window.setTimeout($.proxy(this._saveAndSetMinWidth, this), 200);
        },

        /************************************************************
        onRemove
        ************************************************************/
        onRemove: function (map) {
            this.centerMarkers[L.Util(map)].remove();
            delete this.centerMarkers[L.Util(map)];
            map.off('mouseposition', this._onMousePosition, this);
            map.off('move', this._onMapMove, this);
            map.off('moveend', this._onMapMoveEnd, this);

        },

        _onLoad: function(){
            this.setMode( this.options.mode );
        },

        /************************************************************
        setMode
        ************************************************************/
        setMode: function( mode ){
            this.options.mode = mode;

            var isCursor = (this.options.mode == 'CURSOR');

            this._updatePositions();

            this.bsButton.modernizrToggle( 'checked', isCursor );

            $.each(this.$mapContainers, function(id, $container){
                $container
                    .modernizrToggle( 'control-position-cursor',       isCursor )
                    .modernizrToggle( 'control-position-map-center',  !isCursor );
            });

            this._onChange();

        },


        /************************************************************
        onChange
        ************************************************************/
        onChange: function(/*state*/){
            var showCenterMarker = this.options.show && this.options.isExtended && (this.options.mode == 'MAPCENTER');
            $.each(this.centerMarkers, function(id, marker){
                var $icon = $(marker._icon);
                showCenterMarker ? $icon.show() : $icon.hide();
            });
            if (this.options.isExtended)
                this._updatePositions(true);
        },

        /************************************************************
        getState
        ************************************************************/
        getState: function(BsButtonBox_getState){
            return function () {
                return $.extend({mode: this.options.mode}, BsButtonBox_getState.call(this) );
            };
        }(L.Control.BsButtonBox.prototype.getState),

        /************************************************************
        setState
        ************************************************************/
        setState: function(BsButtonBox_setState){
            return function (options) {
                BsButtonBox_setState.call(this, options);
                this.setMode(this.options.mode);
                return this;
            };
        }(L.Control.BsButtonBox.prototype.setState),



        _onLatLngFormatChanged: function( newFormatId ){
            this.latLngFormatId = newFormatId;

            this.latLngFormatSeparator =
                [window.latLngFormat.LATLNGFORMAT_DMSS, window.latLngFormat.LATLNGFORMAT_DMM, window.latLngFormat.LATLNGFORMAT_DD].indexOf(newFormatId) >= 0 ?
                '<br>' : '&nbsp;';

            //Reste min-width
            this.$cursorPosition.css('min-width', 'initial');
            this.$centerPosition.css('min-width', 'initial');

            this._updatePositions();
        },

        _updatePositions: function(force){
            if (!this._map._loaded) return;

            //Update cursor position. It is updated two time to ensure correct min-width even if no mouse-position is saved
            this._onMousePosition( this.mouseEvent, false, force );
            var mouseEvent = this.mouseEventWithLatLng;
            if (mouseEvent && mouseEvent.latlng)
                this._onMousePosition( mouseEvent, false, force );

            //Update center position
            this._onMapMoveEnd();
        },

        _saveAndSetMinWidth: function(){
            if (!this.options.isExtended) return;

            var minWidth = this.latLngFormatWidth[this.latLngFormatId] =
                    Math.max(
                        this.latLngFormatWidth[this.latLngFormatId] || 0,
                        this.options.mode == 'CURSOR' ?
                            this.$cursorPosition.outerWidth() :
                            this.$centerPosition.outerWidth()
                    );
            this.$cursorPosition.css('min-width', minWidth+'px');
            this.$centerPosition.css('min-width', minWidth+'px');
        },

        _formatLatLng: function( latlng ){
            return latlng.format({separator: this.latLngFormatSeparator});
        },

        _onMousePosition: function ( mouseEvent, fromOtherMap, force ) {
            if (this.dontUpdateMousePosition) return;


            if (force || ((this.mouseEvent ? this.mouseEvent.latlng : null) != (mouseEvent ? mouseEvent.latlng : null))){
                var callOnMousePosition = this.options.onMousePosition && this.options.isExtended && (this.options.mode == 'CURSOR'),
                    latlng = mouseEvent ? mouseEvent.latlng : null;

                this.$contentContainer.modernizrToggle('cursor-on-map', !!latlng);

                if ( latlng && (!fromOtherMap || this._map.getBounds().contains(latlng)) ){
                    this.$cursorPosition.html( this._formatLatLng( latlng ) );
                    if (callOnMousePosition)
                        this.options.onMousePosition(mouseEvent.latlng, this.$cursorPosition, this);

                }
                else {
                    this._saveAndSetMinWidth();
                    if (callOnMousePosition)
                        this.options.onMousePosition(null, this.$cursorPosition, this);
                }

                if (this.syncWithList && !this.dontUpdateMousePosition){
                    this.dontUpdateMousePosition = true;

                    $.each(this.syncWithList, function(id, map){
                        map.bsPositionControl._onMousePosition( mouseEvent, true );
                    });
                    this.dontUpdateMousePosition = false;
                }
            }
            this.mouseEvent = mouseEvent;
            if (mouseEvent && mouseEvent.latlng)
                this.mouseEventWithLatLng = mouseEvent;
        },

        _onMapMove: function(){
            if (this.options.isExtended && (this.options.mode == 'MAPCENTER'))
                this._onMapMoveEnd();
        },

        _onMapMoveEnd: function(){
            var position = this._map.getCenter();
            $.each( this.centerMarkers, function(id, marker){
                marker.setLatLng(position);
            });

            this.$centerPosition.html( this._formatLatLng( position ) );

            if (this.options.onCenterPosition && this.options.isExtended && (this.options.mode == 'MAPCENTER'))
                this.options.onCenterPosition(position, this.$centerPosition, this);
        },

        _fireContentmenuOnMapCenter: function(){
            if (!this.enabled) return;
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
        addOther: function(map, onlyCursorPosition){
            if (!map.bsPositionControl){
                map.bsPositionControl = this;
                map.on('mouseposition', map.bsPositionControl._onMousePosition, map.bsPositionControl);
                if (onlyCursorPosition)
                    this.addMapContainer(map);
                else
                    map.bsPositionControl.addCenterMarker(map, true);

                this.setMode( this.options.mode );
            }
            return map;
        },

        removeOther: function(map){
            if (map.bsPositionControl){
                var mapId = L.Util.stamp(map);

                map.off('mouseposition', map.bsPositionControl._onMousePosition, map.bsPositionControl);

                if (this.centerMarkers[mapId]){
                    this.centerMarkers[mapId].remove();
                    delete this.centerMarkers[mapId];
                }

                delete this.$mapContainers[mapId];
                map.bsPositionControl = null;
            }
            return map;
        },

        /*****************************************************
        Sync with other BsPosition of other maps
        *****************************************************/
        sync: function( map, oneWay ){
            if (map.bsPositionControl){
                var mapId = L.Util.stamp(map);
                this.syncWithList = this.syncWithList || {};
                this.syncWithList[mapId] = map;
                if (!oneWay)
                    map.bsPositionControl.sync(this._map, true);
            }
        },

        desync: function( map ){
            var mapId = L.Util.stamp(map);
            this.syncWithList = this.syncWithList || {};
            if (this.syncWithList[mapId]){
                var otherPositionControl = this.syncWithList[mapId].bsPositionControl;
                delete this.syncWithList[mapId];
                otherPositionControl.desync( this._map );
            }
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

