/****************************************************************************
    leaflet-bootstrap.js,

    (c) 2017, FCOO

    https://github.com/FCOO/leaflet-bootstrap
    https://github.com/FCOO

****************************************************************************/
(function (/*$, L, window, document, undefined*/) {
    "use strict";

    //Methods used by $.BsModalContentPromise to read data async and update content of popups
    L.Layer.include({
        _bsModalPromise_Update: function(options){
            var popup = this.getPopup();
            if (!popup) return;

            popup._content = $.extend(true, popup._content, options);
            if (popup.isOpen())
                popup._updateContent();
        },

        _bsModalPromise_Reject: function(){
            this.closePopup();
        }
    });


    /**********************************************************
    L.Map.getPaneBelow(paneId)
    Create and return a pane named paneId+'below' that gets zIndex just below pane with paneId
    **********************************************************/
    L.Map.prototype.getPaneBelow = function(paneId){
        return this._getPaneDeltaZIndex(paneId, 'below', -1);
    };

    /**********************************************************
    L.Map.getPaneAbove(paneId)
    Create and return a pane named paneId+'above' that gets zIndex just above pane with paneId
    **********************************************************/
    L.Map.prototype.getPaneAbove = function(paneId){
        return this._getPaneDeltaZIndex(paneId, 'above', +1);
    };

    /**********************************************************
    L.Map._getPaneDeltaZIndex(paneId, postfix, deltaZIndex)
    Create and return a pane named paneId+postfix that gets
    zIndex deltaZIndex (+/-) relative to pane with paneId
    **********************************************************/
    L.Map.prototype._getPaneDeltaZIndex = function(paneId, postfix, deltaZIndex){
        var newPaneId = paneId+postfix;

        if (!this.getPane(newPaneId)){
            this.createPane(newPaneId);

            this.whenReady( function(){
                var zIndex = parseInt( $(this.getPanes()[paneId]).css('z-index') );
                this[newPaneId] = this.getPane(newPaneId);
                $(this[newPaneId]).css('z-index', zIndex + deltaZIndex);
            }, this );
        }

        return this.getPane(newPaneId);

    };



    /**********************************************************
    L._adjustButtonList(list, owner)
    Adjust buttons in list ($-elemnt or options) to have
    map and 'owner' (bsLegend or popup or contextmenu) added to the arguments
    bsLegend and popup:
    onClick  = function( id, null,     $button, map, owner )
    onChange = function( id, selected, $button, map, owner )

    contextmenu:
    onClick  = function( id, latLng,   $button, map, owner )
    onChange = function( id, selected, $button, map, owner )

    *** NOTE ***
    This DO NOT work for radio-groups. ONLY single types of buttons and checkbox-buttons
    See L.Popup.prototype._updateContent in leaflet-bootstrap.js for the selection of
    buttons to adjust in popups

    **********************************************************/
    function any_button_on_click(id, selected, $button){
        var options = $button ? $button.data('bsButton_options') || {} : {};

        if (options.event)
            $.proxy( options.event, options.true_context )( id, options.latlng || selected, $button, options.map, options.owner );

        if (options.postClick)
            options.postClick.bind(options.postClickContext)( id, selected, $button, options.map, options.owner );

        return options.returnFromClick || false;
    }

    L._adjustButtonList = function(list, owner){
        var newList = [];
        $.each(list, function(index, options){
            newList.push( L._adjustButton(options, owner) );
        });
        return newList;
    };
    L._adjustButton = function(options, owner){
        if (options instanceof $){
            /*
            This is NOT working since some events are linked to the original button by $.proxy(METHOD, button)
            witch is not cloned with $.fn.clone()
            The fix is to remove this events and replace them with new ones wher context = the new cloned button
            */

            return options;

            /*
            $button = options.clone(true);

            //If $button is a checkbox-button => overwrite onChange
            var buttonOptions = $button.data('cbx_options');
            if (buttonOptions){
                lbOptions.event = buttonOptions.onChange;
                buttonOptions.onChange = any_button_on_click;
                $button.data('cbx_options', buttonOptions);
            }
            else {
                //$button is a normal button => overwrite onClick
                buttonOptions = $button.data('bsButton_options');
                lbOptions.event = buttonOptions.onClick;
                buttonOptions.onClick = any_button_on_click;
                $button.data('bsButton_options', buttonOptions);
            }
            lbOptions.context = buttonOptions.context;
        */
        }
        else {
            if (!options.checkedBy_adjustButton){
                //Create the buttons and modify the click-event to call options.onClick(id, null, $button, map); map is added
                options = $.extend(true, {}, options);
                var type = options.type = options.type || 'button',
                    isCheckboxButton = type != 'button';

                options.small = (typeof options.small == 'boolean') ? options.small : true;
                options.event = options.onChange || options.onClick;
                options[isCheckboxButton ? 'onChange' : 'onClick'] = any_button_on_click;
                options[isCheckboxButton ? 'onClick' : 'onChange'] = null;

                options.true_context = options.context;
                options.context = null;

                options.owner = owner;
                options.map   = owner._map || (owner.parent ? owner.parent._map : null);
                options.checkedBy_adjustButton = true;
            }
        }

        return options;
    };



    /**********************************************************
    Overwrite ScrollWheelZoom.prototype._onWheelScroll to
    prevent map zooming when mouse wheel on elements with scroll
    **********************************************************/
    L.Map.ScrollWheelZoom.prototype._onWheelScroll = function(_onWheelScroll){
        return function(event){
            var elem = event ? event.srcElement : null,
                zoomMap = true,
                className;

            while (elem && zoomMap){
                className = elem.className;
                if ( (typeof className == 'string') && className.split(' ').includes('leaflet-control') )
                    zoomMap = false;
                else
                    elem = elem.offsetParent;
            }
            return zoomMap ? _onWheelScroll.apply(this, arguments) : false;
        };
    }(L.Map.ScrollWheelZoom.prototype._onWheelScroll);


}(jQuery, L, this, document));



;
/****************************************************************************
9_leaflet-bootstrap-control-attribution.js

Create standard attribution control, but with position='bottomleft' and hide by css visibility

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    L.Map.mergeOptions({
        bsAttributionControl: false,
        bsAttributionOptions: {
            position: 'bottomleft',
            prefix  : false
        }

    });

    L.Map.addInitHook(function () {
        if (this.options.bsAttributionControl) {
            this.bsAttributionControl = L.control.attribution( this.options.bsAttributionOptions );
            this.bsAttributionControl.addTo(this);
            $(this.bsAttributionControl._container).addClass('leaflet-control-attribution-bs');

            //Mark that the control-position has a bsAttribution-control
            $(this.bsAttributionControl._container).parent().addClass('has-control-attribution-bs');

            //Mark that the map has a bsAttribution-control
            $(this._container).addClass('has-control-attribution-bs');
        }
    });


}(jQuery, L, this, document));


;
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

            $.each(['left', 'center', 'right'], function(index, horizontal){

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
;
/****************************************************************************
leaflet-bootstrap-control-button.js

Create leaflet-control for jquery-bootstrap button-classes:
    L.control.bsButton( options )
    L.control.bsButtonGroup( options )
    L.control.bsRadioButtonGroup( options )



****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var defaultButtonOptions = {
            center         : true,
            square         : true,
            bigIcon        : false,
            returnFromClick: false,
        },

        _bsButtons = L.BsControl.extend({
            options: {
                position  : 'topleft',
                isExtended: false,
            },

            initialize: function(options){
                //Set default bsControl-options
                L.BsControl.prototype.initialize.call(this, options);
            },

            _createContent: function(){},

            onAdd: function() {
                var _this = this;
                this.options = $._bsAdjustOptions( this.options, defaultButtonOptions);

                if (this.options.list)
                    $.each(this.options.list, function(index, opt){
                        _this.options.list[index] = $._bsAdjustOptions( opt, defaultButtonOptions);
                });

                return this._createContent().get(0);
            },
        });

    L.Control.BsButton = _bsButtons.extend({
        initialize: function(options){
            //Set default _bsButtons-options
            _bsButtons.prototype.initialize.call(this, options);
        },

        _createContent: function(){ return $.bsButton(this.options); }
    });


    L.Control.BsCheckboxButton = _bsButtons.extend({
        initialize: function(options){
            //Set default _bsButtons-options
            _bsButtons.prototype.initialize.call(this, options);
        },

        _createContent: function(){ return $.bsCheckboxButton(this.options); }
    });


    L.Control.BsButtonGroup = _bsButtons.extend({
        options: {
            vertical: true
        },

        initialize: function(options){
            //Set default _bsButtons-options
            _bsButtons.prototype.initialize.call(this, options);
        },

        _createContent: function(){ return $.bsButtonGroup(this.options); }
    });

    L.Control.BsRadioButtonGroup = L.Control.BsButtonGroup.extend({
        _createContent: function(){ return $.bsRadioButtonGroup(this.options); }
    });

    L.control.bsButton           = function(options){ return new L.Control.BsButton(options);           };
    L.control.bsCheckboxButton   = function(options){ return new L.Control.BsCheckboxButton(options);   };
    L.control.bsButtonGroup      = function(options){ return new L.Control.BsButtonGroup(options);      };
    L.control.bsRadioButtonGroup = function(options){ return new L.Control.BsRadioButtonGroup(options); };

    /********************************************************************************
    L.Control.BsButtonBox
    Create a bsButton that opens a box with bs-content given by options.content

    Individual menu-items in the popup is set in
    options.popupList = []{
        id  : STRING - mandatory for type="checkbox" or "radio"
        type: "checkbox", "radio", "button" etc.
        onChange: function(value) called when the item is changed or setState is called on the control
        icon, text
    }
    ********************************************************************************/
    L.Control.BsButtonBox = L.Control.BsButton.extend({
        options: {
            addOnClose     : true,
            isExtended     : false,
            tooltipOnButton: false, //When true the tooltip and and popup also apply to the button (isExtended == false), but only for no-touch-mode
            openText       : {da:'Maksimer', en:'Maximize'},
        },

        initialize: function(options){
            L.Control.BsButton.prototype.initialize.call(this, options);

            if (this.options.extendedButton)
                this.hasRelativeHeight = false;

            //Set default onToggle-function
            this.onToggle = $.proxy(this.toggle, this);
            if (this.options.addOnClose){
                this.options.onClose = this.onToggle;

                //If extended conent is a button AND the control has popups AND iot is touch mode => supres click on extended button to trigger show popup on the container
                if (this.options.extendedButton && this.options.popupList && window.bsIsTouch)
                    this.options.extendedButton.addOnClick = false;
            }
        },

        addTo: function(){
            var result = L.Control.BsButton.prototype.addTo.apply(this, arguments);

            //If tooltips also is shown when not isExtended => create extra options and let adjustTooltip dynamic adjust tooltips
            if (this.options.addOnClose && this.options.tooltipOnButton)
                this._controlTooltipContent.unshift({id:'open', icon: this.options.leftClickIcon, text: this.options.openText});

            return result;
        },

        //_adjustPopupList: Adjust this.options.popupList with default items above and below
        _adjustPopupList: function(aboveList, belowList){
            var _this = this,
                list = this.options.popupList || [],
                onChange = $.proxy(this._popupList_onChange, this);

            aboveList = aboveList || [];
            belowList = belowList || [];

            this.popups = {};
            $.each(list, function(index, itemOptions){
                var id = itemOptions.id;
                if (id && ((itemOptions.type == 'radio') || (itemOptions.type == 'checkbox'))){
                    itemOptions._onChange = itemOptions.onChange;
                    itemOptions.onChange = onChange;

                    if (itemOptions.type == 'radio')
                        itemOptions.selectedId = itemOptions.selectedId || _this.options[id];

                    if (itemOptions.type == 'checkbox')
                        itemOptions.selected = itemOptions.selected == undefined ? _this.options[id] : itemOptions.selected;
                    _this.popups[id] = itemOptions;
                }
            });

            this.options.popupList = aboveList.concat( this.options.popupList || [], belowList);
        },

        _popupList_onChange: function(id, value){
            this.options[id] = value;

            if (this.popups[id]._onChange)
                this.popups[id]._onChange(value, id, this);

            this._onChange();
        },


        _createContent: function(){
            //Create container
            var $container = this.$container =
                    $('<div/>')
                        .addClass('leaflet-button-box')
                        .addClass(this.options.className)
                        .modernizrToggle('extended', !!this.options.extended);

            //Adjust options for the button and create it
            var defaultButtonOptions = {
                    onClick        : this.onToggle,
                    semiTransparent: true,
                    square         : true,
                };

            this.bsButton =
                $.bsButton( $.extend(true, {}, defaultButtonOptions, this.options) )
                .addClass('hide-for-extended')
                .appendTo($container);


            /*
            The extended content can be a bsButton or a bsModal:
            if options.extendedButton => bsButton
            if options.content => bsModal
            */

            if (this.options.extendedButton){
                this.bsButtonExtended =
                    $.bsButton($.extend(true, {},
                        defaultButtonOptions,
                        this.options.extendedButton
                    ))
                        .addClass('show-for-extended')
                        .appendTo($container);

                this.options.tooltipOnButton = true;
            }
            else {

                //Create container for extended content
                var $contentContainer = this.$contentContainer =
                    $('<div/>')
                        .width('auto')
                        .addClass('show-for-extended')
                        .appendTo($container);

                //this.options = null OR bsModal-options OR function($container, options, onToggle)
                if (this.options.content){
                    if ($.isFunction(this.options.content))
                        this.options.content($contentContainer, this.options, this.onToggle);
                    else {
                        $contentContainer._bsAddBaseClassAndSize($.extend({
                            baseClass   : 'modal-dialog',
                            class       : 'modal-dialog-inline',
                            useTouchSize: true,
                            small       : true,
                        },{
                            useTouchSize: this.options.content.useTouchSize,
                            small       : this.options.content.small
                        }));

                        //Adjust options for the content (modal) and create the it
                        var modalOptions = $.extend(true, {},
                            //Default options
                            {
                                closeButton     : false,
                                clickable       : true,
                                semiTransparent : true,
                                extended        : null,
                                minimized       : null,
                                isExtended      : false, //Not the same as this.options.isExtended
                                isMinimized     : false,
                                width           : this.options.width || 100,
                                parentContainerHeight: $.proxy(this._getMapHeight, this),
                            },

                            //Standard relative height if the class has it
                            this.hasRelativeHeight ? {
                                relativeHeight      : 1,
                                relativeHeightOffset: 0
                            } : {},


                            this.options.content,

                            //Forced options
                            {show: false}
                        );

                        //Add close icon to header (if any)
                        if (!modalOptions.noHeader && modalOptions.header && !(modalOptions.icons && modalOptions.icons.close)){
                            modalOptions.icons = modalOptions.icons || {};
                            modalOptions.icons.close = { onClick: this.onToggle };
                        }

                        //Add default onClick if clickable and bsControl will not add popup triggered by click
                        if (modalOptions.clickable && !modalOptions.onClick && !(this.options.popupList && window.bsIsTouch))
                            modalOptions.onClick = this.onToggle;
                        $contentContainer._bsModalContent(modalOptions);
                    }

                    //To avoid resizing relative to window height the class 'modal-flex-height' is removed
                    $contentContainer.bsModal.$modalContent.removeClass('modal-flex-height');

                }
            } //end of if (this.options.extendedButton).. else {...

            if (this.options.isExtended)
                this.toggle();

            return $container;
        },

        _getTooltipElements: function( /*container*/ ){
            return this.options.tooltipOnButton ? this.$container : this.$contentContainer;
        },

        adjustTooltip: function(itemList){
            if (this.options.tooltipOnButton){
                var result = [],
                    isExtended = this.options.isExtended;
                $.each(itemList, function(index, item){
                    if (!item.id ||
                        ((item.id == 'close') &&  isExtended) ||
                        ((item.id == 'open')  && !isExtended) )
                        result.push(item);
                });
                return result;
            }
            else
                return itemList;
        },

        //toggle : change between button-state and extended
        toggle: function(){
            this.hidePopup();
            this.hideTooltip();
            if (this.enabled){
                this.$container.modernizrToggle('extended');
                this.options.isExtended = this.$container.hasClass('extended');
                this._onChange();
            }
            return false;
        },

        getState: function(BsControl_getState){
            return function () {
                var _this = this,
                    popupListOptions = {};

                //Get values from items in popupList (if any)
                $.each(this.popups, function(id){
                    popupListOptions[id] = _this.options[id];
                });

                return $.extend(
                    {isExtended: this.options.isExtended},
                    popupListOptions,
                    BsControl_getState.call(this)
                );
            };
        }(L.BsControl.prototype.getState),

        setState: function(BsControl_setState){
            return function (options) {
                var _this = this;
                BsControl_setState.call(this, options);

                //Set values in items in popupList (if any)
                $.each(this.popups, function(id, itemOptions){
                    if (itemOptions._onChange)
                        itemOptions._onChange(options[id], id, _this);
                });


                this.$container.modernizrToggle('extended', this.options.isExtended);
                return this;
            };
        }(L.BsControl.prototype.setState),


        _setMaxHeight: function(maxHeight/*, mapHeight*/){
            maxHeight = Math.max(100, maxHeight-10); //TODO 100 and 10 as options
            this.$contentContainer.bsModal.$modalContent.css({
                'max-height': maxHeight+'px',
                'height'    : 'auto' //Was maxHeight+'px'
            });
        }
    });


    L.control.bsButtonBox = function(options){ return new L.Control.BsButtonBox(options); };

}(jQuery, L, this, document));


