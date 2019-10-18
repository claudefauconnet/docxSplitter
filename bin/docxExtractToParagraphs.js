/*******************************************************************************
 * DOCX SPLITTER LICENCE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2018 Claude Fauconnet claude.fauconnet@gmail.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to w
 * hom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/
var fs = require('fs');


var path = require('path');
var dom = require('xmldom').DOMParser
var async = require('async');
var exec = require('child_process').exec;

var docxExtractor = require("./docxExtractor..js");
var formatToBot = require("./formatToBot..js");
var formatToHtml = require("./formatToHtml..js");
var formatToColumns = require("./formatToColumns..js");
var formatToElastic = require("./formatToElastic..js");
var config = require("./config..js");
var docExtractToParagraphs = {


    /**
     *
     * ecrit tous les tableaux à l'interieur des paragraphes de tous les document d'un repertoire    en csvcd
     *
     *
     * @param dir
     * @param format
     * @param sortByColsNumber
     *
     *
     */
    allParagraphArray2X: function (dir, format, sortByColsNumber) {

        function getTableColsNumber(tableJson) {
            var ncols = 0;
            tableJson.rows.forEach(function (row, indexRow) {
                ncols = Math.max(row.length, ncols);

            })
            return ncols;
        }

        var xmlPaths = fs.readdirSync(dir)
        var jsonTables = [];
        var allTables = [];
        xmlPaths.forEach(function (xmlPath) {
            if (xmlPath.indexOf(".xml") < 0)
                return;
            if (xmlPath.indexOf("_header.xml") > -1)
                return;
            if (xmlPath.indexOf("_rels.xml") > -1)
                return;
            var filePath = path.resolve(dir + "/" + xmlPath);
            var xmlStr = "" + fs.readFileSync(filePath);
            var doc = new dom().parseFromString(xmlStr);
            var tables = docxExtractor.getTablesinParagraphs(doc)
            allTables.push({doc: xmlPath, tables: tables})
        })


        var strArray = [];

        allTables.forEach(function (docTables) {
            docTables.tables.forEach(function (table, index) {
                var str = ""
                if (format == "html")
                    str += docExtractToParagraphs.jsonTableToHtml(table) + "\n";
                else
                    str += docExtractToParagraphs.jsonTableToCsv(table) + "\n";
                var obj = {content: str, doc: docTables.doc}
                if (sortByColsNumber) {
                    obj.colsNumber = getTableColsNumber(table);
                }
                strArray.push(obj);

            })
        })

        if (sortByColsNumber) {
            strArray = strArray.sort(function (a, b) {
                if (a.colsNumber > b.colsNumber)
                    return 1;
                if (a.colsNumber < b.colsNumber)
                    return -1;
                return 0;
            })

        }
        var str = "";
        if (format == "html") {
            str = "<html>";
            str += "<style>body{font-family:Verdana;font-size:12px} td{background-color :#a9b7d1;}</style>"
        }

        strArray.forEach(function (line, index) {
            //  console.log(line.colsNumber);
            str += "------------------colsNumber : " + line.colsNumber + "-----------------\n"
            str += line.doc + "********************************************************************\n";
            str += line.content + "\n";

            //   console.log(line.colsNumber+ "  "+line.content)

        })


        if (format == "html") {
            str += "</html>"
            str = str.replace(/\n/gm, "<br>\n")
        }
        //  console.log(str)
        //  console.log(JSON.stringify(allParagraphJsonTables, null, 2))
        fs.writeFileSync(dir + "/allTablesOrdered.csv", str)
    },

    jsonTableToCsv: function (tableJson) {
        var str = "";
        tableJson.rows.forEach(function (row, indexRow) {
            if (indexRow > 0)
                str += "\n";
            row.forEach(function (cell, indexCell) {
                if (true || indexCell > 0)
                    str += "\t";
                str += cell.text
            })
        })
        return str;

    },


    /* jsonTableToHtml: function (tableJson) {
         var str = "<table border='1'>";
         tableJson.rows.forEach(function (row, indexRow) {
             str += "<tr>";
             row.forEach(function (cell, indexCell) {
                 if (true || indexCell > 0)
                     str += "<td>";
                 str += cell.text
                 str += "</td>";
             })
             str += "</tr>";
         })
         str += "</table>"
         return str;

     },*/

    extractDirDocx: function (docxDir, callback) {
        var dir = docxDir + "/documents"
        var resultDirPath = docxDir + "/extractions";
        if (!fs.existsSync(resultDirPath)) {
            fs.mkdir(resultDirPath);
        }


        var setPurposeAndScope = function (tables) {
            var str = "";

            tables.forEach(function (table) {
                if (table.paragraphIndex == -1) {// hors chapitre donc en tete
                    if (table.rows[0].length == 1) {//modele 1
                        var cellPurpose = table.rows[0][0];
                        var cellScope = table.rows[1][0];
                        var p = cellPurpose.indexOf("Purpose:");
                        str += cellPurpose.substring(p + "Purpose:".length);
                        str += "\t";
                        p = cell1Txt.indexOf("Scope of application:");
                        str += cellScope.substring(p + "Scope of application:".length);
                    }
                    else if (true) {//modele 2
                        var cellPurpose = table.rows[0][1].text;
                        var cellScope = table.rows[1][1].text;

                        str += cellPurpose + "\t" + cellScope;
                    }
                    else {
                        console.log("Probem extracting Pupose and scope")
                    }


                }
            })
            return str;
        }


        // le titre est dans la dernière ligne du tableau du fichier header1.xml
        var extractDocTitle = function (headerTables) {
            var docTitle = ""
            if (headerTables.length > 0) {
                var titleTable = headerTables[headerTables.length - 1];
                var lastRow = titleTable.rows[titleTable.rows.length - 1][0];
                docTitle = lastRow;
            }
            return docTitle;
        }

        function removeHtmlTags(text) {
            var regex = /<([^>^\/]*)>(.*)(<[^>^]*>)/;
            var array = regex.exec(text)

            if (array && array.length == 4) {
                return array[2];
            }
            return text;
        }

        var str = "id\tFile\tdocTitle\tpurpose\tscope\tparentChapters\tChapterKey\tChapter\thtmlText\tbotText";
        str += "\ttitle\ttext\ttable\tdocTitle\timage"
        str += "\n";
        var botStr = ""
        var xmlPaths = fs.readdirSync(dir)
        var jsonTables = [];
        var allTables = [];
        var botObjs = [];
        var htmlTexts = "";
        var columnTexts = "title\ttext\ttable\tdocTitle\timage\n";

        var elasticAllParagraphs = [];
        var elasticAllDocuments = [];

        var docId = 1
        var paragraphId = 1
        xmlPaths.forEach(function (xmlPath) {

//console.log(xmlPath);
            if (xmlPath.indexOf(".xml") < 0)
                return;
            if (xmlPath.indexOf("_header.xml") > -1)
                return;
            if (xmlPath.indexOf("_rels.xml") > -1)
                return;

            var filePath = path.resolve(dir + "/" + xmlPath);
            if (fs.lstatSync(filePath).isDirectory())
                return;
            var xmlStr = "" + fs.readFileSync(filePath);

            // console.log("---------" + filePath);
            var doc = new dom().parseFromString(xmlStr);
            var headerTables = docxExtractor.extractHeaderJson(filePath.replace(".xml", "_header.xml"))
            var docRels = docxExtractor.getRelsMap(filePath.replace(".xml", "_rels.xml"));
            var fileName = xmlPath.substring(0, xmlPath.lastIndexOf("."))

            try {
                var jsonContent = docxExtractor.extractContentJson(doc, docRels);
                // jsonContent = addTablesToChapters(jsonContent);


                var purposeAndScope = setPurposeAndScope(jsonContent.tables);


                var docTitle = extractDocTitle(headerTables);


                elasticAllDocuments.push({id: docId, fileName: fileName, purposeAndScope: purposeAndScope})


                var chapterId = 1

                jsonContent.forEach(function (chapter, index) {

                    if (!chapter.key)
                        chapter.key = "";
                    chapter.title = removeHtmlTags(chapter.title);


                    var rooTxt = fileName + "\t" + docTitle + "\t" + purposeAndScope + "\t" + chapter.parent + "\t" + chapter.tocNumber + "\t" + chapter.title + "\t";

                    chapter.paragraphs.forEach(function (paragraph) {
                        if (paragraph) {


                            var botSourceObj = {
                                fileName: fileName,
                                docTitle: docTitle,
                                chapter: chapter,
                                paragraph: paragraph
                            }
                            //clone before use
                            var htmlSourceObj = JSON.parse(JSON.stringify(botSourceObj));
                            var columnsSourceObj = JSON.parse(JSON.stringify(botSourceObj));
                            var elasticSourceObj = JSON.parse(JSON.stringify(botSourceObj));


                            var botObj = formatToBot.format(botSourceObj);
                            botObjs.push(botObj)
                            var botText = JSON.stringify(botObj)
                            var htmlText = formatToHtml.format(htmlSourceObj);
                            htmlTexts += htmlText

                            var columnText = formatToColumns.format(columnsSourceObj);
                            columnTexts += columnText + "\n";


                            elasticAllParagraphs.push(formatToElastic.formatParagraphs(elasticSourceObj, docId, (docId * 10000) + chapterId, (docId * 10000) + (chapterId * 100) + paragraphId));

                            // console.log(botText + "\n");

                            str += (paragraphId) + "\t" + rooTxt + htmlText + "\t" + botText + "\t" + columnText + "\n";
                            paragraphId++;
                        }

                    })
                    chapterId++;


                })
                docId++;
            } catch (e) {
                console.log(e);
                //     str += "ERROR processing " + fileName + " : " + e + "\n";
                //    botObjs.push({ERROR: " processing " + fileName + " : " + e})
            }


        });
        //  console.log(str)
        fs.writeFileSync(resultDirPath + "/allDocsContent2.html", htmlTexts)
        fs.writeFileSync(resultDirPath + "/allDocsContent2.csv", str)
        fs.writeFileSync(resultDirPath + "/botContent.json", JSON.stringify(botObjs, null, 2))
        fs.writeFileSync(resultDirPath + "/allColumns.csv", columnTexts)
        fs.writeFileSync(resultDirPath + "/elasticAllParagraphs.json", JSON.stringify(elasticAllParagraphs, null, 2))
        fs.writeFileSync(resultDirPath + "/elasticAllDocuments.json", JSON.stringify(elasticAllDocuments, null, 2));

        callback(null, "done");
        //    fs.writeFileSync(dir + "/elasticTree.json", JSON.stringify(elasticTree, null, 2))


    },
    convertImagesToPng: function (sourceDirPath, targetDirPath, callback) {

        sourceDirPath = path.resolve(sourceDirPath);
        targetDirPath = path.resolve(targetDirPath);
        var changeDrive = ""
        if (path.sep != "/")//windows
            var changeDrive = " & " + sourceDirPath.substring(0, 2);
        console.log(changeDrive)
        var cmd = "cd " + sourceDirPath + changeDrive + " & " + config.imageMagick.cmdPath + " mogrify -path " + targetDirPath + " " + config.imageMagick.options + " -format " + config.imageMagick.format + " +profile \"*\"  *.*";
        console.log(cmd)
        try {
            exec(cmd, function (err, stdout, stderr) {
                if (err) {
                    console.log(stderr);
                    console.log(stderr)
                    return callback(stderr);
                }
                // console.log("DONE " + cmd);
                return callback(null, "done");
            })
        }
        catch (e) {
            console.log(e);
            return callback(e);
        }
    },
    convertAllImagesToPng: function (sourceDir, targetDir, callback) {

        sourceDir = path.resolve(sourceDir + "/media");
        targetDir = path.resolve(targetDir + "/media");
        if (!fs.existsSync(targetDir))
            fs.mkdir(targetDir)
        var childDirs = fs.readdirSync(sourceDir);
        async.eachSeries(childDirs, function (childDir, callbackEach) {
            var childSourceDirPath = path.resolve(sourceDir + "/" + childDir);
            var childTargetDirPath = path.resolve(targetDir + "/" + childDir);
            console.log("-----s----" + childSourceDirPath)
            console.log("---------" + childTargetDirPath)
            if (!fs.existsSync(childTargetDirPath))
                fs.mkdir(childTargetDirPath)
            docExtractToParagraphs.convertImagesToPng(childSourceDirPath, childTargetDirPath, function (err, result) {
                return callbackEach();
            })
        }, function (err) {
            return callback();
        })
    },


    extractXmlFilesFromDocXDir: function (sourceDir, targetDir, callback) {
        try {
            var unzip = require("unzip");
            sourceDir = path.resolve(sourceDir)
            var docxFiles = fs.readdirSync(sourceDir)
            docxFiles.forEach(function (docPath) {
                var docPath = path.resolve(sourceDir + "/" + docPath);
                if (docPath.indexOf(".docx") > -1 || docPath.indexOf(".docm") > -1) {
                    fs.createReadStream(docPath)
                        .pipe(unzip.Parse())
                        .on('entry', function (entry) {
                            function isWithHeader2(docName) {
                                var docsWitherHeader2 = [110, 112, 318, 677, 686, 900];
                                var yes = false
                                docsWitherHeader2.forEach(function (number) {
                                    if (docName.indexOf("_" + number + "_") > -1) {
                                        yes = true;
                                    }
                                })
                                return yes;
                            }

                            var fileName = entry.path;
                            var type = entry.type; // 'Directory' or 'File'
                            var size = entry.size;
                            var docName = docPath.substring(docPath.lastIndexOf(path.sep) + 1, docPath.lastIndexOf("."));
                            var isWithHeader2 = isWithHeader2(docName);
                            var documentXmlDirPath = targetDir + "/documents/";
                            if (!fs.existsSync(documentXmlDirPath)) {
                                fs.mkdirSync(documentXmlDirPath);
                            }
                            var documentXmlMediaDirPath = sourceDir + "/documents/media";
                            if (!fs.existsSync(documentXmlMediaDirPath)) {
                                fs.mkdirSync(documentXmlMediaDirPath);
                            }

                            if (entry.path === "word/document.xml") {
                                var unzippedWordDirPath = path.resolve(documentXmlDirPath + "/" + docName + ".xml");
                                entry.pipe(fs.createWriteStream(unzippedWordDirPath));
                            }
                            else if (!isWithHeader2 && entry.path === "word/header1.xml") {
                                var unzippedWordDirPath = path.resolve(documentXmlDirPath + "/" + docName + "_header.xml");
                                entry.pipe(fs.createWriteStream(unzippedWordDirPath));
                            }
                            else if (isWithHeader2 && entry.path === "word/header2.xml") {
                                var unzippedWordDirPath = path.resolve(documentXmlDirPath + "/" + docName + "_header.xml");
                                entry.pipe(fs.createWriteStream(unzippedWordDirPath));
                            }
                            else if (entry.path === "word/_rels/document.xml.rels") {
                                var unzippedWordDirPath = path.resolve(documentXmlDirPath + "/" + docName + "_rels.xml");
                                entry.pipe(fs.createWriteStream(unzippedWordDirPath));
                            }
                            else if (entry.path.indexOf("word/media") > -1) {
                                var docMediaDir = documentXmlMediaDirPath + "/" + docName;
                                if (!fs.existsSync(docMediaDir))
                                    fs.mkdirSync(docMediaDir);
                                var name = entry.path.substring(entry.path.lastIndexOf("/") + 1)
                                var mediaPath = path.resolve(docMediaDir + "/" + name);
                                entry.pipe(fs.createWriteStream(mediaPath));
                            }
                            else {
                                entry.autodrain();
                            }
                        }).on('error', function (error) {
                        console.log(error + "  " + docPath)

                    });
                }
            })
            console.log("DONE");
            return callback(null, "done")

        }
        catch (e) {
            console.log(e);
            return callback(e)
        }

    },


}

