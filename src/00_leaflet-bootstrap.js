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