;
/****************************************************************************
leaflet-bootstrap-control-modal.js

Create leaflet-control for jquery-bootstrap modal-content:
    L.control.bsModal( options )

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

        /***************************************************
        _bsModal = common constructor for bsModal and bsForm as BsControl
        ***************************************************/
        var _bsModal = L.BsControl.extend({
            hasRelativeHeight: true,
            options: {
                position: 'topcenter',
                show    : false
            },

            show: function() { this.$outerContainer.show(); },
            hide: function() { this.$outerContainer.hide(); },

            /********************************************************
            _createModal
            ********************************************************/
            _createModal: function(){
                //this.bsModal = ...;
            },

            /********************************************************
            onAdd
            ********************************************************/
            onAdd: function() {
                this.options = $._bsAdjustOptions(
                    this.options,
                    this._defaultOptions,
                    {
                        small       : true,
                        smallButtons: true,
                    }
                );


                //Set onChange to update height
                this.options.onChange_user = this.options.onChange;
                this.options.onChange = $.proxy(this._lbOnChange, this);

                var show = this.options.show;
                this.options.show = false;

                //Create the element
                var $result =
                        $('<div/>')
                            .addClass('leaflet-control'),
                    $modalContainer =
                        $('<div/>')
                            ._bsAddBaseClassAndSize({
                                baseClass   : 'modal-dialog',
                                class       : 'modal-dialog-inline',
                                useTouchSize: true,
                                small       : false
                            })
                            .append( this.$modalContent )
                            .appendTo( $result );

                //Add copy of _attachCloseHandler from select2 to close dropdown on mousedown on control
                $result.on('mousedown', function( event ) {
                    var $select = $(event.target).closest('.select2');

                    $('.select2.select2-container--open').each(function () {
                        if (this == $select[0])
                            return;
                        $(this).data('element').select2('close');
                    });
                });

                //Create this.bsModal and this.$modalContent
                this._createModal();

                this.$modalContent = this.bsModal.bsModal.$modalContent;
                $modalContainer.bsModal = this.bsModal.bsModal;

                //'Move the container into the control
                this.$modalContent.detach();
                $modalContainer.append( this.$modalContent );

                //Adjust this.bsModal
                this.bsModal.show   = $.proxy(this.show, this);
                this.bsModal._close = $.proxy(this.hide, this);

                //Adjust width and height
                $modalContainer._bsModalSetHeightAndWidth();

                var result = $result.get(0);
                L.DomEvent.disableClickPropagation( result );
                this.$outerContainer = $result;

                this.options.show = show;
                this.options.show ? this.show() : this.hide();
                return result;
            },

            _lbOnChange: function(){
                if (this.options.onChange_user)
                    this.options.onChange_user.apply(this, arguments);

                //To avoid resizing relative to window height the class 'modal-flex-height' is removed
                if (this.$modalContent){
                    this.$modalContent.removeClass('modal-flex-height');
                    this._map_lbOnResize();
                }
            },


            _setMaxHeight: function(maxHeight/*, mapHeight*/){
                /*
                Get the css for heights form the modal
                The modal gets the following cssHeight:
                    if (options.height)    return {height: options.height+'px'   maxHeight: null};
                    if (options.maxHeight) return {height: 'auto'                maxHeight: options.maxHeight+'px', };
                    else return null;
                */
                var cssHeight = this.bsModal.bsModal.cssHeight[ this.$modalContent._bsModalGetSize() ],
                    modalHeight    = 'auto',
                    modalMaxHeight = null,
                    adjustMaxHeight = true;

                if (!cssHeight)
                    //Flex-height => adjust
                    modalMaxHeight = maxHeight;
                else
                    if (cssHeight.maxHeight){
                        //options.maxHeight given
                        modalMaxHeight = parseInt(cssHeight.maxHeight);

                    }
                    else {
                        //options.height given
                        modalHeight = cssHeight.height;
                        modalMaxHeight = parseInt(modalHeight);
                        adjustMaxHeight = false;
                    }

                if (adjustMaxHeight){
                    modalMaxHeight = Math.min(parseInt(modalMaxHeight), maxHeight);
                    modalMaxHeight = Math.max(100, modalMaxHeight - 10); //TODO 100 and 10 as options
                }

                this.$modalContent.css({
                    'height'    : modalHeight,
                    'max-height': modalMaxHeight ? modalMaxHeight+'px' : null,
                });
            }

        });

        /***************************************************
        L.Control.BsModal
        ***************************************************/
        L.Control.BsModal = _bsModal.extend({
            _defaultOptions : {
                show               : true,
                closeButton        : false,
                noCloseIconOnHeader: true
            },

            _createModal: function(){
                this.bsModal = $.bsModal( this.options );
            }
        });


        /***************************************************
        L.Control.BsModalForm
        ***************************************************/
        L.Control.BsModalForm = _bsModal.extend({
            _defaultOptions : {
                show               : false,
//                noCloseIconOnHeader: true
            },

            _createModal: function(){
                this.bsModalForm = $.bsModalForm( this.options );
                this.bsModal = this.bsModalForm.$bsModal;
            },

            //edit
            edit: function(  values, tabIndexOrId ){
                this.bsModalForm.edit( values, tabIndexOrId );
            }

        });

        //*************************************
        L.control.bsModal     = function(options){ return new L.Control.BsModal(options); };
        L.control.bsModalForm = function(options){ return new L.Control.BsModalForm(options); };

}(jQuery, L, this, document));


