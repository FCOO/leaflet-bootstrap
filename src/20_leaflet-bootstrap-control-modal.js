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

