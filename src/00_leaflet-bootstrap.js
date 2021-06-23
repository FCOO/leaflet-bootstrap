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
}(jQuery, L, this, document));