;
/****************************************************************************
leaflet-bootstrap-control-scale.js

Create a scale inside a buttonBox
Imported from fcoo/leaflet-double-scale witch is based on
leaflet-graphicscale by Erik Escoffier
https://github.com/nerik/leaflet-graphicscale

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    /********************************************************************************
    L.Control.BsScale
    Create a bsButtonBox with the scale
    ********************************************************************************/
    L.Control.BsScale = L.Control.BsButtonBox.extend({
        options: {
            icon                : 'fa-ruler-horizontal',//Icon for bsButton
            mode                : 'METRIC',             //'METRIC', 'NAUTICAL', or 'BOTH'
            showBoth            : false,
            showReticle         : false,

            position            : 'bottomright',
            minUnitWidth        : 40,
            maxUnitsWidth       : 200,                  //Max width
            maxUnitsWidthPercent: 90,                   //Max width as percent of map wisth
            width               : 'auto',
            content: {
                modalContentClassName: 'leaflet-bootstrap-control-scale',
                semiTransparent      : true,
                clickable            : true,
                noHeader             : true,
                content              : 'This is not empty'
            },
            numeralFormat  : '0,0[.]0',                  //String or function
            shadowColor: 'rgba(255,255,255,.28)',        //Shadow for Reticle
            textBackgroundColor: "rgba(255,255,255,.6)", //Background for reticle label
        },

        initialize: function(options){
            //Set default BsButtonBox-options and own options
            L.Control.BsButtonBox.prototype.initialize.call(this, options);

            //Set default tooltip-diretion
            if (!this.options.tooltipDirection)
                this.options.tooltipDirection = (this.options.position.indexOf('top') !== -1) ? 'bottom' : 'top';

            //Set popup-items - two different modes: With and without options.selectFormat
            var reticlePopup = {
                    id          : 'showReticle',
                    //icon        : 'fa-ruler-combined', Can't have both checkbox and icon
                    text        : {da:'Vis trådkors', en:'Show Reticle'},
                    type        : 'checkbox',
                    closeOnClick: false,
                    selected    : this.options.showReticle,
                    onChange    : $.proxy(this._onShowReticle, this)
                };

            this._adjustPopupList(
                //Items above options.popupList
                options.selectFormat ? [
                    {icon: this.options.icon, text: {da:'Skala (in situ)', en:'Scale (in situ)'} },
                    reticlePopup,
                    {type:'checkbox', id:'showBoth', text: {da:'Vis km og nm', en:'Show km and nm'}, selected: this.options.showBoth, onChange: $.proxy(this._setBoth, this), closeOnClick: false},
                ] : [
                    {icon: this.options.icon, text: {da:'Vis', en:'Show'} },
                    reticlePopup,
                    {
                        radioGroupId: 'mode',
                        type        :'radio',
                        selectedId  : this.options.mode,
                        closeOnClick: true,
                        onChange    : $.proxy(this.setMode, this),
                        list: [
                            {id:'METRIC',   text: {da:'Kilometer', en:'Metric'}     },
                            {id:'NAUTICAL', text: {da:'Sømil', en:'Nautical miles'} },
                            {id:'BOTH',     text: {da:'Begge', en:'Both'}           }
                        ]
                    }
                ],

                //Items belows options.popupList
                options.selectFormat ?
                    [{type:'button', icon:'fa-cog', text: {da:'Format...', en:'Format...'}, spaceBefore: true, onClick: $.proxy(this.options.selectFormat, this), closeOnClick: true, }] :
                    null
            );
        },

        onAdd: function (map) {
            this._map = map;
            var result = L.Control.BsButtonBox.prototype.onAdd.call(this, map ),
                $contentContainer = this.$contentContainer.bsModal.$body;

            this.$container
                .addClass( 'leaflet-button-box-scale' )
                .addClass( $._bsGetSizeClass({baseClass: 'leaflet-button-box-scale', useTouchSize: true}) );

            //Create and add nautical-scale
            $contentContainer.empty();
            this.nauticalScale = new L.Control.SingleScale( L.extend({type:'NAUTICAL', labelPlacement:'top', parent:this}, this.options ) );
            this.$nauticalScaleContainer = $(this.nauticalScale.onAdd( this._map )).appendTo( $contentContainer );

            //Create and add metric-scale
            this.metricScale = new L.Control.SingleScale( L.extend({type:'METRIC', labelPlacement:'bottom', parent:this}, this.options ) );
            this.$metricScaleContainer = $(this.metricScale.onAdd( this._map )).appendTo( $contentContainer );

            //Create and add Reticle-marker
            this.reticleMarker =
                new L.Marker.Reticle([0,0], {
                        interactive: false,
                        keyboard   : false,
                        icon       : new L.Icon.Reticle(),
                        pane       : map.getPaneBelow('tooltipPane'),
                        shadowColor        : this.options.shadowColor,
                        textBackgroundColor: this.options.textBackgroundColor,
                    });
            this.reticleMarker.parent = this;
            this.reticleMarker.addTo(map);
            this.onShowReticle(this.options.showReticle);

            this.setMode( this.options.mode, result );
            return result;
        },

        onRemove: function (map) {
            this.metricScale.onRemove(map);
            this.nauticalScale.onRemove(map);

            this.reticleMarker.remove();
        },

        _setBoth: function(id, selected){
            this.setBoth(selected);
        },

        setBoth: function(selected){
            this.options.showBoth = selected;
            this.setMode( this.options.mode );
            this._onChange();
        },

        setMode: function(mode, container){
            this.options.mode = mode;

            if (this.options.selectFormat)
                mode = this.options.showBoth ? 'BOTH' : mode;
            $(this.getContainer() || container).toggleClass('both', mode == 'BOTH');

            //nauticalScale
            this.$nauticalScaleContainer.toggleClass('hidden', (mode == 'METRIC'));
            if ((mode == 'BOTH') || (mode == 'NAUTICAL'))
                this.nauticalScale._setLabelPlacement( mode == 'BOTH' ? 'top' : 'bottom' );

            //metricScale
            this.$metricScaleContainer.toggleClass('hidden', mode == 'NAUTICAL');

            this._updateScales();

            //Update the reticle-marker
            this.reticleMarker._update();

            this._onChange();
        },

        _updateScales: function(){
            if (this.nauticalScale)
                this.nauticalScale._update();
            if (this.metricScale)
                this.metricScale._update();
        },

        onChange: function(/*state*/){
            this._updateScales();
        },

        _onShowReticle: function(id, selected){
            this.onShowReticle(selected);
        },
        onShowReticle: function(show){
            this.options.showReticle = show;
            this.reticleMarker.setShow(this.options.showReticle && this.options.show);

            this._onChange();

        },

        getState: function(BsButtonBox_getState){
            return function () {
                return $.extend(
                    this.options.selectFormat ? {showBoth: this.options.showBoth} : {mode: this.options.mode},
                    {showReticle: this.options.showReticle},
                    BsButtonBox_getState.call(this)
                );
            };
        }(L.Control.BsButtonBox.prototype.getState),

        setState: function(BsButtonBox_setState){
            return function (options) {
                BsButtonBox_setState.call(this, options);
                if (this.options.selectFormat)
                    this.setBoth(this.options.showBoth);
                else
                    this.setMode(this.options.mode);
                this.onShowReticle(this.options.showReticle);
                return this;
            };
        }(L.Control.BsButtonBox.prototype.setState),

    });


    /********************************************************************************
    L.Control.SingleScale
    Leaflet control representning a single scale
    ********************************************************************************/
    function $div( className ){ return $('<div/>').addClass(className); }

    L.Control.SingleScale = L.Control.extend({
        options: {
            type: 'NAUTICAL',//'METRIC', or 'NAUTICAL'
        },

        onAdd: function(map) {
            this._map = map;

            //number of units on the scale, by order of preference
            this._possibleUnitsNum = [3, 5, 2, 4, 1];
            this._possibleUnitsNumLen = this._possibleUnitsNum.length;

            //how to divide a full unit, by order of preference
            this._possibleDivisions = [1, 0.5, 0.25, 0.2];
            this._possibleDivisionsLen = this._possibleDivisions.length;

            this._possibleDivisionsSub = {
                1   : { num: 2, division: 0.5  },
                0.5 : { num: 5, division: 0.1  },
                0.25: { num: 5, division: 0.05 },
                0.2 : { num: 2, division: 0.1  }
            };

            //Build the scale
            var $result = $div('leaflet-control-singlescale');
            this.$scaleInner = $div('leaflet-control-singlescale-inner').appendTo($result);
            var $units = $div('units').appendTo(this.$scaleInner);

            this.$units = [];
            this.$unitsLbls = [];

            for (var i=0; i<5; i++) {
                var fill = (i%2 === 0),
                    $unit = $div('division').append([
                                $div('line' ).append( $div(fill ? 'fill'  : 'fill2') ),
                                $div('line2').append( $div(fill ? 'fill2' : 'fill' ) )
                            ]).appendTo($units);

                this.$units.push($unit);
                this.$unitsLbls.push( $div('label divisionLabel').appendTo($unit) );
            }

            this.$zeroLbl =
                $div('label zeroLabel')
                    .text('0')
                    .appendTo(this.$units[0]);

            this._setLabelPlacement( this.options.labelPlacement );

            //Add events
            map.on('move', this._update, this);
            map.on('resize', this._resize, this);
            map.whenReady(this._resize, this);

            return $result[0];
        },

        onRemove: function (map) {
            map.off('move', this._update, this);
            map.off('resize', this._resize, this);
        },

        _setLabelPlacement: function( labelPlacement ){
            this.$scaleInner
                .removeClass('labelPlacement-top labelPlacement-bottom' )
                .addClass   ('labelPlacement-' + labelPlacement);
        },

        _resize: function(){
            if (!this.options.original_maxUnitsWidth){
                //Save original maxUnitsWidth and force _update
                this.options.original_maxUnitsWidth = this.options.maxUnitsWidth;
                this.options.maxUnitsWidth = 0;
            }

            var new_maxUnitsWidth = Math.max(
                                        this.options.minUnitWidth,
                                        Math.min(
                                            this.options.original_maxUnitsWidth,
                                            this._map.getSize().x * this.options.maxUnitsWidthPercent / 100
                                        )
                                    );
            if (new_maxUnitsWidth != this.options.maxUnitsWidth){
                this.options.maxUnitsWidth = new_maxUnitsWidth;
                this._update();
            }
        },

        _update: function () {
            if (!this._map || !this._map._loaded || !this.options.parent.options.isExtended) return;


            //Update the scale
            /*The old AND INCORRECT method
            var bounds = this._map.getBounds(),
                centerLat = bounds.getCenter().lat,

                //length of an half world arc at current lat
                halfWorldMeters = 6378137 * Math.PI * Math.cos(centerLat * Math.PI / 180),
                //length of this arc from map left to map right
                dist = halfWorldMeters * (bounds.getNorthEast().lng - bounds.getSouthWest().lng) / 180,

                size = this._map.getSize();
            */

            //New methods to calc dist. Assume that the control is placed at the bottom of the map - TOD: Check for position
            var bounds = this._map.getBounds(),
                dist   = this._map.distance(bounds.getSouthEast(), bounds.getSouthWest()),
                size   = this._map.getSize();

            if (this.options.type == 'NAUTICAL'){
                dist = dist/1.852;
            }

            if (size.x > 0) {
                this._updateScale(dist, this.options);
            }
        },

        _updateScale: function(maxMeters, options) {
            var scale = this._getBestScale(maxMeters, options.minUnitWidth, options.maxUnitsWidth);
            if (scale)
                this._render(scale);
        },

        _getBestScale: function(maxMeters, minUnitWidthPx, maxUnitsWidthPx) {
            //favor full units (not 500, 25, etc)
            //favor multiples in this order: [3, 5, 2, 4]
            //units should have a minUnitWidth
            //full scale width should be below maxUnitsWidth
            //full scale width should be above minUnitsWidth ?

            var possibleUnits = this._getPossibleUnits( maxMeters, minUnitWidthPx, this._map.getSize().x );
            var possibleScales = this._getPossibleScales(possibleUnits, maxUnitsWidthPx);
            possibleScales.sort(function(scaleA, scaleB) {
                return scaleB.score - scaleA.score;
            });

            return possibleScales[0];
        },

        _getPossibleScales: function(possibleUnits, maxUnitsWidthPx) {
            var scales = [];
            var minTotalWidthPx = Number.POSITIVE_INFINITY;
            var fallbackScale;

            for (var i = 0; i < this._possibleUnitsNumLen; i++) {
                var numUnits = this._possibleUnitsNum[i];
                var numUnitsScore = (this._possibleUnitsNumLen-i)*0.5;

                for (var j = 0; j < possibleUnits.length; j++) {
                    var unit = possibleUnits[j];
                    var totalWidthPx = unit.unitPx * numUnits;
                    var scale = {
                            unit: unit,
                            totalWidthPx: totalWidthPx,
                            numUnits: numUnits,
                            score: 0
                        };

                    //TODO: move score calculation  to a testable method
                    var totalWidthPxScore = 1-(maxUnitsWidthPx - totalWidthPx) / maxUnitsWidthPx;
                    totalWidthPxScore *= 10;

                    //Never allow scale to be wider that maxUnitsWidthPx
                    var score = totalWidthPx > maxUnitsWidthPx ? 0 : unit.unitScore + numUnitsScore + totalWidthPxScore;

                    //penalty when unit / numUnits association looks weird
                    if (
                        unit.unitDivision === 0.25 && numUnits === 3 ||
                        unit.unitDivision === 0.5 && numUnits === 3 ||
                        unit.unitDivision === 0.25 && numUnits === 5
                    ) {
                        score -= 10;
                    }

                    scale.score = score;

                    if (totalWidthPx < maxUnitsWidthPx) {
                        scales.push(scale);
                    }

                    //keep a fallback scale in case totalWidthPx < maxUnitsWidthPx condition is never met
                    //(happens at very high zoom levels because we dont handle submeter units yet)
                    if (totalWidthPx < minTotalWidthPx) {
                        minTotalWidthPx = totalWidthPx;
                        fallbackScale = scale;
                    }
                }
            }

            if (!scales.length)
                scales.push(fallbackScale);
            return scales;
        },

        /**
        Returns a list of possible units whose widthPx would be < minUnitWidthPx
        **/
        _getPossibleUnits: function(maxMeters, minUnitWidthPx, mapWidthPx) {
            var exp = (Math.floor(maxMeters) + '').length;

            var unitMetersPow;
            var units = [];

            for (var i = exp; i > 0; i--) {
                unitMetersPow = Math.pow(10, i);
                for (var j = 0; j < this._possibleDivisionsLen; j++) {
                    var unitMeters = unitMetersPow * this._possibleDivisions[j];
                    var unitPx = mapWidthPx * (unitMeters/maxMeters);
                    if (unitPx < minUnitWidthPx) {
                        return units;
                    }
                    units.push({
                        unitMeters: unitMeters,
                        unitPx: unitPx,
                        unitDivision: this._possibleDivisions[j],
                        unitScore: this._possibleDivisionsLen-j
                    });
                }
            }

            return units;
        },

        _render: function(scale) {
            var _this = this,
                displayUnit = this._getDisplayUnit(scale.unit.unitMeters),
                numFormat   = this.options.parent.options.numeralFormat;

            //Get numeral format
            numFormat = $.isFunction(numFormat) ? numFormat(this) : numFormat;

            this.$lastLbl = null;
            $.each( this.$units, function(index, $division){
                var showDivision = (index < scale.numUnits);
                $division
                    .width(showDivision ? scale.unit.unitPx + 'px' : 0)
                    .toggleClass('hidden', !showDivision);

                if (!_this.$unitsLbls)
                    return true;

                var $lbl = _this.$unitsLbls[index];
                $lbl
                    .removeClass()
                    .addClass('label divisionLabel');

                if (showDivision) {
                    var lblText = window.numeral( (index+1)*displayUnit.amount ).format(numFormat);


                    if (index === scale.numUnits-1) {
                        lblText += displayUnit.unit;
                        $lbl.addClass('labelLast');
                        _this.$lastLbl = $lbl;
                    }
                    else
                        $lbl.addClass('labelSub');
                    $lbl.html('<span>'+ lblText + '</span>');
                }
            });


            //Set timeout to adjust right-padding to fix last label
            if (this.timeoutId)
                window.clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout( function(){
                var halfLabelWidth = (_this.$lastLbl.children().first().width() || 0) / 2;
                if (halfLabelWidth)
                    _this.$scaleInner.css('margin-right', halfLabelWidth + 'px');
            }, 100);
        },

        _getDisplayUnit: function(meters) {
            if (this.options.type == 'METRIC'){
                var displayUnit = (meters<1000) ? 'm' : 'km';
                return {
                    unit: displayUnit,
                    amount: (displayUnit === 'km') ? meters / 1000 : meters
                };
            }
            else
                return {
                    unit  : 'nm',
                    amount: meters /1000
                };
        }
    });//end of L.Control.SingleScale = L.Control.extend({


    /********************************************************************************
    L.Control.Reticle
    Leaflet control representning a reticle at map center

    Modified version of leaflet-reticle
    https://github.com/rwev/leaflet-reticle by https://github.com/rwev
    ********************************************************************************/
    L.Icon.Reticle = L.DivIcon.extend({
        options: {
            className : 'visible', //Must be <> ""
            iconSize  : [10, 10],
            iconAnchor: [ 0,  0],
        }
    });

    L.Marker.Reticle = L.Marker.extend({
        options: {
            margin     : 20,
            tickLength : 11,
            maxLength  : 125,
            shadowColor        : 'rgba(255,255,255,.28)',
            fontSize           : 12,
            textBackgroundColor: "rgba(255,255,255,.6)"
        },

        onAdd: function(map) {
            var result = L.Marker.prototype.onAdd.apply(this, arguments);

            this.canvas = document.createElement(`canvas`);

            this.options.canvasDim = 2*this.options.maxLength;

            this.canvas.width = this.options.canvasDim;
            this.canvas.height = this.options.canvasDim;
            $(this.canvas)
                .css({
                    'margin-top' : -this.options.margin + 'px',
                    'margin-left': -this.options.margin + 'px'
                })
                .addClass('icon-reticle')
                .appendTo(this._icon);

            this.ctx = this.canvas.getContext(`2d`);

            map.on('move', this._update, this);
            map.whenReady(this._update, this);

            return result;
        },

        onRemove: function(map){
            map.off('move', this._update, this);
            this.canvas = null;
            return L.Marker.prototype.onRemove.apply(this, arguments);
        },

        setShow: function(show){
            $(this._icon).toggle(!!show);
        },

        _update: function() {
            if (!this._map || !this._map._loaded) return;

            var center = this._map.getCenter();
            this.setLatLng(center);

            //Reset canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            //Draw scales
            this.ctx.fillStyle   = 'black';
            this.ctx.strokeStyle = 'black';
            this.ctx.font = 'normal ' + this.options.fontSize + 'px Verdana';

            //Calc max distance covered (in meter) from center within the maximum width/height of the ruler
            var mapSize = this._map.getSize(),
                centerX = mapSize.x / 2,
                centerY = mapSize.y / 2,
                maxWidthDist =  this._map.distance( this._map.getCenter(), this._map.containerPointToLatLng( [centerX + this.options.maxLength, centerY] ) ),
                maxHeightDist = this._map.distance( this._map.getCenter(), this._map.containerPointToLatLng( [centerX, centerY + this.options.maxLength] ) ),


                scaleLength = 0,
                mode     = this.parent.options.mode,
                modeIsNautical = mode == 'NAUTICAL',
                showBoth = this.parent.options.showBoth;


            //Draw horizontal scale(s)
            if (showBoth){
                scaleLength = this.drawOneScale(maxWidthDist, false, false, true);
                this.drawOneScale(maxWidthDist, false, true,  false, scaleLength);
            }
            else
                scaleLength = this.drawOneScale(maxWidthDist, false, false, modeIsNautical);

            //Draw vertical scale(s)
            if (showBoth){
                scaleLength = this.drawOneScale(maxHeightDist, true, false, true);
                this.drawOneScale(maxHeightDist, true, true,  false, scaleLength);
            }
            else
                this.drawOneScale(maxHeightDist, true, false, modeIsNautical);

        },

        /********************************************
        drawOneScale
        *********************************************/
        drawOneScale: function(maxDistMeter, vertical, ticksBelow, isNautical, existingScaleLength = 0) {
            var maxDistUnit = maxDistMeter,
                unitStr = 'm';

            if (isNautical){
                unitStr = 'nm';
                maxDistUnit = maxDistMeter / 1852;
            }
            else
                if (maxDistMeter > 1000){
                    unitStr = 'km';
                    maxDistUnit = maxDistMeter / 1000;
                }

            //Get ratio (current-dim / max-dim) and label
            var pow10 = Math.pow(10, (''+Math.floor(maxDistUnit)).length - 1),
                digit = maxDistUnit / pow10;

            digit = digit >= 10 ? 10 : digit >= 8 ? 8 : digit >= 6 ? 6 : digit >= 5 ? 5 : digit >= 4 ? 4 : digit >= 3 ? 3 : digit >= 2 ? 2 : 1;

            var currentDistUnit = pow10 * digit,
                ratio = currentDistUnit / maxDistUnit,
                label = window.numeral(currentDistUnit).format(this.parent.options.numeralFormat) +' ' + unitStr,

                //Get scale length and number of ticks
                scaleLength = this.options.maxLength * ratio,
                sections = digit == 1 ? 5 : digit == 3 ? 3 : digit == 5 ? 5 : digit == 6 ? 3 : 4,
                delta = scaleLength / sections,

                //Use negative tick-lenght to draw above the line
                tickLgd = (ticksBelow ? +1 : -1) * this.options.tickLength;


            //Draw line
            if (vertical) {
                if (scaleLength > existingScaleLength)
                    this.drawVLine(0, -this.options.tickLength + existingScaleLength, scaleLength - existingScaleLength + this.options.tickLength);
            }
            else {
                if (scaleLength > existingScaleLength)
                    this.drawHLine(-this.options.tickLength + existingScaleLength, 0, scaleLength - existingScaleLength + this.options.tickLength);
            }


            //Draw ticks
            var i;
            if (vertical){
                var deltaMeter = Math.round(maxDistMeter*ratio/sections),
                    mapCenter = this._map.getCenter(),
                    mapCenterY = this._map.latLngToLayerPoint(mapCenter).y;

                for (i=1; i < sections; i++){
                    var nextPoint = mapCenter.rhumbDestinationPoint(i*deltaMeter, 180);
                    this.drawHLine(0, this._map.latLngToLayerPoint(nextPoint).y - mapCenterY, tickLgd/2);
                }
                this.drawHLine(0, scaleLength, tickLgd);
            }
            else {
                for (i=1; i < sections; i++)
                    this.drawVLine(i*delta, 0, tickLgd/2);
                this.drawVLine(scaleLength, 0, tickLgd);
            }

            //Draw label
            if (vertical){
                this.ctx.save();
                this.ctx.translate(0 , this.options.canvasDim);
                this.ctx.rotate(0.5*Math.PI);
                this.drawText(
                    label,
                     this.options.margin + scaleLength + 2 - this.options.canvasDim,
                    -this.options.margin + (ticksBelow ? -3 : this.options.fontSize)
                );
                this.ctx.restore();
            }
            else
                this.drawText(
                    label,
                    this.options.margin + scaleLength + 2,
                    this.options.margin + (ticksBelow ? 1 + this.options.fontSize : -2)
                );

            return scaleLength;
        },

        drawText: function(text, x, y){
            x = Math.round(x);
            y = Math.round(y);
            var textWidth = this.ctx.measureText(text).width,
                textHeight = this.options.fontSize;


            this.ctx.fillStyle = this.options.textBackgroundColor;
            this.ctx.fillRect(x-1, y-textHeight, textWidth+2, textHeight+2);

            this.ctx.fillStyle = 'black';
            this.ctx.fillText(text, x, y);
        },

        drawLine: function(xS, yS, xE, yE) {
            xS = Math.round(xS) + .5;
            yS = Math.round(yS) + .5;
            xE = Math.round(xE) + .5;
            yE = Math.round(yE) + .5;

            var extraX = 0, extraY = 0;
            if (xS < xE)
                extraX = 1;
            if (xS > xE)
                extraX = -1;
            if (yS < yE)
                extraY = 1;
            if (yS > yE)
                extraY = -1;

            var margin = this.options.margin,
                ctx = this.ctx;

            ctx.save();
            ctx.strokeStyle = this.options.shadowColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(xS + margin + extraX, yS + margin + extraY);
            ctx.lineTo(xE + margin,          yE + margin);
            ctx.stroke();
            ctx.restore();

            ctx.beginPath();
            ctx.moveTo(xS + margin, yS + margin);
            ctx.lineTo(xE + margin, yE + margin);
            ctx.stroke();
        },

        drawVLine: function(x, y, lgd){
            this.drawLine(x, y, x, y+lgd);
        },

        drawHLine: function(x, y, lgd){
            this.drawLine(x, y, x+lgd, y);
        }
    });

    //********************************************************************************
    //********************************************************************************
    L.Map.mergeOptions({
        bsScaleControl: false,
        bsScaleOptions: {}
    });

    L.Map.addInitHook(function () {
        if (this.options.bsScaleControl) {
            this.bsScaleControl = new L.Control.BsScale(this.options.bsScaleOptions);
            this.addControl(this.bsScaleControl);
        }
    });

    L.control.bsScale = function(options){ return new L.Control.BsScale(options); };

}(jQuery, L, this, document));


