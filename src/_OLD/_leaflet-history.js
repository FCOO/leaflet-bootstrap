/****************************************************************************
leaflet-history.js

This is an adjusted version of leaflet-history
@ https://github.com/cscott530/leaflet-history
by Chris Scott https://github.com/cscott530

Adjusted always use externat buttons for navigation

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    L.HistoryControl = L.Control.extend({
        options: {
        },

        initialize: function(options) {
            L.Util.setOptions(this, options);
        },

        onAdd: function(map) {
            this._map = map;
            map.on('load', this._map_on_load, this);

//this.options.$firstButton.on('click', $.proxy(this.goFirst, this) );
            this.options.$backButton.on('click', $.proxy(this.goBack,  this) );
            this.options.$forwardButton.on('click', $.proxy(this.goForward, this) );
//this.options.$lastButton.on('click', $.proxy(this.goLast, this) );

            return L.DomUtil.create('div');;
        },

        onRemove: function(map) {
            map.off('load',      this._map_on_load, this);
            map.off('movestart', this._map_on_movestart, this);
        },

        moveWithoutTriggeringEvent: function(zoomCenter) {
            this._state.ignoringEvents = true;
            this._map.setView(zoomCenter.centerPoint, zoomCenter.zoom);
        },

        goFirst: function() {
console.log('goFirst');
        },

        goBack: function(event) {
            this._popStackAndUseLocation(this._state.history, this._state.future);
        },

        goForward: function() {
            this._popStackAndUseLocation(this._state.future, this._state.history);
        },

        goLast: function() {
console.log('goLast');
        },

        clearHistory: function() {
            this._state.history.items = [];
            this._updateDisabled();
        },

        clearFuture: function() {
            this._state.future.items = [];
            this._updateDisabled();
        },

        _state: {
            ignoringEvents : false,
            history: {
                items: []
            },
            future: {
                items: []
            }
        },

        _map_on_load: function() {
            this._updateDisabled();
            this._map.on('movestart', this._map_on_movestart, this);
        },

        _map_on_movestart: function() {
            if (!this._state.ignoringEvents) {
                this._state.future.items = [];
                this._push(this._state.history, this._getZoomCenter());
            }
            else
                this._state.ignoringEvents = false;
            this._updateDisabled();
        },

        _updateDisabled: function () {

console.log('upadteDisablede', this._state.history.items.length, this._state.future.items.length  );

            this.options.$backButton.toggleClass(   'disabled', this._state.history.items.length === 0);
            this.options.$forwardButton.toggleClass('disabled', this._state.future.items.length  === 0);
        },

        _pop: function(stack) {
            stack = stack.items;
            if(L.Util.isArray(stack) && stack.length > 0) {
                return stack.splice(stack.length - 1, 1)[0];
            }
            return undefined;
        },

        _push: function(stack, value) {
            stack = stack.items;
            if(L.Util.isArray(stack)) {
                stack.push(value);
                if(stack.length > 100) {
                    stack.splice(0, 1);
                }
            }
        },

        _popStackAndUseLocation : function(stackToPop, stackToPushCurrent) {
            //check if we can pop
            if(L.Util.isArray(stackToPop.items) && stackToPop.items.length > 0) {
                var current = this._getZoomCenter();
                //get most recent
                var previous =  this._pop(stackToPop);
                //save where we currently are in the 'other' stack
                this._push(stackToPushCurrent, current);
                this.moveWithoutTriggeringEvent(previous);

                return {
                    previousLocation: previous,
                    currentLocation: current
                };
            }
        },

        _getZoomCenter: function() {
            return {
                zoom       : this._map.getZoom(),
                centerPoint: this._map.getCenter()
            }
        }
    });



}(jQuery, L, this, document));
