/****************************************************************************
    leaflet-bootstrap-contextmenu.js,

    (c) 2019, FCOO

    https://github.com/FCOO/leaflet-bootstrap-contextmenu
    https://github.com/FCOO

****************************************************************************/
(function ($, L, window, document/*, undefined*/) {
    "use strict";

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
            excludeMapContextmenu: false, //If true the mapss contxtmenu-items isn't shown
            parent: null, //Object witches contextmenu-items are also shown
        },
        contextmenuInclude = {
            setContextmenuOptions: function(options){
                this.contextmenuOptions = this.contextmenuOptions || $.extend({}, contextmenuOptions);
                $.extend(this.contextmenuOptions, options );
                return this;
            },

            setContextmenuHeader: function(header){
                this.setContextmenuOptions( {header: header} );
                return this;
            },

            setContextmenuWidth: function(width){
                this.setContextmenuOptions({width: width});
                return this;
            },

            setContextmenuParent: function(parent){
                this.setContextmenuOptions({parent: parent});
                return this;
            },

            excludeMapContextmenu: function(){
                this.contextmenuOptions.excludeMapContextmenu = true;
                return this;
            },

            addContextmenuItems: function ( items, prepend ) {
                this.setContextmenuOptions({});
                this.contextmenuOptions = this.contextmenuOptions || $.extend({}, contextmenuOptions);

                items = $.isArray(items) ? items : [items];
                if (prepend)
                    this.contextmenuOptions.items = items.concat(this.contextmenuOptions.items);
                else
                    this.contextmenuOptions.items = this.contextmenuOptions.items.concat(items);

                if (this._map)
                    this._addContextmenuEventsAndRef();

                return this;
            },

            _addContextmenuEventsAndRef: function(){
                if (this.hasContextmenuEvent)
                    return this;

                this.on('contextmenu', this.onContextmenu, this);
                this.hasContextmenuEvent = true;

                //Create ref from dom-element to to this
                var getElemFunc = this.getElement || this.getContainer,
                    element     = getElemFunc ? $.proxy(getElemFunc, this)() : null;
                if (element)
                    $(element).data('bsContentmenuOwner', this);
            },

            appendContextmenuItems : function( items ){ return this.addContextmenuItems( items, false ); },
            prependContextmenuItems: function( items ){ return this.addContextmenuItems( items, true  ); },
        };


    /***********************************************************
    Extend L.Layer
    ***********************************************************/
    L.Layer.include(contextmenuInclude);
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
    L.Map.include(contextmenuInclude);

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


            var objectList = [source], //List of objects with iterms for the contextmenu
                parent = source.contextmenuOptions.parent;
            while (parent){
                objectList.push(parent);
                parent = parent.contextmenuOptions.parent;
            }

            if (!firedOnMap && !source.contextmenuOptions.excludeMapContextmenu)
                objectList.push(this._map);

            //Create the list of items from the objects in objectList
            var _this = this,
                list = [],
                width = 0,
                nextId = 0;
            $.each( objectList, function(index, obj){
                var contextmenuOptions = obj.contextmenuOptions;
                width = Math.max(width, contextmenuOptions.width || 0);

                //If more than one object => add header (if any)
                if ((objectList.length > 1) && contextmenuOptions.items.length && !!contextmenuOptions.header){
                    var headerOptions = $._bsAdjustIconAndText(contextmenuOptions.header);
                    headerOptions.lineBefore = true;
                    list.push(headerOptions);
                }

                $.each( contextmenuOptions.items, function(index, item){
                    item = $.extend({closeOnClick: true}, item);
                    item.id = item.onClick ? item.id || 'itemId' + nextId++ : null;
                    width = Math.max(width, item.width || 0);

                    if (item.onClick){
                        //Create onClick for the item
                        var onClick = item.onClick;
                        item.onClick = $.proxy(
                            function( close ){
                                onClick( latlng, _this );
                                if (close)
                                    _this._hide();
                            },
                            item.context || this._map,
                            item.closeOnClick
                        );
                    }

                    list.push(item);
                });
            });

            this.contextmenuMarker = this.contextmenuMarker || L.bsMarkerRedCross(this._map.getCenter(), {pane: 'overlayPane'}).addTo( this._map );
            this.contextmenuMarker.setLatLng(latlng);
            this.contextmenuMarker.setOpacity(showRedCross && list.length ? 100 : 0);

            if (!list.length)
                return false;

            //Create the popup
            this.popup = this.popup || L.popup();

            //Update popup content
            this.popup
                .setLatLng(latlng)
                .setContent({
                    content: $.bsMenu({fullWidth: true, list: list}),
                    width  : width
                });

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
