var map;
var markers = [];

function initMap() {
  var customMapType = new google.maps.StyledMapType([
      {
        stylers: [
          {hue: '#a0cac0'},
          {visibility: 'simplified'},
          {gamma: 0.5},
          {weight: 0.5}
        ]
      },
      {
        elementType: 'labels',
        stylers: [{visibility: 'off'}]
      },
      {
        featureType: 'water',
        stylers: [{color: '#a0cac0'}]
      }
    ], {
      name: 'Styled'
  });
  var customMapTypeId = 'custom_style';

  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 11,
    center: {lat: 45.507, lng: -73.579},
    mapTypeControl: true,
    mapTypeControlOptions: {
      mapTypeIds: [google.maps.MapTypeId.ROADMAP],
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.RIGHT_TOP

    }
  });

  // map.mapTypes.set(customMapTypeId, customMapType);
  // map.setMapTypeId(customMapTypeId);
}

function addMarker(username, lat, lng) {
  var l = new google.maps.LatLng(lat, lng);
  var marker = new google.maps.Marker(
    {position: l,
    map: map,
    // draggable: false,
    animation: google.maps.Animation.DROP,
    title: 'justin'
    });

    markers[username] = marker;
    console.log("Markers " + markers);
}

function clearMarker(username) {
  markers[username].setMap(null);
}

function clearMarkers() {
   for (var key in markers) {
     var marker = markers[key];
    marker.setMap(null);
  }
}

function refreshMap() {
  var center = map.getCenter();
  google.maps.event.trigger(map, 'resize');
  map.setCenter(center);
}

$(function () {
  $('#toggle-map').on('click', function(event) {
    $('#map').toggle();
    refreshMap();
  });
});

function getLocation(callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(callback);
  }
}
