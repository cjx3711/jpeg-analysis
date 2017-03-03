/**
 * Reads the actual image data (I think)
 * @method readSOS
 * @param  [int]       start Start byte in the file
 */
function readSOS(start) {
  var length = 0;
  var cursor = 0;
  var scanData = {
    components: []
  }
  function headerLoadCallback(data, hexArray) {
    var identifier = hexArray[cursor] + hexArray[cursor+1];
    cursor += 2;
    if ( identifier != 'FFDA' ) {
      console.log("Can't read SOS");
      return;
    }
    var lengthHex = hexArray[cursor] + hexArray[cursor+1];
    cursor += 2;
    length = parseInt(lengthHex, 16) - 2; // 2 is the size of the length variable itself

    var components = parseInt(hexArray[cursor], 16);
    cursor += 1;
    for (var i = 0; i < components; i++) {
      var componentID = parseInt(hexArray[cursor],16);
      cursor ++;
      var ACTable = parseInt(hexArray[cursor].charAt(0),16);
      var DCTable = parseInt(hexArray[cursor].charAt(1),16);
      cursor ++;
      scanData.components.push({
        componentType: componentMap[componentID],
        AC: ACTable,
        DC: DCTable
      });
    }

    window.settings.scanData = scanData;
    console.log(hexArray);
  }
  readBlob(start, start + 14, headerLoadCallback);

}
