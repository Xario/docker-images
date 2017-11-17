var async = require('async');
var fs = require('fs');
var cp = require('child_process');
var swig = require('swig');
var http = require('http');
var path = require('path');
var url = require('url');
var https = require('https');
var express = require('express');
var zlib = require('zlib');
var qs = require('querystring');
var cheerio = require('cheerio');
var mkdirp = require('mkdirp');
var mime = require('mime');
var decomment = require('decomment');

var DEBUG = false;
var spawn = cp.spawn;

swig.setDefaults({autoescape: false});
var contentTpl = swig.compileFile('./template/epub/OEBPS/content.opf');
var tocTpl = swig.compileFile('./template/epub/OEBPS/toc.ncx');

var log = function () {
    if (!DEBUG) {
        return;
    }

    console.log.apply(console, arguments);
};

var getFormBuildId = function (info, callback) {
    var data = qs.stringify({
        'js': true
    });

    var options = {
        host: 'ereolen.dk',
        path: '/login/ajax',
        method: 'POST',
        headers: {
            'Host': 'ereolen.dk',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:36.0) Gecko/20100101 Firefox/36.0',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-us,en;q=0.5',
            'Accept-Encoding': 'gzip,deflate',
            'Connection': 'keep-alive',
            'Referer': 'https://ereolen.dk',
            'Content-Length': data.length
        }
    };

    var req = https.request(options, function (res) {
        req.destroy();
        var headers = res['headers'];
        decompress(res, function (err, json) {
            var data = JSON.parse(json);
            var html = data[1].data;
            var $ = cheerio.load(html);

            var $formBuildId = $('input[name=form_build_id]');
            info['formBuildId'] = $formBuildId.val();
            callback(null, info);
        });
    });

    req.write(data);
    req.end();
};

var getSessionCookie = function (info, callback) {
    console.log('Info: %j', info);
    var data = qs.stringify({
        'name': info['user'],
        'pass': info['pass'],
        'form_build_id': info['formBuildId'],
        'form_id': 'user_login',
        'retailer_id': info['retailer']
    });

    var options = {
        host: 'ereolen.dk',
        path: '/system/ajax',
        method: 'POST',
        headers: {
            'Host': 'ereolen.dk',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:36.0) Gecko/20100101 Firefox/36.0',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-us,en;q=0.5',
            'Accept-Encoding': 'gzip,deflate',
            'Connection': 'keep-alive',
            'Referer': 'https://ereolen.dk/user',
            'Content-Length': data.length
        }
    };

    var req = https.request(options, function (res) {
        req.destroy();
        var headers = res['headers'];
        var cookies = headers['set-cookie'];
        log('Cookies: %j', cookies);
        if (!cookies) {
            callback('No cookies found', null);
            return;
        }

        var cookie = cookies.join('; ');
        info['sessionCookie'] = cookie;
        callback(null, info);
    });

    req.write(data);
    req.end();
};

var logout = function (info, callback) {
    var req = https.get({
        host: 'ereolen.dk',
        path: info['logOut'],
        headers: {
            'Host': 'ereolen.dk',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:36.0) Gecko/20100101 Firefox/36.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Referer': 'https://ereolen.dk/min_side',
            'Cookie': info['sessionCookie'],
            'Connection': 'keep-alive'
        }
    });

    req.on('response', function () {
        callback(null, info);
    });
};

var decompress = function (res, callback) {
    var method = null;
    switch (res.headers['content-encoding']) {
        case 'gzip':
            method = zlib.createGunzip();
            break;

        case 'deflate':
            method = zlib.createInflate();
            break;
    }

    if (method) {
        res.pipe(method);
    } else {
        res.setEncoding('binary');
        method = res;
    }

    var data = '';
    method.on('data', function (chunk) {
        data += chunk;
    });

    method.on('end', function () {
        callback(null, data);
    });
};

