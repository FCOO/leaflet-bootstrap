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
            center: true,
            square: true
        },

        _bsButtons = L.Control.extend({
            options: {
                position: 'topleft',
            },

            _createContent: function(){},

            onAdd: function() {
                var _this = this;
                this.options = $._bsAdjustOptions( this.options, defaultButtonOptions);
                if (this.options.list)
                    $.each(this.options.list, function(index, opt){
                        _this.options.list[index] = $._bsAdjustOptions( opt, defaultButtonOptions);
                });

                var container = this._createContent().get(0);

                L.DomEvent.disableClickPropagation( container );
                L.DomEvent.on(container, 'click', L.DomEvent.stop);
                L.DomEvent.on(container, 'click', this._refocusOnMap, this);

                return container;
            },
        });

    L.control.BsButton = _bsButtons.extend({
        _createContent: function(){ return $.bsButton(this.options); }
    });

    L.control.BsButtonGroup = _bsButtons.extend({
        options       : { vertical: true },
        _createContent: function(){ return $.bsButtonGroup(this.options); }
    });

    L.control.BsRadioButtonGroup = L.control.BsButtonGroup.extend({
//        options       : { vertical: true },
        _createContent: function(){ return $.bsRadioButtonGroup(this.options); }
    });

    L.control.bsButton           = function(options){ return new L.control.BsButton(options);           };
    L.control.bsButtonGroup      = function(options){ return new L.control.BsButtonGroup(options);      };
    L.control.bsRadioButtonGroup = function(options){ return new L.control.BsRadioButtonGroup(options); };


}(jQuery, L, this, document));

