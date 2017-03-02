// Reference:
// http://vip.sugovica.hu/Sardi/kepnezo/JPEG%20File%20Layout%20and%20Format.htm
// https://www.youtube.com/watch?v=Q2aEzeMDHMA

window.settings = {
  fileAPI: false,
  currentFile: null,
  fileData: {
    markers: {
      SOI: [],
      APP0: [],
      DQT: [],
      SOF0: [],
      DHT: [],
      SOS: [],
      EOI: []
    }
  }
}


function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}


function handleFileSelect(evt) {
  evt.stopPropagation();
  evt.preventDefault();

  var files = evt.dataTransfer.files; // FileList object.

  // Loop through the FileList and render image files as thumbnails.
  for (var i = 0, f; f = files[i]; i++) {

    // Only process image files.
    if (!f.type.match('image.jpeg')) {
      alert("Only jpeg images please.");
      continue;
    }

    var metaReader = new FileReader();

    // Closure to capture the file information.
    metaReader.onload = (function(f) {
      return function(e) {
        // Render thumbnail.
        var html = ['<div class="image-container">',
                      '<img class="thumb" src="', e.target.result,'" title="', escape(f.name), '"/>',
                      '<span>',
                        escape(f.name), ': ',
                        f.size, ' bytes ',
                        'Last modified: ', f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                      '</span>',
                    '</div>'].join('');
        var $imageDiv = $(html);

        $("#list").html("");
        $("#list").append($imageDiv);
        window.settings.currentFile = f;

        readAndDisplayBlob(0, 8);
      };
    })(f);

    // Read in the image file as a data URL.
    metaReader.readAsDataURL(f);
  }
}

function readAndDisplayBlob(start, end) {
  var file = window.settings.currentFile;
  if (file == null) {
    return;
    console.log("No current file la.");
  }
  var start = parseInt(start) || 0;
  var stop = parseInt(end) || file.size - 1;

  readBlob(start, end, function(data, hexArray) {
    document.getElementById('byte_range').textContent =
        ['Read bytes: ', start + 1, ' - ', stop + 1,
         ' of ', file.size, ' byte file'].join('');
    document.getElementById('byte_content').textContent = data;
    document.getElementById('byte_content_hex').textContent = hexArray.join(" ");

  })
}
function readBlob(start, end, callback) {
  var file = window.settings.currentFile;
  if (file == null) {
    return;
    console.log("No current file la.");
  }
  var start = parseInt(start) || 0;
  var stop = parseInt(end) || file.size - 1;

  var binaryReader = new FileReader();

  // If we use onloadend, we need to check the readyState.
  binaryReader.onloadend = function(evt) {
    if (evt.target.readyState == FileReader.DONE) { // DONE == 2
      var hexArray = [];
      var data = evt.target.result;
      for (var i=0; i < data.length; i++) {
        var c = data.charAt(i);
        var dec = c.charCodeAt(0);
        var hex = dec.toString(16);
        if ( hex.length == 1 ) {
          hex = "0" + hex;
        }
        hexArray.push(hex.toUpperCase());
      }
      if ( typeof callback == "function" ) {
        callback(data, hexArray);
      }
    }
  };

  var blob = file.slice(start, stop + 1);
  binaryReader.readAsBinaryString(blob);
}


function searchForMarkers() {
  // Load n bytes at a time
  var file = window.settings.currentFile;
  if (file == null) {
    return;
    console.log("No current file la.");
  }
  var cursor = 0;
  var bytesToLoad = 5 * 1024;
  var maxBytes = 1024 * 1024;

  function loadCallback(data, hexArray) {
    for (var i = 0; i < hexArray.length - 1; i++) {
      var potentialMarker = hexArray[i] + hexArray[i+1];
      switch( potentialMarker ) {
        case "FFD8":
          window.settings.fileData.markers.SOI.push(cursor + i);
          console.log("SOI Marker found at: " + (cursor + i));
        break;
        case "FFE0":
          window.settings.fileData.markers.APP0.push(cursor + i);
          console.log("APP0 Marker found at: " + (cursor + i));
        break;
        case "FFDB":
          window.settings.fileData.markers.DQT.push(cursor + i);
          console.log("DQT Marker found at: " + (cursor + i));
        break;
        case "FFC0":
          window.settings.fileData.markers.SOF0.push(cursor + i);
          console.log("SOF0 Marker found at: " + (cursor + i));
        break;
        case "FFC4":
          window.settings.fileData.markers.DHT.push(cursor + i);
          console.log("DHT Marker found at: " + (cursor + i));
        break;
        case "FFDA":
          window.settings.fileData.markers.SOS.push(cursor + i);
          console.log("SOS Marker found at: " + (cursor + i));
        break;
        case "FFD9":
          window.settings.fileData.markers.EOI.push(cursor + i);
          console.log("EOI Marker found at: " + (cursor + i));
        break;
      }
    }
    // Search through bytes for marker
    cursor += bytesToLoad;
    if ( cursor < file.size && cursor < maxBytes) {
      readBlob(cursor, cursor + bytesToLoad + 1, loadCallback);
    } else {
      console.log("Done");
      console.log(window.settings.fileData.markers);
    }
  }

  readBlob(cursor, cursor + bytesToLoad + 1, loadCallback);
}
$(document).ready( function() {

  // Check for the various File API support.
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    window.settings.fileAPI = true;
    $("div.no-file-api").remove();
    $("div.content-wrapper").removeClass('hide');
  } else {
    window.settings.fileAPI = false;
  }

  // Setup the dnd listeners.
  var dropZone = document.getElementById('drop-zone');
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('drop', handleFileSelect, false);

  $("#process").click( function(evt) {
    searchForMarkers();
  });

});