var getBookInfo = function (info, callback) {
    var req = https.get({
        host: 'ereolen.dk',
        path: '/user',
        headers: {
            'Host': 'ereolen.dk',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:36.0) Gecko/20100101 Firefox/36.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Referer': 'https://ereolen.dk/user',
            'Cookie': info['sessionCookie'],
            'Connection': 'keep-alive'
        }
    });

    req.on('response', function (res) {
        decompress(res, function (err, data) {
            req.destroy();
            if (err) {
                callback(err, null);
                return;
            }

            var $ = cheerio.load(data);
            var $loans = $('div.material-item');
            var books = [];
            $loans.each(function () {
                var book = {};
                var $this = $(this);
                var $pic = $this.find('div.ting-cover img');
                if ($pic.length) {
                    book['pic'] = {
                        src: $pic.attr('src')
                    };
                }

                var $title = $this.find('h3.item-title a');
                var title = $title.text();
                book['title'] = title.replace(/ : (.+)$/, '');

                var $author = $this.find('div.author a');
                book['author'] = $author.text();

                var $period = $this.find('li.expires-in div.item-information-data');
                book['period'] = $period.text();

                var $readLink = $this.find('div.material-buttons a').last();
                var streamLink = $readLink.attr('href');
                var matches = streamLink.match(/^\/ting\/object\/(.+)\/read$/);
                if (!matches) {
                    return;
                }

                var readId = matches[1];
                matches = readId.match(/\d+$/);
                if (!matches) {
                    return;
                }

                var streamId = matches[0];

                book['readId'] = readId;
                book['streamId'] = streamId;

                books.push(book);
            });

            var $logOutLink = $('ul.sub-menu li a.menu-item').last();
            info['logOut'] = $logOutLink.attr('href');
            info['books'] = books;
            log('getBookInfo: %j', info);
            callback(null, info);
        });
    });
};

var getImages = function (info, callback) {
    var getImage = function (book, callback) {
        var pic = book['pic'];
        if (!pic) {
            book['pic'] = {
                localSrc: '/pics/books/none.jpg'
            };

            callback(null, book);
            return;
        }

        var streamId = book['streamId'];
        var src = pic['src'];
        var matches = src.match(/^https:\/\/ereolen\.dk(.*\/(.*))$/);
        var path = matches[1];

        var localPath = './htdocs/pics/books/' + streamId;

        fs.exists(localPath, function (exists) {
            if (exists) {
                pic['localSrc'] = '/pics/books/' + streamId;
                callback(null, book);
            } else {
                var req = https.get({
                    host: 'ereolen.dk',
                    path: path,
                    headers: {
                        'Host': 'ereolen.dk',
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:36.0) Gecko/20100101 Firefox/36.0',
                        'Accept': 'image/png,image/*;q=0.8,*/*;q=0.5',
                        'Accept-Language': 'en-us,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate',
                        'DNT': '1',
                        'Referer': 'https://ereolen.dk/min_side',
                        'Cookie': info['sessionCookie'],
                        'Connection': 'keep-alive'
                    }
                });

                req.on('response', function (res) {
                    var imageData = '';
                    res.setEncoding('binary');
                    res.on('data', function (chunk) {
                        imageData += chunk
                    });

                    res.on('end', function () {
                        fs.writeFile(localPath, imageData, 'binary', function (err) {
                            pic['localSrc'] = '/pics/books/' + streamId;
                            callback(null, book);
                        });
                    });
                });
            }
        });
    };

    async.each(
        info['books'],
        getImage,
        function () {
            callback(null, info);
        }
    );
};

var getOrderId = function (info, callback) {
    var req = https.get({
        host: 'ereolen.dk',
        path: '/ting/object/' + info['readId'] + '/read',
        headers: {
            'Host': 'ereolen.dk',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:36.0) Gecko/20100101 Firefox/36.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Referer': 'https://ereolen.dk/min_side',
            'Cookie': info['sessionCookie'],
            'Connection': 'keep-alive'
        }
    });

    req.on('response', function (res) {
        decompress(res, function (err, data) {
            req.destroy();
            if (err) {
                callback(err, null);
                return;
            }
            var matches = data.match(/data-id="(.*)"/);
            if (!matches) {
                callback('No order id found', null);
                return;
            }

            info['orderId'] = matches[1];
            callback(null, info);
        });
    });
};

