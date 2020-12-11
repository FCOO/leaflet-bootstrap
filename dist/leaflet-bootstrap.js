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
        var paneBelowId = paneId+'below';

        if (!this.getPane(paneBelowId)){
            this.createPane(paneBelowId);

            this.whenReady( function(){
                var zIndex = $(this.getPanes()[paneId]).css('z-index');
                this[paneBelowId] = this.getPane(paneBelowId);
                $(this[paneBelowId]).css('z-index', zIndex-1 );
            }, this );
        }

        return this.getPane(paneBelowId);

    };

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

    var controlTooltipPane = 'controlTooltipPane';

    L.BsControl = L.Control.extend({
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
            L.Util.setOptions(this, options);
        },

        _getTooltipElements: function( container ){
            return this.options.getTooltipElements ? this.options.getTooltipElements(container) : $(container);
        },

        _getPopupElements: function( container ){
            return this._getTooltipElements(container) || $(container);
        },

        addTo: function(map) {
            this._controlTooltipContent = [];

            var result = L.Control.prototype.addTo.apply(this, arguments);
            L.DomEvent.disableClickPropagation(this._container);

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
                L.DomEvent.on(controlContainer, 'contextmenu dblclick mousewheel', L.DomEvent.stop);

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

            this.options.show ? this.show() : this.hide();
            return result;
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

            this.$container.css('visibility', this.options.show ? 'inherit' : 'hidden');
            this._onChange();
            return this;
        },

        onChange: function(/*options*/){
            //Nothing - overwriten by ancestors
        },

        _onChange: function(){
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
            if (this.$popupElements)
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
    });

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

            //Set default onToggle-function
            this.onToggle = $.proxy(this.toggle, this);
            if (this.options.addOnClose)
                this.options.onClose = this.onToggle;
        },

        addTo: function(){
            var result = L.Control.BsButton.prototype.addTo.apply(this, arguments);

            //If tooltips also is shown when not isExtended => create extra options and let adjustTooltip dynamic adjust tooltips
            if (this.options.addOnClose && this.options.tooltipOnButton)
                this._controlTooltipContent.unshift({id:'open', icon: this.options.leftClickIcon, text: this.options.openText});

            return result;
        },

        _createContent: function(){
            //Create container
            var $container = this.$container =
                    $('<div/>')
                        .addClass('leaflet-button-box')
                        .addClass(this.options.className)
                        .modernizrToggle('extended', !!this.options.extended);

            //Adjust options for the button and create it
            var buttonOptions = $.extend(true, {}, {
                        onClick        : this.onToggle,
                        semiTransparent: true,
                        square         : true,
                    },
                    this.options
                );

            this.bsButton =
                $.bsButton(buttonOptions)
                .addClass('hide-for-extended')
                //.toggleClass('fa-lg', buttonOptions.bigIcon)
                .appendTo($container);

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
                        },
                        this.options.content,
                        //Forced options
                        {
                            show: false,
                        }
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
            }

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
                return $.extend(
                    {isExtended: this.options.isExtended},
                    BsControl_getState.call(this)
                );
            };
        }(L.BsControl.prototype.getState),

        setState: function(BsControl_setState){
            return function (options) {
                BsControl_setState.call(this, options);
                this.$container.modernizrToggle('extended', this.options.isExtended);
                return this;
            };
        }(L.BsControl.prototype.setState),

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
//        var _bsModal = L.Control.extend({
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


                //Prevent different events from propagating to the map
                $modalContainer.on('contextmenu mousewheel', function( event ) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                });

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

                //ASdjust width and height
                $modalContainer._bsModalSetHeightAndWidth();

                var result = $result.get(0);
                L.DomEvent.disableClickPropagation( result );
                this.$outerContainer = $result;

                this.options.show = show;
                this.options.show ? this.show() : this.hide();
                return result;
            },
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
                    icon        : 'fa-ruler-combined', text: {da:'Vis trådkors', en:'Show Reticle'},
                    type        : 'checkbox',
                    closeOnClick: false,
                    selected    : this.options.showReticle,
                    onChange    : $.proxy(this._onShowReticle, this)
                };
            this.options.popupList = [];
            if (options.selectFormat)
                this.options.popupList.push(
                    {                 icon: this.options.icon, text: {da:'Skala (in situ)', en:'Scale (in situ)'} },
                    reticlePopup,
                    {type:'checkbox', id:'showBoth',           text: {da:'Vis km og nm', en:'Show km and nm'}, selected: this.options.showBoth, onChange: $.proxy(this._setBoth, this), closeOnClick: false},
                    {type:'button',   icon:'fa-cog',           text: {da:'Format...', en:'Format...'}, onClick: $.proxy(this.options.selectFormat, this), closeOnClick: true, }
                );
                else
                    this.options.popupList.push({
                            icon: this.options.icon,
                            text: {da:'Vis', en:'Show'}
                        },
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
            excludeMapContextmenu: false, //If true the mapss contxtmenu-items isn't shown
            parent: null, //Object witches contextmenu-items are also shown
        };

    ns.contextmenuInclude = {
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

             this._addContextmenuEventsAndRef();

            return this;
        },
        appendContextmenuItems : function( items ){ return this.addContextmenuItems( items, false ); },
        prependContextmenuItems: function( items ){ return this.addContextmenuItems( items, true  ); },

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


            var objectList = [], //List of objects with iterms for the contextmenu
                nextObj = source;
            while (nextObj){
                if (nextObj.contextmenuOptions){
                    objectList.push(nextObj);
                    nextObj = nextObj.contextmenuOptions.parent;
                }
                else
                    nextObj = null;
            }

            if (!firedOnMap && !source.contextmenuOptions.excludeMapContextmenu && this._map.contextmenuOptions)
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

                    item.class = 'text-truncate';
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

    /********************************************************************************
    L.Control.bsInfoBox
    Represent a info-box in bsPosition
    ********************************************************************************/
    L.Control.BsInfoBox = function(options){
        this.id = options.id;
        this.options = options;
        var innerContainerClassName = this.innerContainerClassName = 'info-box-'+options.index;

        var boxOptions = this.boxOptions = {
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
                    .addClass('hide-for-no-cursor-on-map d-flex bsPosition-content justify-content-center align-items-center flex-grow-1');

            this.$container = this.$contentContainer.parent();
            this.$container.detach();

            this.$contentContainer.empty()._bsAddHtml(this.options.content);

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

            this.$container.detach(); //remove();

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


;
/****************************************************************************
leaflet-bootstrap-control-legend.js

****************************************************************************/
(function ($, L, window, document, undefined) {
    "use strict";

    var legendCounter = 0;

    L.Control.BsLegend = L.Control.BsButtonBox.extend({
        options: {
            position        : "topright",
            icon            : 'fa-list',
            bigIcon         : true,
            semiTransparent : true,
            content: {
                header          : {
                    icon: 'fa-list',
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
            //Adjust options for width and heigth
            this.options.content.header    = this.options.header    || this.options.content.header;
            this.options.content.width     = this.options.width     || this.options.content.width;
            this.options.content.maxHeight = this.options.maxHeight || this.options.content.maxHeight;

            var result = L.Control.BsButtonBox.prototype.onAdd.call(this, map);
            this.$modalBody       = this.$contentContainer.bsModal.$body;

            //Manually implement extend and diminish functionality
            var $header = this.$contentContainer.bsModal.$header;
            this.extendIcon = $header.find('[data-header-icon-id="extend"]');
            this.extendIcon.on('click', $.proxy(this.extendAll, this) );

            this.diminishIcon = $header.find('[data-header-icon-id="diminish"]');
            this.diminishIcon.on('click', $.proxy(this.diminishAll, this) );

            //Add the 'No layer' text
            this.$noLayer = this.$modalBody.find('.no-layer')
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
            var $body = this.$modalBody;
            $.each(this.list, function(index, legend){
                legend.indexInList = index;
                legend.$container.detach();
                $body.append( legend.$container );
            });
        },

        /*******************************************
        addLegend
        *******************************************/
        addLegend: function(  options ) {
            var legendId = '_'+legendCounter++,
                newLegend = options instanceof BsLegend ? options : new BsLegend(options);
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
            var legendId = legend instanceof BsLegend ? legend.id : legend;
            legend = this.legends[legendId];
            if (legend){
                legend.onRemove();
                delete this.legends[legendId];
                this.list.splice(legend.indexInList, 1);
            }
            this.update();
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
    *******************************************************************
    ******************************************************************/
    function BsLegend( options ){
        this.options = options;
        this.index = options.index;
    }

    L.BsLegend = BsLegend;
    //Extend the prototype
    BsLegend.prototype = {
        //addTo
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

                    //noVerticalPadding: true,
                    //noHorizontalPadding: true,
                    noShadow: true,
                    header: {
                        icon: this.options.iconArray,
                        text: options.text
                    },
                    onInfo   : options.onInfo,
                    onWarning: options.onWarning,
                    icons: {
                    },
                    content    : '',
                    closeButton: false
                };


                //The extended content can be 'normal' content or buttons/buttonList
                if (options.content || options.buttons || options.buttonList){
                    if (options.content)
                        modalContentOptions.extended   = {content: options.content};
                    else {
                        var list = options.buttons || options.buttonList;
                        $.each(list, function(index, options){ options.type = 'button'; });
                        modalContentOptions.extended   = {className: 'text-right modal-footer', content: list};
                    }
                    modalContentOptions.isExtended = true;
                    options.hasContent = true;
                }

/*
        $.each( buttons, function( index, buttonOptions ){

            focusAdded = focusAdded || buttonOptions.focus;
            if (!focusAdded && (index+1 == buttons.length ) )
                buttonOptions.focus = true;

            //Add same onClick as close-icon if closeOnClick: true
            if (buttonOptions.closeOnClick)
                buttonOptions.equalIconId = (buttonOptions.equalIconId || '') + ' close';

            buttonOptions.class = defaultButtonClass + ' ' + (buttonOptions.className || '');

            var $button =
                $.bsButton( $.extend({}, defaultButtonOptions, buttonOptions ) )
                    .appendTo( $modalButtonContainer );



*/
                options.onRemove = options.onRemove || options.onClose;
                if (options.onRemove)
                    modalContentOptions.icons.close = {
                        title  : {da:'Skjul', en:'Hide'},
                        onClick: $.proxy(this.remove, this)
                    };
                this.$container    = $('<div/>')._bsModalContent(modalContentOptions);
                this.$modalContent = this.$container.bsModal.$modalContent;


                //Find all header icons
                this.stateIcons = this.$container.bsModal.$header.children();
                var $normalIcon = $(this.stateIcons[0]);
                $normalIcon.addClass('fa-fw ' + (this.options.normalIconClass || ''));
                if (normalIconIsStackedIcon)
                    $normalIcon.children('.container-stacked-icons').addClass('hide-for-bsl-working');

                this.actionIcons = {};
                $.each(['warning', 'info', 'help', 'close'], function(index, id){
                    _this.actionIcons[id] = _this.$container.find('[data-header-icon-id="'+id+'"]');
                });

                this.$header = this.$container.find('.modal-header');

                this.setStateNormal();
                this.workingOff();
            }

            this.$container.appendTo(this.parent.$modalBody);

        },

        //Show or hide icons
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


        //Remove legend
        remove: function(){
            this.parent.removeLegend(this);
        },
        onRemove: function(){
            if (this.$container)
                this.$container.detach();
            this.options.onRemove(this);
        },

        //update
        update: function(){
            if (this.options.onUpdate)
                this.options.onUpdate(this);
        },



    };


}(jQuery, L, this, document));




;
/****************************************************************************
leaflet-bootstrap-popup.js

Adjust standard Leaflet popup to display as Bootstrap modal

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
    L.Popup.prototype._close = function (_close) {
        return function () {
            if (!this._pinned || this._closeViaCloseButton){
                this._closeViaCloseButton = false;
                _close.apply(this, arguments);
            }
        };
    } (L.Popup.prototype._close);

    L.Popup.prototype._onCloseButtonClick = function (_onCloseButtonClick) {
        return function () {
            this._closeViaCloseButton = true;
            _onCloseButtonClick.apply(this, arguments);
        };
    } (L.Popup.prototype._onCloseButtonClick);

    /*********************************************************
    Extend L.Popup._initLayout to create popup with Bootstrap-components
    *********************************************************/
    L.Popup.prototype._initLayout = function (_initLayout) {
        return function () {
            //Original function/method
            _initLayout.apply(this, arguments);

            //Save ref to popup in DOM-eleemnt
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

            //Close open popup and brint to front when "touched"
            L.DomEvent.on(this._contentNode, 'mousedown', this._brintToFocus, this );

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
        var isPinned = !!this._pinned;
        this._setPinned(false);

        //Create and adjust options in this._content into options for bsModal
        //this._content can be 1: string or function, 2: object with the content, 3: Full popup-options
        //Convert this._content into bsModal-options
        var contentAsModalOptions = ($.isPlainObject(this._content) && !!this._content.content) ? this._content : {content: this._content},
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

                onChange: $.proxy( this._updatePosition, this )
            },
            contentAsModalOptions );

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
        var $contentNode = $(this._contentNode);
        $contentNode
            .empty()
            ._bsModalContent( modalOptions );

        //Save the modal-object
        this.bsModal = $contentNode.bsModal;

        this._setPinned(isPinned);

        this.fire('contentupdate');
    };

    /*********************************************************
    NEW METHOD L.Popup.changeContent - only changes the content
    of the "body" of the bsModal inside the popup
    *********************************************************/
    L.Popup.prototype.changeContent = function(content, contentContext) {
        var _contentContent = ($.isPlainObject(content) && !!content.content) ? content : {content: content, contentContext: contentContext};

        $.extend(this._content, _contentContent );

        //Update normal content
        this.bsModal.$body.empty();
        this.bsModal.$body._bsAppendContent(
            this._content.content,
            this._content.contentContext
        );


        if (this.bsModal.minimized){
            //Update extended content
            this.bsModal.minimized.$body.empty();
            this.bsModal.minimized.$body._bsAppendContent(
                this._content.minimized.content,
                this._content.minimized.contentContext
            );
        }

        if (this.bsModal.extended){
            //Update extended content
            this.bsModal.extended.$body.empty();
            this.bsModal.extended.$body._bsAppendContent(
                this._content.extended.content,
                this._content.extended.contentContext
            );
        }

        this.update();
		return this;
	};

    /*********************************************************
    NEW METHOD L.Map.closeAllPopup - close all popup on the map
    *********************************************************/
    L.Map.prototype.closeAllPopup = function() {
        $(this.getPane('popupPane')).find('.leaflet-popup').each(function(){
            $(this).data('popup')._close();
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



