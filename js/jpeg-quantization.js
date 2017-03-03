
/**
 * Maps a 64 length array into a 2D
 * array with a zig zag pattern
 * @method zigzagArray
 * @param  {array}    array Number array of size 64
 * @return {array[array]}    zig zag array
 */
function zigzagArray(array) {
  var arrayMap = [[0, 0],[1, 0],[0, 1],[0, 2],[1, 1],[2, 0],[3, 0],[2, 1],[1, 2],[0, 3],[0, 4],[1, 3],[2, 2],[3, 1],[4, 0],[5, 0],[4, 1],[3, 2],[2, 3],[1, 4],[0, 5],[0, 6],[1, 5],[2, 4],[3, 3],[4, 2],[5, 1],[6, 0],[7, 0],[6, 1],[5, 2],[4, 3],[3, 4],[2, 5],[1, 6],[0, 7],[1, 7],[2, 6],[3, 5],[4, 4],[5, 3],[6, 2],[7, 1],[7, 2],[6, 3],[5, 4],[4, 5],[3, 6],[2, 7],[3, 7],[4, 6],[5, 5],[6, 4],[7, 3],[7, 4],[6, 5],[5, 6],[4, 7],[5, 7],[6, 6],[7, 5],[7, 6],[6, 7],[7, 7]];
  if ( array.length != 64 ) {
    console.log("Array needs to be 64 long to zig zag");
    return;
  }
  var array2d = [[0,0,0,0,0,0,0,0],
                 [0,0,0,0,0,0,0,0],
                 [0,0,0,0,0,0,0,0],
                 [0,0,0,0,0,0,0,0],
                 [0,0,0,0,0,0,0,0],
                 [0,0,0,0,0,0,0,0],
                 [0,0,0,0,0,0,0,0],
                 [0,0,0,0,0,0,0,0]];
  for (var i = 0; i < array.length; i++) {
    array2d[arrayMap[i][1]][arrayMap[i][0]] = array[i];
  }

  return array2d;
}

/**
 * Prints any given 2D array
 * @method print2DArray
 * @param  {array[array]}     array2d Array to print
 */
function print2DArray( array2d ) {
  for (var y = 0; y < array2d.length; y++) {
    console.log(array2d[y].join(" "));
  }
}

/**
 * Reads the quantization tables at the given start byte
 * and puts it in the global settings variable
 * @method readQuantTable
 * @param  {int}       start Start byte in the file
 */
function readQuantTable(start) {
  var length = 0;
  var QTData = {
    length: 0,
    tables: []
  }
  function loadCallback(data, hexArray) {
    var cursor = 0;
    while ( cursor < QTData.length ) {
      var tableData = {
        precision: 0,
        number: 0,
        data: [],
        data2d: []
      }
      var QTPrecisionHex = hexArray[cursor].charAt(0);
      var QTNumberHex = hexArray[cursor].charAt(1);
      var QTPrecision = QTPrecisionHex == '0' ? 0 : 1;
      var QTNumber = parseInt(QTNumberHex, 16);
      cursor += 1;
      tableData.precision = QTPrecision;
      tableData.number = QTNumber;
      var QTBytes = 64 * (QTPrecision + 1);
      for (var i = 0; i < 64; i++) {
        var valueHex = hexArray[cursor];
        if ( QTPrecision == 1 ) {
          valueHex += hexArray[cursor+1];
        }
        var value = parseInt(valueHex, 16);
        tableData.data.push(value);
        cursor += QTPrecision + 1;
      }

      tableData.data2d = zigzagArray(tableData.data);

      QTData.tables.push(tableData);
    }

    window.settings.fileData.QT = QTData;
  }
  function headerLoadCallback(data, hexArray) {
    var identifier = hexArray[0] + hexArray[1];
    if ( identifier != 'FFDB' ) {
      console.log("Can't read DQT");
      return;
    }
    var lengthHex = hexArray[2] + hexArray[3];
    length = parseInt(lengthHex, 16) - 2; // 2 is the size of the length variable itself
    QTData.length = length;
    var byteAfterLength = start + 4;
    var bytesWithoutLength = byteAfterLength + length;
    readBlob(byteAfterLength, bytesWithoutLength, loadCallback);
  }
  readBlob(start, start + 4, headerLoadCallback);
}