;
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
                var popupContent = ns._popupContent({
                        object       : this,
                        isNormalPopup: true,
                        map          : this._map,
                        includeMap   : false
                    });

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
    _popupContent
    Return the {header, content,...} to create the content of a popup
    options = {
        object       : The object with the context-menu
        isNormalPopup: BOOLEAN, true if the content are for a normal popup
        map          : The map where the contextmenu/object is located
        includeMap   : BOOLEAN, if true the contextmenus of _map are included
        latlng       : The position where the contextmenu was trigged
    }
    ***********************************************************/
    ns._popupContent = function(options){
        var o = options,
            objectList = [], //List of objects with iterms for the contextmenu
            nextObj = o.object;

        while (nextObj){
            if (nextObj.contextmenuOptions){
                objectList.push(nextObj);
                nextObj = nextObj.contextmenuOptions.parent;
            }
            else
                nextObj = null;
        }

        if (o.includeMap && o.map)
            objectList.push(o.map);


        var isContextmenuPopup = !o.isNormalPopup,
            header = objectList[0].contextmenuOptions.header,
            result = {
                header : o.isNormalPopup ? header : null,
                content: [],
            },
            menuList,
            accordion,
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
                firstObject        = !index;

            checkWidth( contextmenuOptions.width );

            if (firstObject){
                //First is added as menu
                result.content.push({
                    type     : 'menu',
                    fullWidth: true,
                    list     : [],
                    small    : true
                });
                menuList = result.content[0].list;

                if (isContextmenuPopup && header){
                    var headerOptions = $._bsAdjustIconAndText(contextmenuOptions.header);
                    headerOptions.mainHeader = true;
                    menuList.push(headerOptions);
                }
            }
            else {
                //The rest is added inside a accordion
                if (!accordion){
                    accordion = {
                        type : 'accordion',
                        list : [],
                        small: true,
                    };
                    result.content.push( accordion );
                }

                var accordionItem = $._bsAdjustIconAndText(contextmenuOptions.header);
                accordionItem.noVerticalPadding   = true;
                accordionItem.noHorizontalPadding = true;
                accordionItem.content = {
                    type         : 'menu',
                    noRoundBorder: true,
                    fullWidth    : true,
                    list         : []
                };
                accordion.list.push(accordionItem);
                menuList = accordionItem.content.list;
            }

            $.each( contextmenuOptions.items, function(index, item){
                //Set default options
                item = $.extend(
                    isContextmenuPopup ? {closeOnClick: true} : {},
                    item
                );

                item.id = item.onClick ? item.id || 'itemId' + nextId++ : null;
                checkWidth( item.width );
                if (item.onClick || item.onChange)

                if (isContextmenuPopup){
                    if (item.closeOnClick){
                        item.postClick        = o.map.contextmenu._hide;
                        item.postClickContext = o.map.contextmenu;
                    }

                    if (!item.type || (item.type == 'button'))
                        //It is not a checkbox or radio => use 2. argument as latlng
                        item.latlng = o.latlng;
                }

                menuList.push(item);
            });

            firstObject = false;
        });

        result.width = widthToUse;

        return result;
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

            //Create popup-content from the objects in objectList
            var popupContent = ns._popupContent({
                    object       : source,
                    isNormalPopup: false,
                    map          : this._map,
                    includeMap   : !firedOnMap && !source.contextmenuOptions.excludeMapContextmenu && this._map.contextmenuOptions,
                    latlng       : latlng
                }),

                itemExists = popupContent.content[0].list.length > 0;

            this.contextmenuMarker = this.contextmenuMarker || L.bsMarkerRedCross(this._map.getCenter(), {pane: 'overlayPane'}).addTo( this._map );
            this.contextmenuMarker.setLatLng(latlng);
            this.contextmenuMarker.setOpacity(showRedCross && itemExists ? 100 : 0);

            if (!itemExists)
                return false;

            //Create the popup
            var firstTime = !this.popup;
            this.popup = this.popup || L.popup({autoPan: false});

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

            //Prevent "mousedownEventName" on the popup from closing the popup
            if (firstTime)
                L.DomEvent.on(this.popup._container, mousedownEventName, L.DomEvent.stopPropagation);

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

