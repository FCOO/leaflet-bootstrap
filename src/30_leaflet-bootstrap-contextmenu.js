/****************************************************************************
    leaflet-bootstrap-contextmenu.js,

    (c) 2019, FCOO

    https://github.com/FCOO/leaflet-bootstrap-contextmenu
    https://github.com/FCOO

****************************************************************************/
(function ($, L, window, document/*, undefined*/) {
    "use strict";

    //Create namespace
    L.BsContextmenu = L.BsContextmenu || {};
	var ns = L.BsContextmenu;

    /***********************************************************
    Extend base leaflet Layer

    Each item in the contextmenu: {
        icon,
        text,
        onClick: function() - if omitted the item is a header
        context: object - default = the object for the contextmenu
        closeOnClick: true, //If false the contextmenu is not closed on click
    }

    ***********************************************************/
    var contextmenuOptions = {
            items : [],
            header: '',
            excludeMapContextmenu: false, //If true the map's contxtmenu-items isn't shown
            alsoAsPopup          : false, //If true the items in the contextmenu are also added as a menu i a popup. Map are not included
            parent               : null,  //Object witches contextmenu-items are also shown
        };

    ns.contextmenuInclude = {
        setContextmenuOptions: function(options){
            this.contextmenuOptions = this.contextmenuOptions || $.extend({}, contextmenuOptions);
            $.extend(this.contextmenuOptions, options );
            this._updatePopupWithContentmenuItems();
            return this;
        },

        setContextmenuHeader: function(header){
            this.setContextmenuOptions( {header: header} );
            this._updatePopupWithContentmenuItems();
            return this;
        },

        setContextmenuWidth: function(width){
            this.setContextmenuOptions({width: width});
            this._updatePopupWithContentmenuItems();
            return this;
        },

        setContextmenuParent: function(parent){
            this.setContextmenuOptions({parent: parent});
            this._updatePopupWithContentmenuItems();
            return this;
        },

        excludeMapContextmenu: function(){
            this.contextmenuOptions.excludeMapContextmenu = true;
            this._updatePopupWithContentmenuItems();
            return this;
        },


        addContextmenuItems: function ( items, prepend, commonOptions = {} ) {
            this.setContextmenuOptions({});
            this.contextmenuOptions = this.contextmenuOptions || $.extend({}, contextmenuOptions);

            items = $.isArray(items) ? items : [items];

            $.each(items, function(index, item){
                $.extend(item, commonOptions);
            });
            if (prepend)
                this.contextmenuOptions.items = items.concat(this.contextmenuOptions.items);
            else
                this.contextmenuOptions.items = this.contextmenuOptions.items.concat(items);

            this._addContextmenuEventsAndRef();

            this._updatePopupWithContentmenuItems();

            return this;
        },
        appendContextmenuItems : function( items, commonOptions ){ return this.addContextmenuItems( items, false, commonOptions ); },
        prependContextmenuItems: function( items, commonOptions ){ return this.addContextmenuItems( items, true,  commonOptions  ); },

        _updatePopupWithContentmenuItems: function(){
            //If the contextmenus also are used as popup => add or update popup
            if (this.contextmenuOptions.alsoAsPopup && this.bindPopup){
                var popupContent =
                        this._map && this._map.contextmenu ?
                        this._map.contextmenu._popupContent(this, this.contextmenuOptions.header, true, this ) :
                        null;

                if (!popupContent) return;

                if (this._popup)
                    this._popup.setContent(popupContent);
                else
                    this.bindPopup(popupContent);
            }




        },


        _addContextmenuEventsAndRef: function(){
            if (this.hasContextmenuEvent)
                return this;

            if (this instanceof L.Layer){
                if (this._map)
                    this._addContextmenuEvent();
                else
                    this.on('add', this._addContextmenuEvent, this);
            }
            else
                this._addContextmenuRef();
            this.hasContextmenuEvent = true;

        },
        _addContextmenuEvent: function(){
            this.on('contextmenu', this.onContextmenu, this);
            this._addContextmenuRef();
        },
        _addContextmenuRef: function(){
            //Create ref from dom-element to to this
            var getElemFunc = this.getElement || this.getContainer,
                element     = getElemFunc ? $.proxy(getElemFunc, this)() : null;

            if (element)
                $(element).data('bsContentmenuOwner', this);
        },
    };


    /***********************************************************
    Extend L.Layer
    ***********************************************************/
    L.Layer.include(ns.contextmenuInclude);
    L.Layer.include({
        hasContextmenuEvent: false,

        addTo: function (addTo) {
            return function () {
                var result = addTo.apply(this, arguments);

                if (this.contextmenuOptions && this.contextmenuOptions.items.length)
                    this._addContextmenuEventsAndRef();

                return result;
            };
        }(L.Layer.prototype.addTo),

        removeFrom: function (removeFrom) {
            return function () {
                if (this.hasContextmenuEvent){
                    this.off('contextmenu', this.onContextmenu, this);
                    this.hasContextmenuEvent = false;
                }
                return removeFrom.apply(this, arguments);
            };
        }(L.Layer.prototype.removeFrom),

        onContextmenu: function(event){
            event.calledFrom = this;
            this._map.fire('contextmenu', event);
            L.DomEvent.stopPropagation(event);
        }
    });


    /***********************************************************
    Extend L.Map
    ***********************************************************/
    L.Map.include(ns.contextmenuInclude);

    /***********************************************************
    L.Map.ContextMenu
    ***********************************************************/
    var mousedownEventName = L.Browser.touch ?
                                (L.Browser.msPointer ? 'MSPointerDown' : L.Browser.pointer ? 'pointerdown' : 'touchstart') :
                                'mousedown',
        mapEventNames = ['mouseout', 'mousedown', 'movestart', 'zoomstart'];

    L.Map.ContextMenu = L.Handler.extend({
        contextmenuMarker: null,

        addHooks: function () {
            L.DomEvent.on(document, mousedownEventName, this._hide, this);
            this._map.on('contextmenu', this._show, this);
            var _this = this;
            $.each(mapEventNames, function(index, eventName){ _this._map.on(eventName, _this._hide, _this); });
        },

        removeHooks: function () {
            L.DomEvent.off(document, mousedownEventName, this._hide, this);
            this._map.off('contextmenu', this._show, this);
            var _this = this;
            $.each(mapEventNames, function(index, eventName){ _this._map.off(eventName, _this._hide, _this); });
        },

        /***********************************************************
        _popupContent
        Return the {header, content,...} to create the content of a popup
        ***********************************************************/
        _popupContent: function(object, header, isNormalPopup, _this, _map, latlng){
            var objectList = [], //List of objects with iterms for the contextmenu
                nextObj = object;
            while (nextObj){
                if (nextObj.contextmenuOptions){
                    objectList.push(nextObj);
                    nextObj = nextObj.contextmenuOptions.parent;
                }
                else
                    nextObj = null;
            }

            if (_map)
                objectList.push(_map);

            var isContextmenuPopup = !isNormalPopup,
                result = {
                    header : header && isNormalPopup ? header : null,
                    content: {
                        type     : 'menu',
                        fullWidth: true,
                        list     : [],
                        small    : true
                    }
                },
                list       = result.content.list,
                maxWidth   = 0,
                widthToUse = undefined,
                nextId     = 0;

            function checkWidth( width ){
                if (width && (parseInt(width) > maxWidth)){
                    maxWidth = parseInt(width);
                    widthToUse = width;
                }
            }

            $.each( objectList, function(index, obj){
                var contextmenuOptions = obj.contextmenuOptions,
                    lineBefore         = false;

                checkWidth( contextmenuOptions.width );

                //If no header is given and there are more than one object => add header (if any)
                if (!header && (objectList.length > 1) && contextmenuOptions.items.length && !!contextmenuOptions.header){
                    var headerOptions = $._bsAdjustIconAndText(contextmenuOptions.header);
                    headerOptions.lineBefore = true;
                    list.push(headerOptions);
                }
                lineBefore = true;

                $.each( contextmenuOptions.items, function(index, item){
                    //Set default options
                    item = $.extend(
                        isContextmenuPopup ? {closeOnClick: true} : {lineBefore: lineBefore},
                        item
                    );
                    lineBefore = false;
                    item.id = item.onClick ? item.id || 'itemId' + nextId++ : null;
                    checkWidth( item.width );
                    if (item.onClick || item.onChange)

                    if (isContextmenuPopup){
                        if (item.closeOnClick)
                            item.postClickMethod = '_hide';

                        if (!item.type || (item.type == 'button'))
                            //It is not a checkbox or radio => use 2. argument as latlng
                            item.latlng = latlng;

                        item.class = 'text-truncate';
                    }
                    list.push(item);
                });
            });

            result.width = widthToUse;

            return result;
        },

        /***********************************************************
        _show - display the contextmenu
        ***********************************************************/
        _show: function(event){
            var latlng       = event.latlng,
                target       = event.originalEvent.target,
                source       = event.calledFrom || this._map,
                firedOnMap   = (this._map.getContainer() == target) || (source === this._map),
                showRedCross = firedOnMap || $(target).hasClass('contextmenu-with-red-cross');

            if (!firedOnMap)
                //Fired on an object => use object own single latlng (if any) else use cursor position on map
                latlng = source.getLatLng ? source.getLatLng() : latlng;

            var mapToInclude = null;
            if (!firedOnMap && !source.contextmenuOptions.excludeMapContextmenu && this._map.contextmenuOptions)
                mapToInclude = this._map;

            //Create popup-content from the objects in objectList
            var popupContent = this._popupContent(source, false, false, this, mapToInclude, latlng),
                itemExists = popupContent.content.list.length > 0;

            this.contextmenuMarker = this.contextmenuMarker || L.bsMarkerRedCross(this._map.getCenter(), {pane: 'overlayPane'}).addTo( this._map );
            this.contextmenuMarker.setLatLng(latlng);
            this.contextmenuMarker.setOpacity(showRedCross && itemExists ? 100 : 0);

            if (!itemExists)
                return false;

            //Create the popup
            this.popup = this.popup || L.popup();

            //Update popup content
            this.popup
                .setLatLng(latlng)
                .setContent( popupContent );

            //Use object as source for popup if soucre has single latlng
            this.popup._source = firedOnMap ? null :
                                 source.getLatLng ? source :
                                 null;

            //Display the popup and allow move in view
            this.allowMovestart = true;
            this.popup
                .openOn(this._map)
                .bringToFront();
        },

        /***********************************************************
        _hide - hide the contextmenu
        ***********************************************************/
        _hide: function(event){
            if (event && (event.type == 'movestart') && this.allowMovestart){
                this.allowMovestart = false;
                return;
            }

            if (this.popup && this.popup.isOpen())
                this._map.closePopup(this.popup);
            if (this.contextmenuMarker)
                this.contextmenuMarker.setOpacity(0);
        }
    }); //end of L.Map.ContextMenu


    L.Map.addInitHook('addHandler', 'contextmenu', L.Map.ContextMenu);
    L.Map.mergeOptions({ contextmenu: true });

}(jQuery, L, this, document));
