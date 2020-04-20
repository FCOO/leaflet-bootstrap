/****************************************************************************
9_leaflet-bootstrap-control-attribution.js

Create standard attribution control, but with position='bottomleft' and hide by css visibility

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    var defaultBsAttributionOptions = {
            position: 'bottomleft',
            prefix  : false
        };

    L.Map.mergeOptions({
        bsAttributionControl: false
    });

    L.Map.addInitHook(function () {
        if (this.options.bsAttributionControl) {
            this.bsAttributionControl = L.control.attribution( defaultBsAttributionOptions );

            this.bsAttributionControl.addTo(this);
            $(this.bsAttributionControl._container).addClass('leaflet-control-attribution-bs');

            $(this._container).addClass('has-control-attribution-bs');
        }
    });


}(jQuery, L, this, document));