;
/****************************************************************************
leaflet-bootstrap-control-position.js

Create a control with mouse or map-center position
Options for selectiong position-format and to activate context-menu

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var iconCursorPosition = 'fa-mouse-pointer',
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

            this._adjustPopupList(
                //Items above options.popupList
                window.bsIsTouch ? [] : [
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
                ],

                //Items belows options.popupList
                this.options.selectFormat ?
                    [{type:'button', closeOnClick: true, icon: 'fa-cog', text: {da:'Format...', en:'Format...'}, spaceBefore: true, onClick: $.proxy(this.options.selectFormat, this)}] :
                    null
            );
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
            var mapId = L.Util.stamp(map);
            this.centerMarkers = this.centerMarkers || {};

            //Append the cross in the center of the map
            var centerMarker = L.marker([0,0], {
                icon: L.divIcon({
                    className : 'leaflet-position-marker show-for-control-position-map-center' + (isInOtherMap ? ' inside-other-map' : ''),
                    iconSize  : [36, 36],
                    iconAnchor: [18, 18],
                }),
                interactive: false,
                pane       : map.getPaneBelow('tooltipPane') //Create/get pane to contain marker for map center. Is placed just below tooltip-pane
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
                    insideFormGroup  : true,
                    noValidation     : true,
                    noBorder         : true,
                    noVerticalPadding: true,
                    noPadding        : true,
                    type             : 'textbox',

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
                                          en: 'Right-click on the map to<br>see info on the position'
                                        }
                                },
                                { layout: 'center', _timeout: 4000 }
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
            var contentClassName = 'hide-for-no-cursor-on-map bsPosition-content font-monospace justify-content-center d-flex align-items-center flex-grow-1';


            this.$cursorPositionSpan = this.$innerContentContainer.find('.cursor').empty().html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
            this.$cursorPosition     = this.$cursorPositionSpan.parent().addClass(contentClassName);


            this.$centerPositionSpan = this.$innerContentContainer.find('.center').empty().html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
            this.$centerPosition     = this.$centerPositionSpan.parent().addClass(contentClassName);

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

            this.addedToMap = true;

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
            alwaysVisible: BOOLEAN if true the infobox is always visible if false it is hidden when the cursor is outside of the map
            before   : {
                icon   : STRING
                onClick: function. If null the left side will just be the icon
            },
            content : STRING or OBJECT or FUNCTION
            after   : As options.before
        *************************************************************
        ************************************************************/
        addInfoBox: function(optionsOrInfoBox){
            this.infoBoxList = this.infoBoxList || [];
            this.infoBoxes = this.infoBoxes || [];
            var _this = this;
            function adjustOptions(options){
                options.index = options.index || _this.infoBoxList.length;
                options.id = options.id || 'id'+optionsOrInfoBox.index;

                if (_this.options.inclContextmenu)
                    options.after = options.after || {};
                return options;
            }

            var infoBox = optionsOrInfoBox instanceof L.Control.BsInfoBox ? optionsOrInfoBox : null;

            if (infoBox)
                adjustOptions(infoBox.options);
            else
                infoBox = new L.Control.BsInfoBox(adjustOptions(optionsOrInfoBox));

            this.infoBoxList.push(infoBox);
            this.infoBoxes[infoBox.id] = infoBox;

            infoBox.addTo(this);

            //Sort info-boxes by index
            this.infoBoxList.sort(function(box1, box2){ return box2.options.index - box1.options.index; });
            for (var i=0; i<this.infoBoxList.length; i++)
                this.infoBoxList[i].$container.detach().prependTo(this.$innerContentContainer);

            return infoBox;
        },


        /************************************************************
        getInfoBox
        ************************************************************/
        getInfoBox: function(idOrIndexOrInfoBox){
            if (idOrIndexOrInfoBox instanceof L.Control.BsInfoBox)
                return idOrIndexOrInfoBox;
            if (typeof idOrIndexOrInfoBox == 'string')
                return this.infoBoxes[idOrIndexOrInfoBox];
            var result = null;
            $.each(this.infoBoxList, function(dummy, infoBox){
                if (infoBox.index == idOrIndexOrInfoBox)
                    result = infoBox;
            });
            return result;
        },

        /************************************************************
        removeInfoBox
        ************************************************************/
        removeInfoBox: function(idOrIndexorInfoBox){
            var _this = this,
                removeInfoBox = this.getInfoBox(idOrIndexorInfoBox);
            if (!removeInfoBox) return;

            removeInfoBox.remove();

            $.each(this.infoBoxList, function(index, infoBox){
                if (infoBox.id == removeInfoBox.id){
                    _this.infoBoxList.splice(index, 1);
                    return false;
                }
            });
            delete this.infoBoxes[removeInfoBox.id];

            //Reste min-width and re-calc
            this.$cursorPosition.css('min-width', 'initial');
            this.$centerPosition.css('min-width', 'initial');
            this.latLngFormatWidth = {};

            this._updatePositions();

            return removeInfoBox;
        },

        /************************************************************
        onRemove
        ************************************************************/
        onRemove: function (map) {
            this.centerMarkers[L.Util.stamp(map)].remove();
            delete this.centerMarkers[L.Util.stamp(map)];
            map.off('mouseposition', this._onMousePosition, this);
            map.off('move', this._onMapMove, this);
            map.off('moveend', this._onMapMoveEnd, this);

            this.addedToMap = false;
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
            if (!this.addedToMap || !this._map || !this._map._loaded) return;

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
                    latlng = mouseEvent ? mouseEvent.latlng : null,
                    modernizr_CursorOnMap = !!latlng;

                    //If the latLng is from another map: Check if the position is inside this
                    if (fromOtherMap && this._map && latlng)
                        modernizr_CursorOnMap = this._map.getBounds().contains( latlng );

                this.$contentContainer.modernizrToggle('cursor-on-map', modernizr_CursorOnMap);


                if ( latlng && (!fromOtherMap || this._map.getBounds().contains(latlng)) ){
                    this.$cursorPositionSpan.html( this._formatLatLng( latlng ) );

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

            this.$centerPositionSpan.html( this._formatLatLng( position ) );

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
                mapClientRect = this._map._container.getBoundingClientRect(),
                _true = true; //Due to eslint test no-constant-condition


            //Convert relative point to absolute point
            point.x = point.x + mapClientRect.x;
            point.y = point.y + mapClientRect.y;

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

    /********************************************************************************
    L.Control.bsInfoBox
    Represent a info-box in bsPosition
    ********************************************************************************/
    L.Control.BsInfoBox = function(options){
        this.id = options.id;
        this.options = options;
        var innerContainerClassName = this.innerContainerClassName = 'info-box-'+options.index;

        var boxOptions = this.boxOptions = {
                insideFormGroup : true,

                noValidation    : true,
                noBorder        : true,
                noVerticalPadding: true,
                noPadding       : true,
                type            : 'textbox',
                text            : function( $inner ){
                    $inner.addClass(innerContainerClassName + ' no-border');
                },
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
            boxOptions.before.class = boxOptions.before.class + ' ' + (options.before.class || options.before.className || '');
        }

        if (options.after){
            boxOptions.after.icon = options.after.icon || boxOptions.after.icon;
            if (options.after.onClick){
                boxOptions.after.class    = '';
                boxOptions.after.onClick  = options.after.onClick;
            }
            boxOptions.after.class = boxOptions.after.class + ' ' + (options.after.class || options.after.className || '');
        }
        else
            delete boxOptions.after;

    };

    L.Control.BsInfoBox.prototype = {
        _create$content: function(){
            if (this.$container) return;

            //Create the content inside a dummy div
            var $parent = $('<div/>');

            $parent._bsAppendContent( this.boxOptions );

            this.$contentContainer  =
                $parent.find('.' + this.innerContainerClassName).parent()
                    .addClass('d-flex bsPosition-content justify-content-center align-items-center flex-grow-1 text-nowrap')
                    .toggleClass('hide-for-no-cursor-on-map', !this.options.alwaysVisible);

            this.$container = this.$contentContainer.parent();
            this.$container
                .addClass('flex-nowrap')
                .detach();

            this.$contentContainer
                .empty()
                ._bsAddHtml(this.options.content);
        },


        addTo: function(bsPositionControl){
            if (this.bsPositionControl) return this;

            this.bsPositionControl = bsPositionControl;

            this._create$content();
            this.bsPositionControl.$innerContentContainer.append(this.$container);

            //Remove tooltip from active buttons
            this.$contentContainer.parent().find('a:not(.disabled)').each(function(){ bsPositionControl.removeTooltip( $(this) ); });

            return this;
        },

        remove: function(){
            if (!this.bsPositionControl) return this;

            this.$container.detach();

            this.bsPositionControl = null;
            return this;
        }
    };

}(jQuery, L, this, document));


