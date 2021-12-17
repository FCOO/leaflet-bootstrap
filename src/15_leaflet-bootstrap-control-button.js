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

