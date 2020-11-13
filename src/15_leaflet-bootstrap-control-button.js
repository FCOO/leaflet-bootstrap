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
            if (this.options.addOnClose){
                //If tooltips also is shown when not isExtended => create extra options and let adjustTooltip dynamic adjust tooltips
                if (this.options.tooltipOnButton)
                    this._controlTooltipContent.push({id:'open', icon: this.options.leftClickIcon, text: this.options.openText});

                this.options.onClose = this.onToggle;
            }
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

            //Prevent different events from propagating to the map
            $contentContainer.on('contextmenu mousewheel', function( event ) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            });

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