;
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
            semiTransparent: true,

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
                this._adjustPopupList([
/* SLIDER REMOVED FOR NOW. Waits for better slider-zoom in leaflet
                    {text: 'Zoom'},
                    {type:'checkbox', text: {da:'Vis slider', en:'Show slider'}, selected: this.options.showSlider, onChange: $.proxy(this._showSlider, this), closeOnClick: true},
//*/
                    {id: 'showHistory', type:'checkbox', text: {da:'Vis historik-knapper', en:'Show History Buttons'}, selected: this.options.showHistory, onChange: $.proxy(this._showHistory, this), closeOnClick: true},
                ]);
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
                bsButtonClassNames = $.bsButton({square: true, _bigIcon: true}).attr('class'),
                $zoomContainer = $(this.zoom._container);
            $zoomContainer
                .removeClass()
                .addClass( bsButtonGroupClassNames )
                .appendTo( $contentContainer );

            //Replace text +/- with icons
            var zoom = this.zoom;
            $.each({
                _zoomInButton : 'fa-plus',
                _zoomOutButton: 'fa-minus'
            }, function(elemId, iconClass){
                $._bsCreateIcon(iconClass, $(zoom[elemId]).empty());
            });

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

            //Need to cache contextmenu on leaflet-buttons and call contextmenu on container
            var _this         = this,
                onContextmenu = function(e){
                    e.preventDefault();
                    _this.$popupElements.contextmenu();
                };

            $.each(['_zoomInButton', '_zoomOutButton'], function( index, id ){
                if (_this.zoom[id])
                    $(_this.zoom[id]).on('contextmenu', onContextmenu);
            });

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


;
/****************************************************************************
leaflet-bootstrap-control-legend.js

****************************************************************************/
(function ($, L, window, document, undefined) {
    "use strict";

    var legendCounter = 0;

    L.Control.BsLegend = L.Control.BsButtonBox.extend({
        hasRelativeHeight: true,
        options: {
            position        : "topright",
            icon            : 'fa-list',
            bigIcon         : true,
            semiTransparent : true,
            content: {
                header          : {
                    icon: 'fas fa-list',
                    text: {da: 'Signaturforklaring', en:'Legend'}
                },
                icons: {
                    extend  : { onClick: function(){/*Empty*/} },
                    diminish: { onClick: function(){/*Empty*/} }
                },
                clickable           : false,
                noVerticalPadding   : false,
                noHorizontalPadding : false,
                scroll              : true,
                semiTransparent     : true,
                width               : 300,
                content             : '<div class="no-layer"/>',
            },
        },

        /*******************************************
        initialize
        *******************************************/
        initialize: function(options) {
            this.options = $.extend(true, this.options, options);
            L.Control.BsButtonBox.prototype.initialize.call(this);

            this.legends = {};
            this.list = [];
        },

        /*******************************************
        onAdd
        *******************************************/
        onAdd: function(map) {
            //Adjust options for width and height
            this.options.content.header    = this.options.header    || this.options.content.header;
            this.options.content.width     = this.options.width     || this.options.content.width;
            this.options.content.maxHeight = this.options.maxHeight || this.options.content.maxHeight;

            var result = L.Control.BsButtonBox.prototype.onAdd.call(this, map);


            this.bsModal = this.$contentContainer.bsModal;
            this.$modalContent = this.bsModal.$content;

            //Manually implement extend and diminish functionality
            var $header = this.bsModal.$header;
            this.extendIcon = $header.find('[data-header-icon-id="extend"]');
            this.extendIcon.on('click', $.proxy(this.extendAll, this) );

            this.diminishIcon = $header.find('[data-header-icon-id="diminish"]');
            this.diminishIcon.on('click', $.proxy(this.diminishAll, this) );

            //Add the 'No layer' text
            this.$noLayer = this.$modalContent.find('.no-layer')
                    .i18n({da: 'Ingen ting...', en:'Nothing...'})
                    .addClass('text-center w-100 text-secondary');

            this.update();

            return result;
        },

        diminishAll: function(){
            $.each(this.list, function(index, legend){
                if (!legend.$modalContent.hasClass('modal-normal') && legend.options.hasContent)
                    legend.$container._bsModalDiminish();
            });
        },
        extendAll: function(){
            $.each(this.list, function(index, legend){
                if (!legend.$modalContent.hasClass('modal-extended') && legend.options.hasContent)
                    legend.$container._bsModalExtend();
            });
        },

        /*******************************************
        update
        *******************************************/
        update: function() {
            this.$noLayer.toggle( !this.list.length );

            //Sort the list
            this.list.sort(function(item1,item2){ return item1.index - item2.index; });
            var $content = this.$modalContent;
            $.each(this.list, function(index, legend){
                legend.indexInList = index;
                legend.$container.detach();
                $content.append( legend.$container );
            });
        },

        /*******************************************
        addLegend
        *******************************************/
        addLegend: function(  options ) {
            var legendId = '_'+legendCounter++,
                newLegend = options instanceof L.BsLegend ? options : new L.BsLegend(options);
            newLegend.id = legendId;
            newLegend.index = newLegend.index == undefined ? this.list.length : newLegend.index;

            this.legends[legendId] = newLegend;
            this.list.push(newLegend);
            newLegend.addTo(this);

            this.legends[legendId].update();
            this.update();

           return newLegend;
        },

        /*******************************************
        removeLegend
        *******************************************/
        removeLegend: function(legend) {
            var legendId = legend instanceof L.BsLegend ? legend.id : legend;
            legend = this.legends[legendId];
            if (legend){
                legend.onRemove();
                delete this.legends[legendId];
                this.list.splice(legend.indexInList, 1);
            }
            this.update();
        },

        /*******************************************
        showLegend
        *******************************************/
        showLegend: function( legendId, extended ){
            if (this.legends[legendId])
                this.legends[legendId].show(extended);
        },

        /*******************************************
        hideLegend
        *******************************************/
        hideLegend: function( legendId ){
            if (this.legends[legendId])
                this.legends[legendId].hide();
        },

        /*******************************************
        showLegendContent
        *******************************************/
        showLegendContent: function( legendId, extended ){
            if (this.legends[legendId])
                this.legends[legendId].showContent(extended);
        },

        /*******************************************
        hideLegendContent
        *******************************************/
        hideLegendContent: function( legendId ){
            if (this.legends[legendId])
                this.legends[legendId].hideContent();
        },

        /*******************************************
        updateLegend
        *******************************************/
        updateLegend: function( legendId, options ){
            if (this.legends[legendId])
                this.legends[legendId].update( options );
        }
    }); //end of L.Control.BsLegend = L.Control.BsButtonBox.extend({

    //Install L.Control.BsLegend
    L.Map.mergeOptions({
        bsLegendControl: false,
        bsLegendOptions: {}
    });

    L.Map.addInitHook(function () {
        if (this.options.bsLegendControl){
            this.bsLegendControl = new L.Control.BsLegend( this.options.bsLegendOptions );
            this.addControl(this.bsLegendControl);
        }
    });


    /*****************************************************************
    ******************************************************************
    Legend
    options:
        normalIconClass: class-name(s) for icons when layer is normal (visible)
        hiddenIconClass: class-name(s) for icon when layer is hidden
        buttons/buttonList: []button-options.
        NOTE:

    Note: All buttons in options.buttons will have event-methods
    with arguments = (id, selected, $button, map, owner) where owner = the popup
    Eq.
    onClick : function(id, selected, $button, map, popup){...}, or
    onChange: function(id, selected, $button, map, popup){...}

    *******************************************************************
    ******************************************************************/
    L.BsLegend_defaultOptions = {
        show       : true,  //Show or hide the legend at init
        showContent: true,  //Show or hide the content at init
        showIcons  : true,  //Show or hide the icon-buttons t the header at init
        isExtended : true,  //Extend/diminish the legend at init

        //closeIconOptions = options for the close-icon in the header that removes the layer
        closeIconOptions: {
            icon     : ['fa-map fa-scale-x-08', 'fa-slash fa-scale-x-08'],
            className: 'fa-map-margin-right',
            title    : {da:'Skjul', en:'Hide'},
        }
    };


    L.BsLegend = function( options ){
        this.options = $.extend(true, {}, L.BsLegend_defaultOptions, options);
        this.index = options.index;
    };

    //Extend the prototype
    L.BsLegend.prototype = {
        /*******************************************
        addTo
        *******************************************/
        addTo: function( parent ){
            var _this = this,
                options = this.options,
                normalIcon = options.icon || 'fa-square text-white',
                normalIconIsStackedIcon = false;

            //Add class to normal-icon to make it visible when working = off
            if ($.isArray(normalIcon))
                normalIconIsStackedIcon = true;
            else
                normalIcon = normalIcon + ' hide-for-bsl-working';
            /*
            Create 2+1 icons:
            The first for layer=visible contains of two icons: normal and working
            The second for layer=hidden contains not-visible-icon
            */
            this.options.iconArray = [
                [normalIcon, 'show-for-bsl-working fa-fw fas fa-spinner fa-spin no-margin-left'],
                'fa-fw fas fa-eye-slash ' + (this.options.hiddenIconClass || '')
            ];


            this.parent = parent;
            if (!this.$container){
                //Create modal-content
                    var modalContentOptions = {
                        noShadow: true,
                        scroll  : false,
                        header: {
                            icon: options.iconArray,
                            text: options.text
                        },
                        onInfo     : options.onInfo,
                        onWarning  : options.onWarning,
                        icons      : {},
                        content    : '',
                        closeButton: false
                    };


                //The extended content can be 'normal' content and/or buttons/buttonList
                if (options.content || options.buttons || options.buttonList){
                    var content = [];

                    if (options.content){

                        this.$contentContainer =
                            $('<div/>')
                                .addClass('modal-body')
                                .addClass(options.contentClassName)

                                .toggleClass('no-vertical-padding',   !!options.noVerticalPadding)
                                .toggleClass('no-horizontal-padding', !!options.noHorizontalPadding);

                        this.updateContent();

                        content.push( this.$contentContainer );
                    }


                    var buttonList = L._adjustButtonList(options.buttons || options.buttonList, this );
                    if (buttonList){

                        //Buttons added inside button-bar. If button-options have first: true => new 'line' = new bsButtonGroup
                        var groupList = [],
                            currentList = [];

                        buttonList.forEach( function(buttonOptions){
                            if (buttonOptions.isFirstButton && currentList.length){
                                groupList.push( currentList );
                                currentList = [];
                            }

                            currentList.push( buttonOptions );

                            if (buttonOptions.isLastButton){
                                groupList.push( currentList );
                                currentList = [];
                            }
                        });
                        if (currentList.length)
                            groupList.push( currentList );

                        var $buttonContainer = this.$buttonContainer = $('<div/>').addClass('modal-footer d-block');
                        groupList.forEach( function( list ){
                            $.bsButtonBar({
                                small   : true,
                                buttons : list,
                                justify : 'center'
                            }).appendTo( $buttonContainer );
                        });

                        content.push( this.$buttonContainer );
                    }

                    modalContentOptions.extended = {content: content};

                    modalContentOptions.isExtended = this.options.isExtended;
                    options.hasContent = true;
                }

                options.onRemove = options.onRemove || options.onClose;
                if (options.onRemove)
                    modalContentOptions.icons.close = $.extend(
                        {onClick: $.proxy(this.remove, this)},
                        options.closeIconOptions
                    );
                this.$container    = $('<div/>')._bsModalContent(modalContentOptions);
                this.bsModal = this.$container.bsModal;
                this.$modalContent = this.bsModal.$modalContent;


                //Find all header icons
                this.stateIcons = this.bsModal.$header.children();
                var $normalIcon = $(this.stateIcons[0]);
                $normalIcon.addClass('fa-fw ' + (this.options.normalIconClass || ''));
                if (normalIconIsStackedIcon)
                    $normalIcon.children('.container-stacked-icons').addClass('hide-for-bsl-working');

                this.actionIcons = {};
                $.each(['warning', 'info', 'help', 'close'], function(index, id){
                    _this.actionIcons[id] = _this.$container.find('[data-header-icon-id="'+id+'"]');
                    _this.actionIcons[id].toggle(_this.options.showIcons || (id == 'close'));
                });

                this.sizeIcons = {};
                $.each(['extend', 'diminish'], function(index, id){
                    _this.sizeIcons[id] = _this.$container.find('[data-header-icon-id="'+id+'"]');
                });

                this.$header = this.$container.find('.modal-header');


                this.toggleContent( this.options.showContent );
                this.toggle( this.options.show );

                this.setStateNormal();

                this.workingOff();
            }

            this.$container.appendTo(this.parent.$modalContent);

        },

        /*******************************************
        Show or hide icons
        *******************************************/
        toggleIcon: function(id, show){
            this.actionIcons[id].toggle(!!show);
            return this;
        },
        showIcon: function(id){
            return this.toggleIcon(id, true);
        },
        hideIcon: function(id){
            return this.toggleIcon(id, false);
        },

        workingToggle: function(on){
            return this.$header.modernizrToggle('bsl-working', on);

        },
        workingOn : function(){ return this.workingToggle(true ); },
        workingOff: function(){ return this.workingToggle(false); },



        _setState: function(visible){
            $(this.stateIcons[0]).toggle(visible);
            $(this.stateIcons[1]).toggle(!visible);
            return this;
        },
        setStateNormal   : function(){ return this._setState(true); },
        setStateHidden   : function(){ return this._setState(false); },
        setStateInvisible: function(){ return this.setStateHidden(); },


        /*******************************************
        show
        *******************************************/
        show: function( extended ){
            return this.toggle(true, extended);
        },

        /*******************************************
        hide
        *******************************************/
        hide: function(extended){
            return this.toggle(false, extended);
        },

        /*******************************************
        toggle
        *******************************************/
        toggle: function(show, extended){
            this.$container.toggle(!!show);
            this.isShown = !!show;

            if (this.options.hasContent && (typeof extended == 'boolean')){
                //For unknown reasons _bsModalExtend is needed first
                this.$container._bsModalExtend();
                if (!extended)
                    this.$container._bsModalDiminish();
            }
            return this;
        },

        /*******************************************
        showContent
        *******************************************/
        showContent: function( extended ){
            return this.toggleContent(true, extended);
        },

        /*******************************************
        hideContent
        *******************************************/
        hideContent: function( extended ){
            return this.toggleContent(false, extended);
        },

        /*******************************************
        toggleContent
        *******************************************/
        toggleContent: function( show, extended ){
            show = show && this.options.hasContent;
            $.each(this.sizeIcons, function(id, $icon){
                $icon.css('visibility', show ? 'visible' : 'hidden');
            });

            if (this.options.hasContent){
                this.bsModal.extended.$body.toggleClass('modal-body-no-content', !show);

                if (typeof extended == 'boolean')
                    this.toggle(this.isShown, extended);
            }
        },

        /*******************************************
        remove
        *******************************************/
        remove: function(e){
            //Since this.parent.removeLegend removed DOM-elements the event must stop propagation
            L.DomEvent.stopPropagation(e);
            this.parent.removeLegend(this);
        },

        onRemove: function(){
            if (this.$container)
                this.$container.detach();
            this.options.onRemove(this);
        },

        /*******************************************
        update
        *******************************************/
        update: function( content, contentContext, contentArg ){
            this.updateContent(content, contentContext, contentArg);

            if (this.options.onUpdate)
                this.options.onUpdate(this);
        },

        updateContent( content, contentContext, contentArg ){
            this.options.content        = content        || this.options.content;
            this.options.contentContext = contentContext || this.options.contentContext;
            this.options.contentArg     = contentArg     || this.options.contentArg;

            if (this.$contentContainer)
                this.$contentContainer
                    .empty()
                    ._bsAppendContent( this.options.content, this.options.contentContext, this.options.contentArg );
        }

    };

}(jQuery, L, this, document));




