/****************************************************************************
9_leaflet-bootstrap-control-attribution.js

Create standard attribution control, but with position='bottomleft' and hide by css visibility

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    L.Map.mergeOptions({
        bsAttributionControl: false,
        bsAttributionOptions: {
            position: 'bottomleft',
            prefix  : false
        }

    });

    L.Map.addInitHook(function () {
        if (this.options.bsAttributionControl) {
            this.bsAttributionControl = L.control.attribution( this.options.bsAttributionOptions );
            this.bsAttributionControl.addTo(this);
            $(this.bsAttributionControl._container).addClass('leaflet-control-attribution-bs');

            //Mark that the control-position has a bsAttribution-control
            $(this.bsAttributionControl._container).parent().addClass('has-control-attribution-bs');

            //Mark that the map has a bsAttribution-control
            $(this._container).addClass('has-control-attribution-bs');
        }
    });


}(jQuery, L, this, document));