var getSessionId = function (info, callback) {
    var req = https.get({
        host: 'ereolen.dk',
        path: '/reol_use_loan/reader/session/renew/' + info['orderId'],
        headers: {
            'Host': 'ereolen.dk',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:36.0) Gecko/20100101 Firefox/36.0',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-us,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://ereolen.dk/ting/object/' + info['readId'] + '/read',
            'Cookie': info['sessionCookie'],
            'Connection': 'keep-alive'
        }
    });

    req.on('response', function (res) {
        decompress(res, function (err, data) {
            req.destroy();
            if (err) {
                callback(err, null);
                return;
            }

            var json = JSON.parse(data);
            info['sessionId'] = json['SessionId'];
            callback(null, info);
        });
    });
};

var getTimestamp = function () {
    var date = new Date();
    var timestamp = date.getTime();
    delete date;
    return timestamp;
};

var getJQueryId = function (info, callback) {
    var rand = Math.floor(Math.random() * 9999999999999999) + 1
    var timestamp = getTimestamp();
    info['jQueryId'] = 'jQuery1720' + rand + '_' + timestamp;
    callback(null, info);
};

var getASPSessionCookie = function (info, callback) {
    var req = https.get({
        host: 'streaming.pubhub.dk',
        path: '/publicstreaming_v2/v2/' + info['sessionId'] + '/' + info['orderId'] + '/wordcount/?callback=' + info['jQueryId'] + '&_=' + getTimestamp(),
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:36.0) Gecko/20100101 Firefox/36.0',
            'Host': 'streaming.pubhub.dk',
            'Accept': '*/*',
            'Accept-Language': 'en-us,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Referer': 'https://ereolen.dk/ting/object/' + info['readId'] + '/read',
            'Connection': 'keep-alive'
        }
    });

    req.on('response', function (res) {
        req.destroy();
        var headers = res['headers'];
        var cookies = headers['set-cookie'];
        if (!cookies) {
            callback('No cookies found', null);
            return;
        }

        var cookie = cookies[0];
        var matches = cookie.match(/^(.*); path/);
        info['aspSessionCookie'] = matches[1];
        callback(null, info);
    });
};

