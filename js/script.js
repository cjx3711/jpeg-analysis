// Reference:
// http://vip.sugovica.hu/Sardi/kepnezo/JPEG%20File%20Layout%20and%20Format.htm
// https://www.youtube.com/watch?v=Q2aEzeMDHMA
// http://imrannazar.com/Let's-Build-a-JPEG-Decoder%3A-Huffman-Tables
// http://www.impulseadventure.com/photo/jpeg-huffman-coding.html

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
    },
    SOF0: {
      length: 0,
      precision: 0,
      height: 0,
      width: 0,
      component: []
    },
    QT: {
      length:0,
      tables: []
    },
    DHT: {}
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

function displayQuantTable() {
  window.settings.fileData.QT.tables.forEach( function(qtable) {
    var $qtable = $('<div class="qtable-container"></div>');
    var $qtabledata = $('<div class="qtable-data"></div>');
    $qtabledata.html("Table number: " + qtable.number + " precision: " + qtable.precision);
    $qtable.append($qtabledata);
    qtable.data2d.forEach( function(qtablerow) {
      var $qtablerow = $('<div class="qtable-row"></div>');
      qtablerow.forEach(function(qtablevalue) {
        var $qtableval = $('<input class="qtable-value"/>');
        $qtableval.val(qtablevalue);
        $qtablerow.append($qtableval);
      });
      $qtable.append($qtablerow);
    });
    $("#quant-tables").append($qtable);
  });

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

  function readHeaders() {
    var imageCount = window.settings.fileData.markers.SOF0.length;
    var SOF0Index = window.settings.fileData.markers.SOF0[imageCount - 1];
    readSOF0(SOF0Index);

    var quantIndex = window.settings.fileData.markers.DQT[imageCount - 1];
    readQuantTable(quantIndex);

    var huffIndex = window.settings.fileData.markers.DHT[imageCount - 1];
    readHuffTable(huffIndex);

    console.log("Done");
  }
  $("#process").click( function(evt) {
    searchForMarkers(readHeaders);
  });

  $("#display").click( function(evt) {
    displayQuantTable();
  });
});
