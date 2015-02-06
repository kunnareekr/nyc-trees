"use strict";

var $ = require('jquery'),
    L = require('leaflet'),
    toastr = require('toastr'),
    MapModule = require('./map'),
    zoom = require('./mapUtil').zoom,
    SelectableBlockfaceLayer = require('./lib/SelectableBlockfaceLayer'),

    dom = {
        actionBar: '#reserve-blockface-action-bar',
        modalTemplate: '#cancel-reservation-template',
        modalContainer: '#reservation-modal',
        cancelLink: '[data-action="cancel-reservation"]',
    },

    $actionBar = $(dom.actionBar),
    $modalContainer = $(dom.modalContainer);

// Extends the leaflet object
require('leaflet-utfgrid');

var reservationMap = MapModule.create({
    geolocation: true,
    legend: true,
    search: true
});

var tileLayer = L.tileLayer(config.urls.layers.reservations.tiles, {
    maxZoom: zoom.MAX
}).addTo(reservationMap);

var grid = L.utfGrid(config.urls.layers.reservations.grids, {
        maxZoom: zoom.MAX,
        useJsonP: false
    }),

    selectedLayer = new SelectableBlockfaceLayer(reservationMap, grid, {
        onAdd: function(gridData) {
            selectedLayer.clearLayers();

            // Note: this must be kept in sync with
            // src/nyc_trees/apps/survey/urls/blockface.py
            $actionBar.load('/blockface/' + gridData.id + '/reservation-popup/', function() {
                var modalContent = $actionBar.find(dom.modalTemplate).html();
                $modalContainer.html(modalContent);
            });
            return true;
        }
    });

reservationMap.addLayer(grid);
reservationMap.addLayer(selectedLayer);

$modalContainer.on('click', dom.cancelLink, function(e) {
    var $button = $(e.currentTarget);
    e.preventDefault();

    $button.prop('disabled', true);

    $.getJSON($button.attr('data-url'), function(layers) {
        tileLayer.setUrl(layers.reservations.tiles);

        // utfGrid does not expose a setUrl method
        grid._url = layers.reservations.grids;
        grid._cache = {};
        grid._update();

        $actionBar.empty();
        selectedLayer.clearLayers();

        $modalContainer.modal('hide');
    }).fail(function() {
        toastr.error('Could not cancel your reservation, please try again later');
    }).always(function() {
        $button.prop('disabled', false);
    });
});