var getContent = function (info, callback) {
    log('Getting content');
    var jQueryId = info['jQueryId'];
    var jqPattern = new RegExp(jQueryId + '\\((.*)\\);');
    var filterRes = function (data) {
        var matches = jqPattern.exec(data);
        return matches[1];
    };

    var getFile = function (fileUrl, callback) {
        var parts = url.parse(fileUrl, true);
        var path = parts['pathname'];
        var req = https.get({
            host: 'streaming.pubhub.dk',
            path: path,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:36.0) Gecko/20100101 Firefox/36.0',
                'Host': 'streaming.pubhub.dk',
                'Accept': '*/*',
                'Accept-Language': 'en-us,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Referer': 'https://ereolen.dk/ting/object/' + info['readId'] + '/read',
                'Cookie': info['aspSessionCookie'],
                'Connection': 'keep-alive'
            }
        });

        req.on('response', function (res) {
            decompress(res, callback);
        });
    };

    var makeDir = function (path, callback) {
        fs.exists(path, function (exists) {
            if (exists) {
                callback(null, true);
                return;
            }

            log('Creating dir: %s', path);
            mkdirp(path, callback);
        });
    };

    var getChunk = function (id, callback) {
        var timestamp = getTimestamp();
        timestamp += id * 1234;
        var req = https.get({
            host: 'streaming.pubhub.dk',
            path: '/publicstreaming_v2/v2/' + info['sessionId'] + '/' + info['orderId'] + '/' + id + '/?callback=' + info['jQueryId'] + '&_=' + timestamp,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:36.0) Gecko/20100101 Firefox/36.0',
                'Host': 'streaming.pubhub.dk',
                'Accept': '*/*',
                'Accept-Language': 'en-us,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Referer': 'https://ereolen.dk/ting/object/' + info['readId'] + '/read',
                'Cookie': info['aspSessionCookie'],
                'Connection': 'keep-alive'
            }
        });

        req.on('response', function (res) {
            decompress(res, function (err, data) {
                if (err) {
                    callback(err, null);
                    return;
                }

                var filtered = filterRes(data);
                var json = JSON.parse(filtered);
                callback(null, json);
            });
        });
    };

    var getFirst = function (callback) {
        getChunk(1, callback);
    };

    var getRest = function (firstInfo, callback) {
        var getChunkProxy = function (i, callback) {
            var id = i + 1;
            if (id === 1) {
                callback(null, firstInfo);
                return;
            }

            getChunk(id, callback);
        };

        var count = firstInfo['TotalIndexCount'];
        async.times(count, getChunkProxy, callback);
    };

    var prepareEPub = function (chunks, callback) {
        log('Preparing ePub');
        var dirPath = '/tmp/' + info['streamId'] + '/';
        var oebpsPath = dirPath + 'OEBPS/';
        var getFileName = function (fileUrl) {
            var name = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
            name = name.toLowerCase();
            return name.replace(/[^a-zA-Z0-9\.]/, '');
        };

        var makeOEBPSDir = function (callback) {
            makeDir(oebpsPath, callback);
        };

        var addedExternalFiles = {};
        var externalFiles = [];
        var chapters = [];
        var stripLinks = function (source) {
            return source.replace(/<\/?a[^>]*>/g, '');
        };

        var saveChunk = function (chunk, callback) {
            var source = chunk['Source'];
            //source = '<meta charset="UTF-8" \/>\n'  + source;

            var prepareSource = function (callback) {
                source = stripLinks(source);
                source = decomment.text(source);
                var matches = source.match(/[\"|\'](https?\:[^\"|\']+)["|\']/g);
                for (var i in matches) {
                    var match = matches[i];
                    var external = match.replace(/[\"|\'](.+)[\"|\']/, '$1');
                    if (!external.match(/^https:\/\/streaming\.pubhub\.dk/)) {
                        continue;
                    }

                    var type = mime.lookup(external);
                    if (!type.match(/[font|image|css]/)) {
                        continue;
                    }

                    var fileName = getFileName(external);
                    source = source.replace(external, fileName);

                    if (addedExternalFiles[fileName]) {
                        continue;
                    }

                    externalFiles.push(external);
                    addedExternalFiles[fileName] = 1;
                }

                source = source.replace(/ ?i=[\"|\']\d+[\"|\']/g, '');
                callback(null, source);
            };

            var writeXHtml = function (source, callback) {
                var index = chunk['Index'];
                var chapterName = index + '.xhtml';
                chapters[index] = chapterName;
                var chunkFile = oebpsPath + chapterName;
                fs.writeFile(chunkFile, source, callback);
            };

            async.waterfall(
                [
                    prepareSource,
                    writeXHtml
                ],
                callback
            );
        };

        var doSave = function (callback) {
            async.each(chunks, saveChunk, callback);
        };

        var copy = function (from, to, callback) {
            var cbCalled = false;
            var done = function (err) {
                if (cbCalled) {
                    return;
                }

                cbCalled = true;
                if (err) {
                    log('Error copying %s to %s: %s', from, to, err);
                }

                callback(!err);
            };

            var rd = fs.createReadStream(from);
            rd.on('error', function (err) {
                done(err);
            });

            var wr = fs.createWriteStream(to);
            wr.on('error', function (err) {
                done(err);
            });

            wr.on('close', function () {
                done();
            });

            rd.pipe(wr);
        };

        var getFont = function (fontUrl, callback) {
            var fontName = getFileName(fontUrl);
            log('%s: Trying to get font', fontName);
            var newPath = oebpsPath + fontName;
            var tmpPath = '/fonts/' + fontName;
            var getLocalFile = function (callback) {
                log('%s: Checking if the font exists in the local cache', fontName);
                fs.exists(tmpPath, function (exists) {
                    if (!exists) {
                        log('%s: The font does not exist in the local cache, will try other options', fontName);
                        callback(false);
                        return;
                    }

                    log('%s: The file exist in the local cache', fontName);
                    callback(exists);
                });
            };

            var writeLocalFile = function (content, callback) {
                log('%s: Trying to write font to local cache', fontName);
                var makeCacheDir = function (callback) {
                    makeDir('/fonts', callback);
                };

                var doWrite = function (dummy, callback) {
                    log('%s: Writing local font cache file', fontName);
                    fs.writeFile(tmpPath, content, 'binary', function (err) {
                        if (err) {
                            log('%s: Error writing file to local cache: %s', fontName, err);

                            callback(false);
                            return;
                        }

                        log('%s: The font has been writen to the local cache', fontName);

                        callback(true);
                    });
                };

                async.waterfall(
                    [
                        makeCacheDir,
                        doWrite
                    ],
                    callback
                );
            };

            var getExternalFile = function (callback) {
                log('%s: Trying to get font from external resource', fontName);
                getFile(fontUrl, function (err, content) {
                    if (err) {
                        log('%s: Error getting ext font: %s', fontName, err)
                        callback(false);
                        return;
                    }

                    writeLocalFile(content, callback);
                });
            };

            var doCall = function (func, callback) {
                func(callback);
            };

            var copyFile = function (success) {
                if (!success) {
                    callback(false);
                    return;
                }

                log('%s: Trying to copy the font to the OEBPS folder', fontName);
                copy(tmpPath, newPath, function (success) {
                    if (success) {
                        log('%s: The font has been copied to the OEBPS folder', fontName);
                    }

                    callback(null, success);
                });
            };

            async.detectSeries(
                [
                    getLocalFile,
                    getExternalFile
                ],
                doCall,
                copyFile
            );
        };

        var fetchExternal = function (external, callback) {
            var fileName = getFileName(external);
            log('External: %s', fileName);
            var newPath = oebpsPath + fileName;
            var extension = fileName.substr(-3);
            var fontExtensions = ['ttf', 'otf', 'fon', 'ttc'];
            if (fontExtensions.indexOf(extension) > -1) {
                getFont(external, callback);
                return;
            }

            var getExternal = function (callback) {
                log('Getting %s', fileName);
                getFile(external, callback);
            };

            var saveLocal = function (content, callback) {
                log('Saving %s', fileName);
                fs.writeFile(newPath, content, 'binary', callback);
            };

            async.waterfall(
                [
                    getExternal,
                    saveLocal
                ],
                function (err) {
                    if (err) {
                        log('Error fetching %s: %s', external, err);
                        callback(err);
                        return;
                    }

                    log('Done fetching %s', fileName);
                    callback(null, true);
                }
            );
        };

        var fetchExternals = function (callback) {
            log('Fetching externals');
            async.each(externalFiles, fetchExternal, function (err) {
                if (err) {
                    log('Error fetching externals: %s', err);
                }

                callback(null, true);
            });
        };

        var makeMetaInfDir = function (callback) {
            makeDir(dirPath + 'META-INF/', callback);
        };

        var addMetaFiles = function (callback) {

            var writeMimetype = function (callback) {
                log('Writing mimetype');
                var from = './template/epub/mimetype';
                var to = dirPath + 'mimetype';
                copy(from, to, callback);
            };

            var writeContainer = function (callback) {
                log('Copying container.xml');
                var from = './template/epub/META-INF/container.xml';
                var to = dirPath + 'META-INF/container.xml';
                copy(from, to, callback);
            };

            var writeContent = function (callback) {
                log('Writing content.opf');
                var externals = [];
                for (var i in externalFiles) {
                    var externalUrl = externalFiles[i];
                    var fileName = getFileName(externalUrl);
                    var fileType = mime.lookup(fileName);
                    var external = {
                        name: fileName,
                        type: fileType
                    };

                    externals.push(external);
                }

                var content = contentTpl({
                    title: info['title'],
                    author: info['author'],
                    externals: externals,
                    chunks: chunks
                });

                fs.writeFile(oebpsPath + 'content.opf', content, callback);
            };

            var writeToc = function (callback) {
                log('Writing toc.ncx');
                var content = tocTpl({
                    title: info['title'],
                    chunks: chunks
                });

                fs.writeFile(oebpsPath + 'toc.ncx', content, callback);
            };

            async.parallel(
                [
                    writeMimetype,
                    writeContainer,
                    writeContent,
                    writeToc
                ],
                callback
            );
        };

        async.series(
            [
                makeOEBPSDir,
                doSave,
                fetchExternals,
                makeMetaInfDir,
                addMetaFiles
            ],
            function () {
                callback(null, info);
            }
        );
    };

    async.waterfall(
        [
            getFirst,
            getRest,
            prepareEPub
        ],
        function (err) {
            if (err) {
                callback(err, null);
                return;
            }

            callback(null, info);
        }
    );
};

var makeEPub = function (info, callback) {
    log('Creating epub');
    var streamId = info['streamId'];
    var dirPath = '/tmp/' + streamId + '/';
    var oebpsPath = dirPath + 'OEBPS/';
    var archiver = require('archiver');
    var zip = archiver('zip');

    log('Adding mimetype');
    var mimeTypeStream = fs.createReadStream('/tmp/' + streamId + '/mimetype');
    zip.append(mimeTypeStream, {name: 'mimetype', store: true});

    log('Adding container.xml');
    var containerStream = fs.createReadStream('/tmp/' + streamId + '/META-INF/container.xml');
    zip.append(containerStream, {name: 'META-INF/container.xml'});

    var addToZip = function (file, callback) {
        var filePath = oebpsPath + file;
        file = 'OEBPS/' + file;
        log('Adding ' + file);
        var stream = fs.createReadStream(filePath);
        zip.append(stream, {name: file});
        callback(null, true);
    };

    var makeZip = function (err) {
        log('Making zip archive');

        if (err) {
            log('Error creating zip archive1: %s', err);
            callback(err);
            return;
        }

        zip.on('error', function (err) {
            callback(err);
        });

        var output = fs.createWriteStream('/tmp/' + streamId + '.epub');
        zip.pipe(output);

        zip.finalize(function (err) {
            if (err) {
                log('Error creating zip archive2: %s', err);
                callback(err);
                return;
            }

            log('Done creating zip archive');
            callback(null, info);
        });
    };

    var filePaths = fs.readdirSync(oebpsPath);

    async.eachSeries(
        filePaths,
        addToZip,
        makeZip
    );
};

var loginTpl = swig.compileFile('./template/client/login.html');
var disclaimerTpl = swig.compileFile('./template/client/disclaimer.html');
var booksTpl = swig.compileFile('./template/client/books.html');

var bodyParser = require('body-parser');
var session = require('express-session');

var app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.use(session({
    secret: 'asdf#adfsdF#¤3ghsdf¤',
    name: 'sessionId'
}));

app.use(express.static('./htdocs'));
app.get('/', function (req, res) {
    res.redirect(!!req.session.info ? 'books' : 'login');
});

var getMenuItems = function (req) {
    var menu = [];
    menu.push({
        name: 'Brugsbetingelser',
        link: '/disclaimer'
    });

    if (!!req.session.info) {
        menu.push({
                name: 'Bøger',
                link: '/books'
            }, {
                name: 'Log ud',
                link: '/logout'
            }
        );
    } else {
        menu.push({
            name: 'Log ind',
            link: '/login'
        });
    }

    return menu;
};

app.get('/books', function (req, res) {
    var info = req.session.info;
    if (!info) {
        res.redirect('login');
        return;
    }

    var getInfo = function (callback) {
        callback(null, info);
    };

    async.waterfall(
        [
            getInfo,
            getBookInfo,
            getImages
        ],
        function (err, data) {
            if (err) {
                log('Error: %s', err);
                return;
            }

            res.writeHead(200);
            data['menu'] = getMenuItems(req);
            var html = booksTpl(data);
            res.setHeader('Content-type', 'text/html');
            res.end(html);
        }
    );
});

app.get('/disclaimer', function (req, res) {
    res.writeHead(200);
    var data = {
        menu: getMenuItems(req)
    };

    var html = disclaimerTpl(data);
    res.setHeader('Content-type', 'text/html');
    res.end(html);
});

app.get('/login', function (req, res) {
    res.writeHead(200);
    var data = {};
    if (req.session.loginError) {
        data['errorMessage'] = req.session.loginError;
        delete req.session.loginError;
    }

    data['menu'] = getMenuItems(req);
    var html = loginTpl(data);
    res.setHeader('Content-type', 'text/html');
    res.end(html);
});

app.post('/login', function (req, res) {
    var getInfo = function (callback) {
        callback(null, {
            user: req.body.name,
            pass: req.body.pass,
            retailer: req.body.retailer
        });
    };

    var tasks = [
        getInfo,
        getFormBuildId,
        getSessionCookie
    ];

    var onDone = function (err, info) {
        if (err) {
            req.session.loginError = 'Forkert login, prøv igen';
            res.redirect('login');
            return;
        }

        req.session.regenerate(function () {
            req.session.info = info;
            res.redirect('books');
        });
    };

    async.waterfall(tasks, onDone);
});

app.get('/generate/:id', function (req, res) {
    var info = req.session.info;
    if (!info) {
        res.redirect('login');
        return;
    }

    var id = parseInt(req.params.id) - 1;
    var book = info['books'][id];
    if (!book) {
        res.writeHead(200);
        res.end('No book found');
        return;
    }

    if (book.pdfPath) {
        res.writeHead(200);
        res.end('done');
        return;
    }

    var ePubPath = '/tmp/' + book.streamId + '.epub';

    var onDone = function (err) {
        if (err) {
            log('Error creating ePub: %s', err);
        }

        book['ePubPath'] = ePubPath;
        res.writeHead(200);
        res.end('done');
    };

    fs.exists(ePubPath, function (exists) {
        if (exists) {
            onDone();
            return;
        }

        var getInfo = function (callback) {

            callback(null, {
                sessionId: info['sessionId'],
                streamId: book['streamId'],
                readId: book['readId'],
                author: book['author'],
                title: book['title'],
                sessionCookie: info['sessionCookie']
            });
        };

        async.waterfall(
            [
                getInfo,
                getOrderId,
                getSessionId,
                getJQueryId,
                getASPSessionCookie,
                getContent,
                makeEPub
            ],
            onDone
        );
    });
});

app.get('/download/:id', function (req, res) {
    var info = req.session.info;
    if (!info) {
        res.redirect('login');
        return;
    }

    var id = parseInt(req.params.id) - 1;
    var book = info['books'][id];

    var error = function (text) {
        res.writeHead(200);
        res.end(text);
    };

    if (!book || !book['ePubPath']) {
        error('No book found');
    }

    var fileName = book['title'] + '.epub';
    var file = book['ePubPath'];
    res.setHeader('Content-disposition', 'attachment; filename="' + fileName + '"');
    res.setHeader('Content-type', 'application/epub+zip');

    console.log("File: %s", file);
    fs.exists(file, function (exists) {
        if (!exists) {
            error('Error generating file');
            return
        }

        var fileStream = fs.createReadStream(file);
        fileStream.pipe(res);
    });
});

app.get('/logout', function (req, res) {
    var info = req.session.info;

    if (!info) {
        res.redirect('/');
        return;
    }

    logout(info, function () {
        req.session.destroy(function () {
            res.redirect('/');
        });
    });
});
/*
var lee = require('letsencrypt-express');
var options = {
    server: 'https://acme-v01.api.letsencrypt.org/directory',
    email: 'letsencrypt@xar.io',
    agreeTos: true,
    approveDomains: [ 'xar.io', 'epub.xar.io' ],
    app: app
};

lee
	.create(options)
	.listen(80, 443);
*/
app.listen(80, function () {
    console.log('listening on port 80!')
});
/*
var options = {
	key  : fs.readFileSync( './ssl/ssl.key' ),
	cert : fs.readFileSync( './ssl/ssl.crt' )
};
https.createServer( options, app ).listen( 80, function() {
	console.log( 'Express server listening on port 80' );
} );
/*
var http = require('http');
http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80);
*/