;
/****************************************************************************
leaflet-bootstrap-compass-device.js

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

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

            window.geolocation.onDeviceorientation(this.update, this);

            return result;
        },

        /*******************************************
        update
        *******************************************/
        update: function( event = {}) {

            var orientation = event.deviceorientation || (event.deviceorientation === 0) ? event.deviceorientation : null,
                orientationExists = orientation !== null,
                orientationSecondary = (event.type || '').toUpperCase().includes("SECONDARY");

            /*
            portrait-primary
            portrait-secondary
            landscape-primary
            landscape-secondary
            */
            this.bsButton.parent().toggleClass('no-device-orientation', !orientationExists);

            if (orientationExists){

                $('html')
                    .toggleClass('orientation-primary',   !orientationSecondary)
                    .toggleClass('orientation-secondary',  orientationSecondary);

                this.$container.find('.rotate').css('transform', 'rotate('+ orientation + 'deg)');
                this.$container.find('.rotate-compass').css('transform', 'rotate('+ -1*orientation + 'deg)');

                var offset = 0;
                switch (event.type){
                    case 'portrait-primary'     : offset =   0; break;
                    case 'portrait-secondary'   : offset = 180; break;
                    case 'landscape-primary'    : offset =  90; break;
                    case 'landscape-secondary'  : offset = 270; break;
                }

                orientation = (orientation + offset +360) % 360;

                this.options.setOrientationNumber(orientation, this.$orientation, this);
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
;
/****************************************************************************
leaflet-bootstrap-popup.js

Adjust standard Leaflet popup to display as Bootstrap modal

Note: All buttons in options.buttons will have event-methods
with arguments = (id, selected, $button, map, owner) where owner = the popup
Eq., onClick: function(id, selected, $button, map, popup){...}

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    /*********************************************************
    Overwrite default Popu-options:
    1: Remove default leaflet closeButton
    2: Adjust offset to match new popup-tip
    *********************************************************/
    L.Popup.prototype.options.closeButton = false;
    L.Popup.prototype.options.offset = [0, 11];
    //L.Popup.prototype.options.autoPan = false;  //Set it to false if you don't want the map to do panning animation to fit the opened popup.


    //Add methods to pin or unpin popup
    L.Popup.prototype._setPinned = function(pinned) {
        this._pinned = pinned = !!pinned;

        //Update pin-icon (if avaiable)
        if (this.bsModal && this.bsModal.$modalContent){
            this.bsModal.isPinned = pinned;
            this.bsModal.$modalContent.modernizrToggle('modal-pinned', pinned );
        }

        //Update related options
        this.options.closeOnEscapeKey = !pinned;
        this.options.autoClose        = !pinned;
    };

    /*********************************************************
    popup._brintToFocus: Close the open popup (if any and not fixed) and bring this to front
    *********************************************************/
    L.Popup.prototype._brintToFocus = function() {
        this.bringToFront();
        if (this._map && this._map._popup && this._map._popup !== this && !this._map._popup._pinned)
            this._map.closePopup(this._map._popup);
    };

    /*********************************************************
    Adjust Popup._close and Popup._onCloseButtonClick
    to only close popup if it isn't pinned or it is closed from close-button
    *********************************************************/
    L.Popup.prototype.close = function (close) {
        return function () {
            if (!this._pinned || this._closeViaCloseButton){
                this._closeViaCloseButton = false;

                if (this.showingTooltipOnPopup){
                    //Move tooltip back into the original pane
                    this.showingTooltipOnPopup = false;

//                    this._source.closeTooltip();
                    this._source.getTooltip().options.pane = 'tooltipPane';
                }
                close.apply(this, arguments);
            }
        };
    } (L.Popup.prototype.close);

    L.Popup.prototype._onCloseButtonClick = function() {
        this._closeViaCloseButton = true;
        this.close();
    };


    /*********************************************************
    Extend L.Popup._initLayout to create popup with Bootstrap-components
    and add event onOpen and onClose
    *********************************************************/
    function popup_onOpen(event){
        var popup   = event.target,
            options = popup.options,
            arg     = options.onOpenArg ? options.onOpenArg.slice() : [];
        arg.unshift(popup);
        options.onOpen.apply(options.onOpenContext, arg);
    }

    function popup_onClose(event){
        var popup   = event.target,
            options = popup.options,
            arg     = options.onCloseArg ? options.onCloseArg.slice() : [];
        arg.unshift(popup);
        options.onClose.apply(options.onCloseContext, arg);
    }

    L.Popup.prototype._initLayout = function (_initLayout) {
        return function () {
            //Original function/method
            _initLayout.apply(this, arguments);

            //Save ref to popup in DOM-element
            $(this._container).data('popup', this);

            //Set class-name for wrapper to remove margin, bg-color etc.
            $(this._wrapper).addClass('modal-wrapper');

            //Set class-name for _contentNode to make it a 'small' bsModal
            $(this._contentNode)._bsAddBaseClassAndSize({
                baseClass   : 'modal-dialog',
                class       : 'modal-dialog-inline',
                useTouchSize: true,
                small       : true
            });

            //Add onOpen and onClose events from options (if any)
            if (this.options.onOpen)
                this.on('add', popup_onOpen);
            if (this.options.onClose)
                this.on('remove', popup_onClose);

            //Close open popup and brint to front when "touched"
            L.DomEvent.on(this._contentNode, 'click', this._brintToFocus, this );

            return this;
        };
    } (L.Popup.prototype._initLayout);


    /*********************************************************
    Overwrite L.Popup._updateLayout to simple get _containerWidth
    as the width of the container
    *********************************************************/
    L.Popup.prototype._updateLayout = function(){
        this._containerWidth = $(this._container).width();
    };

    /*********************************************************
    Overwrite L.Popup._updatePosition to get correct width every time
    *********************************************************/
    L.Popup.prototype._updatePosition = function(_updatePosition){
        return function () {
            this._updateLayout();
            _updatePosition.apply(this, arguments);
        };
    } (L.Popup.prototype._updatePosition);

    /*********************************************************
    Overwrite L.Popup._updateContent to update inside bsModal-body
    *********************************************************/
    L.Popup.prototype._updateContent = function(){
        //Reset pinned-status
        var _this = this,
            isPinned = !!this._pinned;
        this._setPinned(false);

        //Create and adjust options in this._content into options for bsModal
        //this._content can be 1: string or function, 2: object with the content, 3: Full popup-options.
        //If any of the contents are functions the functions must be function($body, popup, map)
        //Convert this._content into bsModal-options

        var contentAsModalOptions = $.isPlainObject(this._content) ? this._content : {content: this._content},
            contentArg = [this, this._map],
            modalOptions = $.extend(true, {
                small         : true,
                smallButtons  : true,
                icons         : {
                    close: {
                        onClick: $.proxy(this._onCloseButtonClick, this)
                    }
                },
                closeButton   : contentAsModalOptions.closeButton === true, //Change default to false
                noHeader      : !contentAsModalOptions.header,
                contentContext: this,
                contentArg    : contentArg,
                onChange      : $.proxy( this._updatePosition, this )
            },
            contentAsModalOptions );


        function adjustButtons( opt, owner ){

            if ( $.isPlainObject(opt) &&
                 ( opt.onClick ||    //Default button without type
                   (opt.type && ['button', 'checkboxbutton', 'standardcheckboxbutton', 'iconcheckboxbutton', 'checkbox'].includes(opt.type))
                 )
               )
                return L._adjustButton(opt, owner);

            if ($.isPlainObject(opt) || $.isArray(opt))
                $.each(opt, function(idOrIndex, subOpt){
                    opt[idOrIndex] = adjustButtons(subOpt, owner);
                });
            return opt;
        }

        //Adjust buttons in content(s) and buttons to include map in arguments for onClick/onChange
        $.each(['content', 'extended.content', 'minimized.content', 'buttons'], function(index, idStr){
            var idList = idStr.split('.'),
                lastId = idList.pop(),
                parent = modalOptions,
                exists = true;

            $.each(idList, function(index, id){
                if (parent[id])
                    parent = parent[id];
                else
                    exists = false;
            });

            if (exists && parent[lastId])
                parent[lastId] = adjustButtons( parent[lastId], _this );
        });


        if (modalOptions.minimized)
            modalOptions.minimized.contentArg = contentArg;

        if (modalOptions.extended)
            modalOptions.extended.contentArg = contentArg;

        if (modalOptions.fixable){
            this.options.fixable = true;
            modalOptions.onPin = $.proxy( this._setPinned, this);
        }

        //If any of the posible contents are clickable => add hover effect to the tip
        if ( modalOptions.clickable ||
             (modalOptions.minimized && modalOptions.minimized.clickable) ||
             (modalOptions.extended && modalOptions.extended.clickable)
           )
            $(this._wrapper).addClass('clickable');

        //Adjust options for bsModal
        if (modalOptions.extended){
            //If no scroll-options is given => default = true
            if (typeof modalOptions.extended.scroll !== 'boolean')
                modalOptions.extended.scroll = true;

            //If no extended height or width is given => use same as not-extended
            if (!modalOptions.extended.height && !modalOptions.extended.maxHeight)
                modalOptions.extended.height = true;

            if (!modalOptions.extended.width && !modalOptions.extended.maxWidth)
                modalOptions.extended.width = true;
        }


        //Save modal-options and content
        this.modalOptions = modalOptions;

        //Get the content-node and build the content as a Bootstrap modal
        this.$contentNode = $(this._contentNode);
        this.$contentNode
            .empty()
            ._bsModalContent( modalOptions );

        //Save the modal-object
        this.bsModal = this.$contentNode.bsModal;

        //If any of the contents (minimized, normal, or extended) should have the same tooltip as the source
        if (this._source && this._source.getTooltip()){
            var $list = [];
            $.each(['', 'minimized', 'extended'], function(index, id){
                var show     = id ? modalOptions[id] && modalOptions[id].showTooltip : modalOptions.showTooltip,
                    elements = id ? _this.bsModal[id] : _this.bsModal;
                if (show){
                    $list.push(elements.$body);
                    if (elements.$fixedContent)
                        $list.push(elements.$fixedContent);
                }
            });

            this.showingTooltipOnPopup = !!$list.length;

            if (this.showingTooltipOnPopup){
                //Move the tooltip from tooltip-pane to a tempory pane just above popups
                this._source.getTooltip().options.pane = this._map.getPaneAbove('popupPane');
                var this_source = this._source;

                this_source.showtooltip_mouseenter =
                    this_source.showtooltip_mouseenter ||
                    $.proxy(function(){
                        if (this._popup.showingTooltipOnPopup){
                            this.openTooltip();
                            this.showTooltip();
                        }
                    }, this_source);

                this_source.showtooltip_mouseleave =
                    this_source.showtooltip_mouseleave ||
                    $.proxy(function(){
                        if (this._popup.showingTooltipOnPopup){
                            this.closeTooltip();
                            this.hideTooltip();
                        }
                    }, this_source);

                this_source.showtooltip_mousemove =
                    this_source.showtooltip_mousemove ||
                    $.proxy(this_source._moveTooltip, this_source);

                $.each($list, function(index, $elem){
                    $elem
                        .on('mouseenter', this_source.showtooltip_mouseenter)
                        .on('mouseleave', this_source.showtooltip_mouseleave)
                        .on('mousemove',  this_source.showtooltip_mousemove);
                });
            }
        }

        this._setPinned(isPinned);

        this.fire('contentupdate');
    };

    /*********************************************************
    NEW METHOD FOR L.Popup
    *********************************************************/
    /*********************************************************
    L.Popup.changeContent - only changes the content
    of the "body" of the bsModal inside the popup
    *********************************************************/
    L.Popup.prototype.changeContent = function(content, contentContext) {
        var size = null,
            _contentContent = ($.isPlainObject(content) && !!content.content) ? content : {content: content, contentContext: contentContext};

        $.extend(this._content, _contentContent );

        if (this.isOpen()){
            size = this.getSize();

            //Update normal content
            this.bsModal.$body.empty();
            this.bsModal.$body._bsAppendContent(
                this._content.content,
                this._content.contentContext,
                this._content.contentArg
            );

            if (this.bsModal.minimized){
                //Update extended content
                this.bsModal.minimized.$body.empty();
                this.bsModal.minimized.$body._bsAppendContent(
                    this._content.minimized.content,
                    this._content.minimized.contentContext,
                    this._content.minimized.contentArg
                );
            }

            if (this.bsModal.extended){
                //Update extended content
                this.bsModal.extended.$body.empty();
                this.bsModal.extended.$body._bsAppendContent(
                    this._content.extended.content,
                    this._content.extended.contentContext,
                    this._content.extended.contentArg
                );
            }

        }

        this.update();

        if (size)
            this.setSize(size);

		return this;
	};

    /******************************************************
    Methods to get and set the size of the popup
    extend()
    diminish()
    getSize()
    setSize(size)
    setSizeExtended()
    setSizeNormal()
    setSizeMinimized()
    ******************************************************/
    L.Popup.prototype.extend = function(){
        this.$contentNode._bsModalExtend();
        return this;
    };

    L.Popup.prototype.diminish = function(){
        this.$contentNode._bsModalDiminish();
        return this;
    };


    L.Popup.prototype.getSize = function(){
        return this.$contentNode._bsModalGetSize();
    };

    L.Popup.prototype.setSize = function(size){
        this.$contentNode._bsModalSetSize(size);
        return this;
    };

    L.Popup.prototype.setSizeExtended  = function(){ return this.setSize($.MODAL_SIZE_EXTENDED ); };
    L.Popup.prototype.setSizeNormal    = function(){ return this.setSize($.MODAL_SIZE_NORMAL   ); };
    L.Popup.prototype.setSizeMinimized = function(){ return this.setSize($.MODAL_SIZE_MINIMIZED); };


    /*********************************************************
    L.Popup.changeContent - only changes the content
    of the "body" of the bsModal inside the popup
    *********************************************************/



    /*********************************************************
    NEW METHOD FOR L.Map
    L.Map.closeAllPopup - close all popup on the map
    *********************************************************/
    L.Map.prototype.closeAllPopup = function() {
        $(this.getPane('popupPane')).find('.leaflet-popup').each(function(){
            $(this).data('popup').close();
        });
    };

}(jQuery, L, this, document));

