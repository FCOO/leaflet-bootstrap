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



    /**********************************************************
    L._adjustButtonList(list, owner)
    Adjust buttons in list ($-elemnt or options) to have
    map and 'owner' (bsLegend or popup or contextmenu) added to the arguments
    bsLegend and popup:
    onClick  = function( id, null,     $button, map, owner )
    onChange = function( id, selected, $button, map, owner )

    contextmenu:
    onClick  = function( id, latLng,   $button, map, owner )
    onChange = function( id, selected, $button, map, owner )

    *** NOTE ***
    This DO NOT work for radio-groups. ONLY single types of buttons and checkbox-buttons
    See L.Popup.prototype._updateContent in leaflet-bootstrap.js for the selection of
    buttons to adjust in popups

    **********************************************************/
    function any_button_on_click(id, selected, $button){
        var options = $button ? $button.data('bsButton_options') || {} : {};

        if (options.event)
            $.proxy( options.event, options.true_context )( id, options.latlng || selected, $button, options.map, options.owner );

        if (options.postClick)
            options.postClick.bind(options.postClickContext)( id, selected, $button, options.map, options.owner );

        return options.returnFromClick || false;
    }

    L._adjustButtonList = function(list, owner){
        var newList = [];
        $.each(list, function(index, options){
            newList.push( L._adjustButton(options, owner) );
        });
        return newList;
    };
    L._adjustButton = function(options, owner){
        if (options instanceof $){
            /*
            This is NOT working since some events are linked to the original button by $.proxy(METHOD, button)
            witch is not cloned with $.fn.clone()
            The fix is to remove this events and replace them with new ones wher context = the new cloned button
            */

            return options;

            /*
            $button = options.clone(true);

            //If $button is a checkbox-button => overwrite onChange
            var buttonOptions = $button.data('cbx_options');
            if (buttonOptions){
                lbOptions.event = buttonOptions.onChange;
                buttonOptions.onChange = any_button_on_click;
                $button.data('cbx_options', buttonOptions);
            }
            else {
                //$button is a normal button => overwrite onClick
                buttonOptions = $button.data('bsButton_options');
                lbOptions.event = buttonOptions.onClick;
                buttonOptions.onClick = any_button_on_click;
                $button.data('bsButton_options', buttonOptions);
            }
            lbOptions.context = buttonOptions.context;
        */
        }
        else {
            if (!options.checkedBy_adjustButton){
                //Create the buttons and modify the click-event to call options.onClick(id, null, $button, map); map is added
                options = $.extend(true, {}, options);
                var type = options.type = options.type || 'button',
                    isCheckboxButton = type != 'button';

                options.small = (typeof options.small == 'boolean') ? options.small : true;
                options.event = options.onChange || options.onClick;
                options[isCheckboxButton ? 'onChange' : 'onClick'] = any_button_on_click;
                options[isCheckboxButton ? 'onClick' : 'onChange'] = null;

                options.true_context = options.context;
                options.context = null;

                options.owner = owner;
                options.map   = owner._map || (owner.parent ? owner.parent._map : null);
                options.checkedBy_adjustButton = true;
            }
        }

        return options;
    };



    /**********************************************************
    Overwrite ScrollWheelZoom.prototype._onWheelScroll to
    prevent map zooming when mouse wheel on elements with scroll
    **********************************************************/
    L.Map.ScrollWheelZoom.prototype._onWheelScroll = function(_onWheelScroll){
        return function(event){
            var elem = event ? event.srcElement : null,
                zoomMap = true,
                className;

            while (elem && zoomMap){
                className = elem.className;
                if ( (typeof className == 'string') && className.split(' ').includes('leaflet-control') )
                    zoomMap = false;
                else
                    elem = elem.offsetParent;
            }
            return zoomMap ? _onWheelScroll.apply(this, arguments) : false;
        };
    }(L.Map.ScrollWheelZoom.prototype._onWheelScroll);


}(jQuery, L, this, document));