module.exports = docExtractToParagraphs;


if (false) {
    var dir = "D:\\ATD_Baillet\\applicationTemporaire\\xml"
    docExtractToParagraphs.allParagraphArray2X(dir, "csv", true);
}

if (true) {
    var dir = "D:\\Total\\docs\\GM_MEC_Word"
   // var dir = "D:\\Total\\docs\\test"
  //  docExtractToParagraphs.extractXmlFilesFromDocXDir(dir, dir, function (err, result) {
    //    docExtractToParagraphs.convertImagesToPng(dir + "documents\\media", dir + "documents\\media", function (err, result) {
            docExtractToParagraphs.extractDirDocx(dir, function (err, result) {
                var x = result;
            });
     //   });
   // });
}


const args = process.argv;
console.log(args.toString())
if (args.length > 2) {

    var sourceDirPath = args[2];
    sourceDirPath = path.resolve(sourceDirPath)
    if (!fs.existsSync(sourceDirPath)) {
        return console.log(" sourceDir : " + sourceDirPath + " does not exist")
    }
    var targetDirPath = args[3];
    if (!targetDirPath)
        targetDirPath = sourceDirPath;
    else {
        targetDirPath = path.resolve(targetDirPath)
        if (!fs.existsSync(targetDirPath)) {
            try {
                fs.mkdirSync(targetDirPath)
            } catch (e) {
                return console.log(e);
            }
        }
    }

    async.series([
        // extract necessary xmls from docx documents in dir
        function (callback) {
            //  return callback();
            console.log("Starting : extraction of xml files from docx ")
            docExtractToParagraphs.extractXmlFilesFromDocXDir(sourceDirPath, targetDirPath, function (err, result) {
                if (err)
                    return callback(err);
                console.log("Done : extraction of xml files from docx ")


                setTimeout(function () {
                    // extract paragraphs


                    console.log("Starting : paragraphs extractions")
                    docExtractToParagraphs.extractDirDocx(targetDirPath, function (err, result) {
                        if (err)
                            return callback(err);
                        console.log("Done : paragraphs extractions")

                        console.log("Starting : converting images to png ");
                        var targetMediaDir = path.resolve(targetDirPath + "/extractions");

                        if (!fs.existsSync(targetMediaDir))
                            fs.mkdirSync(targetMediaDir)
                        docExtractToParagraphs.convertAllImagesToPng(targetDirPath + "/documents/", targetMediaDir, function (err, result) {
                            if (err)
                                return callback(err);
                            console.log("Done : converting images to png ")
                            return callback();
                        })


                    })


                }, 1000)


            })
        }
        ,

        // concert images to png
        function (callback) {
            // return callback();

        },

        function (callback) {
            console.log("task successfull : extractions are located in " + targetDirPath)
        }
    ])
} else {
    console.log("Usage :   sourceDir targetDir");
}