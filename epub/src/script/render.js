} else
{

    address = system.args[1];
    output = system.args[2];


    page.open(address, function () {

        page.render(output);
        phantom.exit();

        setTimeout(next_page, 100);
    });
}


var system = require('system');

var page = require('webpage').create();

var fs = require('fs');

var htmlFiles = new Array();

var streamId = system.args[1];

var dir = '/tmp/' + streamId;

var output = '/tmp/' + streamId + '.pdf';

var dirFiles = fs.list('/tmp/' + streamId);

page.viewportSize = {

    width: 1200,
    height: 600
};

page.paperSize = 'A5';

page.zoomFactor = '1.0.5';

for (var i = 0; i < dirFiles.length; i++) {

    var fileName = dirFiles[i];

    var fullPath = dir + fs.separator + fileName;

    if (!fs.isFile(fullPath)) {

        continue;
    }

    if (fullPath.indexOf('.xhtml') === -1) {

        continue;
    }

    var matches = fileName.match(/(\d+)\.xhtml/);

    var nr = parseInt(matches[1]) - 1;

    htmlFiles[nr] = fullPath;
}

page.content = '';

for (var i in htmlFiles) {

    var file = htmlFiles[i];

    var f = fs.open(file, 'r');

    page.content += f.read() + '\n';

    f.close();

    break;
}

page.evaluate();

page.render(output);

phantom.exit(0);
