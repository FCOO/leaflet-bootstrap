/****************************************************************************
leaflet-bootstrap-control.js

L.BsControl = extention of L.Control with


****************************************************************************/
(function ($, L, window, document, undefined) {
    "use strict";

    var controlId = 0,
        controlTooltipPane = 'controlTooltipPane';

    L.BsControl = L.Control.extend({
        hasRelativeHeight: false,
        options: {
            show            : true,

            tooltip         : null, //Individuel tooltip
            tooltipDirection: null, //Default = auto detection from control's position

            leftClickIcon   : 'fa-lb-mouse-left',   //Icon used for left-click
            rightClickIcon  : 'fa-lb-mouse-right',  //Icon used for right-click

            popupText       : {da:'Indstillinger', en:'Settings'},
            popupTrigger    : null, //Default: contextmenu and click for touch, contextmenu for no-touch
            popupList       : null, //[] of items for bsPopoverMenu

            closeText       : {da:'Minimer', en:'Minimize'},//{da:'Skjul', en:'Hide'},
            onClose         : null //function. If not null and popupList not null => add as extra button to popupList with text = options.closeText
        },

        //forceOptions = options to be forced (e.q. when special conditions are given). Must be set in initialize of desending objects
        forceOptions: {},

        enabled: true,

        initialize: function ( options ) {
            options = $.extend(true, {}, this.options, options, this.forceOptions || {});
            this.lbControlId = 'lbc_'+ controlId++;
            L.Util.setOptions(this, options);
        },

        _getTooltipElements: function( container ){
            return this.options.getTooltipElements ? this.options.getTooltipElements(container) : $(container);
        },

        _getPopupElements: function( container ){
            return this._getTooltipElements(container) || $(container);
        },


        _getMap: function(){
            return this._map;
        },

        _map_lbOnResize: function(){
            this._getMap()._lbOnResize(true);
            return this;
        },

        _getMapHeight: function(){
            return $(this._getMap()._container).innerHeight();
        },

        addTo: function(map) {
            this._controlTooltipContent = [];

            //Append the control to the maps list of controls
            map.lbControls = map.lbControls || {};
            map.lbControls[this.lbControlId] = this;


            var result = L.Control.prototype.addTo.apply(this, arguments);

            if (this.options.prepend){
                var $result = $(result._container),
                    $parent = $result.parent();
                $result.detach();
                $parent.prepend( $result );
            }

            L.DomEvent.disableClickPropagation(this._container);
            L.DomEvent.on(this._container, 'contextmenu', L.DomEvent.stop);

            //Create pane to contain tooltip for control inside the map's control-container
            if (!map.getPane(controlTooltipPane))
                map.createPane(controlTooltipPane, map._controlContainer);

            //Create common tooltip for all controls on the map
            if (!map._controlTooltip){
                map._controlTooltip = L.tooltip({
                    pane        : controlTooltipPane,   //Map pane where the tooltip will be added.
                    offset	    : L.point(1, 1),        //Optional offset of the tooltip position.
                    direction   : 'auto',               //Direction where to open the tooltip. Possible values are: right, left, top, bottom, center, auto. auto will dynamically switch between right and left according to the tooltip position on the map.
                    permanent   : true,                //Whether to open the tooltip permanently or only on mouseover.
                    sticky      : true,                 //If true, the tooltip will follow the mouse instead of being fixed at the feature center.
                    interactive	: false,                //If true, the tooltip will listen to the feature events.
                    //opacity     : 	Number	0.9	Tooltip container opacity.
                    noWrap      : true
                })
                .setLatLng([0,0])
                .addTo(map);

                map.openTooltip(map._controlTooltip);
                map._controlTooltip.options.saveOpacity = map._controlTooltip.options.opacity;
                map._controlTooltip.setOpacity(0);

                var controlContainer = map._controlContainer;

                //Prevent event on control-container from map
                //L.DomEvent.on(controlContainer, 'contextmenu dblclick wheel mousewheel', L.DomEvent.stop);

                //Close all popup on the map when contextmenu on any control
                $(controlContainer).on('touchstart mousedown', $.proxy(map.closeAllPopup, map));
            }

            //Create and add popup
            var $popupElements = this.$popupElements = this._getPopupElements(this.getContainer()),
                hasPopup = $popupElements && $popupElements.length && this.options.popupList,
                $tooltipElements = this._getTooltipElements(this.getContainer()),
                hasTooltip = hasPopup && $tooltipElements && $tooltipElements.length && !window.bsIsTouch;

            if (hasPopup){
                $popupElements.on( 'click', $.proxy( this.hidePopup, this ));

                if (hasTooltip)
                    $popupElements
                        .on( 'show.bs.popover',   $.proxy(this.tooltip_mouseleave, this))
                        .on( 'hidden.bs.popover', $.proxy(this.tooltip_popover_hide, this));


                var popupTrigger = this.options.popupTrigger ?
                                   this.options.popupTrigger :
                                   window.bsIsTouch ? 'click' : 'contextmenu',
                    popupList = this.options.popupList.slice();

                if (this.options.onClose && window.bsIsTouch)
                    popupList.push({type:'button', lineBefore: true, closeOnClick: true, icon: 'fa-window-minimize', text: this.options.closeText, onClick: this.options.onClose});

                this.menuPopover = $popupElements.bsMenuPopover({
                    trigger     : popupTrigger,
                    delay       : popupTrigger == 'hover' ? 1000 : 0,
                    closeOnClick: true,
                    small       : true,
                    placement   : this.options.popupPlacement || 'top',
                    list        : popupList
                });
            }

            function includes(pos, substring){
                return pos.indexOf(substring) !== -1;
            }


            if (hasTooltip){
                if (!this.options.tooltipDirection){
                    var pos = this.options.position.toUpperCase(),
                        dir = '';

                     if (pos == "TOPCENTER") dir = 'bottom';
                     else if (pos == "BOTTOMCENTER") dir = 'top';
                     else if (includes(pos, 'LEFT')) dir = 'right';
                     else if (includes(pos, 'RIGHT')) dir = 'left';

                    this.options.tooltipDirection = dir;
                }

                this._controlTooltip = this._map._controlTooltip;
                $tooltipElements
                    .on( 'mouseenter',  $.proxy(this.tooltip_mouseenter, this))
                    .on( 'mousemove',   $.proxy(this.tooltip_mousemove,  this))
                    .on( 'mouseleave',  $.proxy(this.tooltip_mouseleave, this));


                //Set tooltip content
                if (this.options.onClose)
                    this._controlTooltipContent.push({id:'close', icon: this.options.leftClickIcon, text: this.options.closeText});

                this._controlTooltipContent.push({icon: this.options.rightClickIcon, text: this.options.popupText});
            }


            //Add common resize-event to the map to adjust any control that has size depending on the map size
            if (this.hasRelativeHeight && !map.lbOnResizeAdded){
                $(map.getContainer()).resize( $.proxy(map._lbOnResize, map) );
                map.lbOnResizeAdded = true;
                map._lbOnResize(true);
            }

            this.options.show ? this.show() : this.hide();
            return result;
        },


        remove: function() {
            if (this._map){
                //Remove the control from the maps list of controls
                this._map.lbControls = this._map.lbControls || {};
                delete this._map.lbControls[this.lbControlId];
            }

            return L.Control.prototype.remove.apply(this, arguments);
        },


        show: function(){
            return this.toggleShowHide(true);
        },

        hide: function(){
            return this.toggleShowHide(false);
        },

        toggleShowHide: function( on ){
		if ( on === undefined )
            return this.toggleShowHide( !this.options.show );

            this.$container = this.$container || $(this._container);
            this.options.show = !!on;

            this.$container
                .css('visibility', this.options.show ? 'inherit' : 'hidden')
                .toggleClass('leaflet-control-hidden', !on);

            this._onChange();

            return this;
        },

        onChange: function(/*options*/){
            //Nothing - overwriten by ancestors
        },

        _onChange: function(){
            this._map_lbOnResize();

            var state = this.getState();
            this.onChange(state);

            if (this.options.onChange)
                this.options.onChange(state, this);
        },


        disable: function(){
            this.enabled = false;
            this.disableTooltip();
            this.$container.addClass('disabled');
            this.$popupElements.popover('disable');
            this.onDisable();
            if (this.options.onDisable)
                this.options.onDisable(this);
        },
        onDisable: function(){
        },

        enable: function(){
            this.enabled = true;
            this.enableTooltip();
            this.$container.removeClass('disabled');
            this.$popupElements.popover('enable');
            this.onEnable();
            if (this.options.onEnable)
                this.options.onEnable(this);

        },
        onEnable: function(){
        },


        //getState: Return an object with the settings/state of the object -to be overwritten be inherits
        getState: function(){
            return {show: this.options.show };
        },

        setState: function(options){
            $.extend(this.options, options, this.forceOptions || {});
            if (this.menuPopover)
                this.$popupElements.bsMenuPopover_setValues(this.options);
            this.toggleShowHide(this.options.show);
            return this;
        },

        //adjustTooltip: Remove items from tooltipContentList (if any) before the items is shown in the tooltip. Can be overwriten by children-constructors
        adjustTooltip: function(itemList){
            return itemList;
        },

        hidePopup: function(){
            if (this.$popupElements && this.$popupElements.popover)
                this.$popupElements.popover('hide');
        },

        removeTooltip: function( $elements ){
            $elements.on('mouseenter',                 $.proxy(this.disableTooltip, this));
            $elements.on('mouseleave mousedown touch', $.proxy(this.enableTooltip,  this));
        },

        disableTooltip: function(){
            this.hideTooltip();
            this._controlTooltipOff = true;
        },
        enableTooltip: function(){
            this._controlTooltipOff = false;
        },

        tooltip_mouseenter: function(event){
            if (!this.enabled || this._controlTooltipOff)
                return;

            var contentList = this.adjustTooltip(this._controlTooltipContent.slice());

            //Insert <br> between all items
            for (var i=1; i < contentList.length; i += 2)
                contentList.splice(i, 0, '<br>');
            this._controlTooltip.setContent(contentList);
            this._controlTooltip.options.direction = this.options.tooltipDirection;
            this._setTooltipTimeOut(event, 400);
        },

        _setTooltipTimeOut: function(event, delay){
            if (this._tooltipTimeout)
                window.clearTimeout(this._tooltipTimeout);
            this._tooltipTimeout = window.setTimeout( $.proxy(this._showTooltip, this, event), delay || 200);
        },

        tooltip_mousemove: function(event){
            if (!this.enabled || this._controlTooltipOff)
                return;
            if (this._controlTooltipVisible)
                this.hideTooltip();
            this._setTooltipTimeOut(event);
        },

        tooltip_mouseleave: function(event){
            this.hideTooltip();
            if (this._tooltipTimeout){
                window.clearTimeout(this._tooltipTimeout);
                this._tooltipTimeout = null;
            }
            if (event.type == 'show')
                //popover.show
                this._controlTooltipOff = true;
        },

        tooltip_popover_hide: function(){
            this._controlTooltipOff = false;
        },

        _showTooltip: function(event){
            if (event && this.enabled && !this._controlTooltipOff){
                this._tooltipTimeout = null;
                this._controlTooltipVisible = true;

                this._controlTooltip._setPosition( this._map.mouseEventToContainerPoint(event) );

                this._controlTooltip.setOpacity(this._controlTooltip.options.saveOpacity);
            }
        },

        hideTooltip: function(){
            if (this._controlTooltipVisible){
                this._controlTooltip.setOpacity(0);
                this._controlTooltipVisible = false;
            }
        },



        //_setMaxHeight(maxHeihgt, mapHeight) Adjust the height if the control har relative height
        _setMaxHeight: function(/*maxHeight, mapHeight*/){
            return this;
        }

    });

    /**********************************************************
    Methods to handle size of controls when the map is resized

    To avoid controls with relative-height to overlap other
    controls the controls are divides into 3 sets of two groups of control-position:
    topleft   + bottomleft
    topcenter + bottomcenter
    topright  + bottomright

    In each set the controls with relative-height in each group is checked
    against all other controls in the other group to ensure that the control
    is not overlapping any other control.


    **********************************************************/
    L.Map.prototype._lbOnResize = function(force){
        var _this = this,
            height = $(this._container).innerHeight();

        if (force || (height != this.lbHeight)){
            this.lbHeight = height;

            ['left', 'center', 'right'].forEach( horizontal => {

                var topControlList = [],
                    bottomControlList = [];
                $.each(_this.lbControls, function(id, control){
                    if ( !(control.options.show && $(control._container).is(':visible')) )
                        return;

                    if (control.options.position == 'top'+horizontal)    topControlList.push(control);
                    if (control.options.position == 'bottom'+horizontal) bottomControlList.push(control);

                    control.lbTop = 0;
                    var elem = control._container;
                    while (elem && (elem !== _this._container)){
                        control.lbTop = control.lbTop + elem.offsetTop;
                        elem = elem.offsetParent;
                    }
                    control.lbBottom = control.lbTop + $(control._container).outerHeight(false);// - parseInt($container.css('margin-bottom'));
                });

                //Find max bottom-position of no-relative-height controls at the top
                //and max top-position of no-relative-height controls at the bottom
                var maxBottom = 0,        //= max lbBottom of controls at top-position
                    minTop    = height,  //= min lbTop of controls at bottom-position
                    bottomHasRelativeControlList = [],  //=[] of Controls at the bottom with relative height
                    topHasRelativeControlList    = [];  //=[] of Controls at the top with relative height

                $.each(topControlList, function(index, control){
                    if (control.hasRelativeHeight)
                        topHasRelativeControlList.push(control);
                    else
                        if ((control.lbTop >= 0) && (control.lbBottom <= height))
                            maxBottom = Math.max(maxBottom, control.lbBottom);
                });
                $.each(bottomControlList, function(index, control){
                    if (control.hasRelativeHeight)
                        bottomHasRelativeControlList.push(control);
                    else
                        if ((control.lbTop >= 0)/* && (control.lbBottom <= height)*/)
                            minTop = Math.min(minTop, control.lbTop);
                });


                //Update all controls at top with new relative/max height
                $.each(topHasRelativeControlList, function(index, control){
                    control._setMaxHeight( minTop - control.lbTop, height );
                });

                //Update all controls at bottom with new relative/max height
                $.each(bottomHasRelativeControlList, function(index, control){
                    control._setMaxHeight( control.lbBottom - maxBottom, height );
                });
            });
        }
    };

}(jQuery, L, this, document));