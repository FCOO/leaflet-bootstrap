/****************************************************************************
leaflet-bootstrap-control-modal.js

Create leaflet-control for jquery-bootstrap modal-content:
    L.control.bsModal( options )

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

        /***************************************************
        _bsModal = common constructor for bsModal and bsFoam as Leaflet controls
        ***************************************************/
        var _bsModal = L.Control.extend({
            options: {
                position: 'topcenter',
            },

            show: function() { this.$outerContainer.show(); },
            hide: function() { this.$outerContainer.hide(); },

            //_createModal
            _createModal: function(){
                //this.bsModal = ...;
            },

            //onAdd
            onAdd: function() {
                this.options = $._bsAdjustOptions(
                    this.options,
                    this._defaultOptions,
                    {
                        small       : true,
                        smallButtons: true,
                    }
                );

                //Craete the this.bsModal and this.$container
                var show = this.options.show;
                this.options.show = false;
                this._createModal();
                this.$container  = this.bsModal.bsModal.$container;
                this.$container.detach();

                //Adjust this.bsModal
                this.bsModal.show   = $.proxy(this.show, this);
                this.bsModal._close = $.proxy(this.hide, this);


                //Create the element
                var $result = $('<div/>').addClass('leaflet-control');
                $('<div/>')
                    .addClass('modal-dialog modal-inline modal-sm')
                    .append( this.$container )
                    .appendTo( $result );

                if (this.options.maxHeight)
                    this.$container.css('max-height', this.options.maxHeight);
                if (this.options.minWidth)
                    this.$container.css('min-width', this.options.minWidth);
                if (this.options.width)
                    this.$container.css('width', this.options.width);

                var result = $result.get(0);
                L.DomEvent.disableClickPropagation( result );

                this.$outerContainer = $result;
                this.options.show = show;
                this.options.show ? this.show() : this.hide();
                return result;
            },
        });

        /***************************************************
        L.control.BsModal
        ***************************************************/
        L.control.BsModal = _bsModal.extend({
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
        L.control.BsModalForm
        ***************************************************/
        L.control.BsModalForm = _bsModal.extend({
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
                this.bsModalForm.edit(  values, tabIndexOrId );
            }

        });


        //*************************************
        L.control.bsModal     = function(options){ return new L.control.BsModal(options); };
        L.control.bsModalForm = function(options){ return new L.control.BsModalForm(options); };

}(jQuery, L, this, document));