;
/****************************************************************************
    leaflet-bootstrap-tooltip.js,

    (c) 2017, FCOO

    https://github.com/FCOO/leaflet-bootstrap
    https://github.com/FCOO

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    /*********************************************************
    Overwrite L.Tooltip._initLayout to add
    leaflet-tooltip-permanent and leaflet-tooltip-big-icon and leaflet-tooltip-hide-when-dragging
    to class-name (when needed)
    *********************************************************/
    L.Tooltip.prototype._initLayout = function( _initLayout ){
        return function(){
            this.options.className = this.options.className || '';
            if (this.options.permanent)
                this.options.className +=  ' leaflet-tooltip-permanent';

            if (this.options.hideWhenDragging)
                this.options.className +=  ' leaflet-tooltip-hide-when-dragging';


            if (this._source && this._source.$icon){
                if (this._source.$icon.hasClass('lbm-number'))
                    this.options.className += ' leaflet-tooltip-number-icon';
                if (this._source.$icon.hasClass('lbm-big'))
                    this.options.className += ' leaflet-tooltip-big-icon';
            }

            _initLayout.apply( this, arguments );
        };
    }( L.Tooltip.prototype._initLayout );


    /*********************************************************
    Overwrite L.Tooltip._updateContent to update tooltip with Bootstrap-content
    *********************************************************/
    L.Tooltip.prototype._updateContent = function () {
        $(this._contentNode)
            .empty()
            ._bsAddHtml( this._content, true );

		this.fire('contentupdate');
    };

    /*********************************************************
    Extend L.Layer with methods to show and hide tooltip
    *********************************************************/
    L.Layer.prototype.showTooltip = function() {
        var tooltip = this.getTooltip();
        if (tooltip)
            tooltip.setOpacity(this._saveTooltipOpacity);
        return this;
    };

    L.Layer.prototype.hideTooltip = function() {
        var tooltip = this.getTooltip();
        if (tooltip){
            this._saveTooltipOpacity = tooltip.options.opacity;
            tooltip.setOpacity(0);
        }
        return this;
    };

    /*********************************************************
    Overwrite L.Layer.bindTooltip to check for this.options
    regarding tooltip and add events to hide tooltips when
    popup is open
    *********************************************************/
    L.Layer.prototype.bindTooltip = function( bindTooltip ){
        return function(content, options){
            if (this && this.options){
                options =
                    $.extend({
                        keepInView      : true,
                        sticky          : !this.options.tooltipPermanent,       //If true, the tooltip will follow the mouse instead of being fixed at the feature center.
                        interactive     : false,                                //If true, the tooltip will listen to the feature events.
                        permanent       : this.options.tooltipPermanent,        //Whether to open the tooltip permanently or only on mouseover.
                        hideWhenDragging: this.options.tooltipHideWhenDragging  //True and tooltipPermanent: false => the tooltip is hidden when dragged
                    }, options);

                this.on('popupopen',  this._hideTooltipWhenPopupOpen,  this);
                this.on('popupclose', this._showTooltipWhenPopupClose, this);
            }
            return bindTooltip.call( this, content, options );
        };
    }( L.Layer.prototype.bindTooltip );

    L.Layer.prototype._hideTooltipWhenPopupOpen = function(){
        if (this && this.options && this.options.tooltipHideWhenPopupOpen && !this.options.tooltipPermanent)
            this.hideTooltip();
    };

    L.Layer.prototype._showTooltipWhenPopupClose = function(){
        if (this && this.options && this.options.tooltipHideWhenPopupOpen && !this.options.tooltipPermanent)
            this.showTooltip();
    };

}(jQuery, L, this, document));



