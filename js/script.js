// Reference:
// http://vip.sugovica.hu/Sardi/kepnezo/JPEG%20File%20Layout%20and%20Format.htm

window.settings = {
  fileAPI: false,
  currentFile: null
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
      var binaryReader = new FileReader();

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
        };
      })(f);

      // Read in the image file as a data URL.
      metaReader.readAsDataURL(f);

      var binaryReader = new FileReader();
    }
  }

  function readBlob(opt_start, opt_end) {
    var file = window.settings.currentFile;
    if (file == null) {
      return;
      Console.log("No current file la.");
    }
    var start = parseInt(opt_start) || 0;
    var stop = parseInt(opt_end) || file.size - 1;
  }

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  // Setup the dnd listeners.
  var dropZone = document.getElementById('drop-zone');
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('drop', handleFileSelect, false);

});
