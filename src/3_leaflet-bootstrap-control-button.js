/****************************************************************************
leaflet-bootstrap-control-button.js

Create leaflet-control for jquery-bootstrap button-classes:
    L.control.bsButton( options )
    L.control.bsButtonGroup( options )
    L.control.bsRadioButtonGroup( options )



****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    var defaultButtonOptions = {
            center         : true,
            square         : true,
            returnFromClick: true
        },

        _bsButtons = L.BsControl.extend({
            options: {
                position: 'topleft'
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
        _createContent: function(){ return $.bsButton(this.options); }
    });

    L.Control.BsButtonGroup = _bsButtons.extend({
        options       : { vertical: true },
        _createContent: function(){ return $.bsButtonGroup(this.options); }
    });

    L.Control.BsRadioButtonGroup = L.Control.BsButtonGroup.extend({
//        options       : { vertical: true },
        _createContent: function(){ return $.bsRadioButtonGroup(this.options); }
    });

    L.control.bsButton           = function(options){ return new L.Control.BsButton(options);           };
    L.control.bsButtonGroup      = function(options){ return new L.Control.BsButtonGroup(options);      };
    L.control.bsRadioButtonGroup = function(options){ return new L.Control.BsRadioButtonGroup(options); };


    /********************************************************************************
    L.Control.BsButtonBox
    Create a bsButton that opens a box with bs-content given by options.content
    ********************************************************************************/
    L.Control.BsButtonBox = L.Control.BsButton.extend({
        options: {

        },
        _createContent: function(){
            //Create container
            var $container =
                    $('<div/>')
                        .addClass('leaflet-button-box')
                        .addClass(this.options.className)
                        .modernizrToggle('extended', !!this.options.extended),
                onToggle = $.proxy(this.toggle, this);

            //Adjust options for the button and create it
            var buttonOptions = $.extend(true, {}, {
                        onClick        : onToggle,
                        semiTransparent: true,
                        square         : true
                    },
                    this.options
                );

            this.bsButton =
                $.bsButton(buttonOptions)
                .addClass('hide-for-extended')
                .appendTo($container);

            //Create container for extended content
            var $contentContainer = this.$contentContainer =
                $('<div/>')
                    .width('auto')
                    .addClass('show-for-extended')
//HER                    .on('contextmenu', function(ev){ return L.DomEvent.stop(ev); })
                    .appendTo($container);

            //this.options = null OR bsModal-options OR function($container, options, onToggle)
            if (this.options.content){
                if ($.isFunction(this.options.content))
                    this.options.content($contentContainer, this.options, onToggle);
                else {
                    $contentContainer._bsAddBaseClassAndSize({
                        baseClass   : 'modal-dialog',
                        class       : 'modal-dialog-inline',
                        useTouchSize: true,
                        small       : true
                    });

                    //Adjust options for the content (modal) and create the it
                    var modalOptions = $.extend(true, {},
                        //Default options
                        {
                            closeButton     : false,
                            clickable       : true,
                            semiTransparent : true,
                            extended        : null,
                            minimized       : null,
                            isExtended      : false,
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
                        modalOptions.icons.close = { onClick: onToggle };
                    }

                    //Add default onClick
                    if (modalOptions.clickable && !modalOptions.onClick)
                        modalOptions.onClick = onToggle;

                    $contentContainer._bsModalContent(modalOptions);
                }
            }
            return $container;
        },

        _getTooltipElements: function( /*container*/ ){
            return this.$contentContainer;
        },


        //toggle : change between button-state and extended
        toggle: function(){
            this.hideTooltip();
            $(this.getContainer()).modernizrToggle('extended');
            return true;
        }
    });


    L.control.bsButtonBox = function(options){ return new L.Control.BsButtonBox(options); };

}(jQuery, L, this, document));

