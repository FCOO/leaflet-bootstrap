/****************************************************************************
leaflet-bootstrap-control-button-box.js

Create a bsButton that opens a box with some content

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

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
                    ._bsAddBaseClassAndSize({
                        baseClass   : 'modal-dialog',
                        class       : 'modal-dialog-inline',
                        useTouchSize: true,
                        small       : true
                    })
                    .width('auto')
                    .addClass('show-for-extended')
                    .appendTo($container);

            //this.options = bsModal-options OR function($container, options, onToggle)
            if ($.isFunction(this.options.content))
                this.options.content($contentContainer, this.options, onToggle);
            else {
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
            return $container;
        },


        //toggle : change between button-state and extended
        toggle: function(){
            $(this.getContainer()).modernizrToggle('extended');
            return false;
        }
    });




    L.control.bsButtonBox = function(options){ return new  L.Control.BsButtonBox(options); };
}(jQuery, L, this, document));

