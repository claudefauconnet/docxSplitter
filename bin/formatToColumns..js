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
var config = require("./config..js");


var formatToColumns = {

    format: function (sourceJson) {

        function getTableJson(table) {
            var html = "<table>";

            if (table.values) {
                table.values.forEach(function (value, indexRow) {
                    html += "<tr>";

                    html += "<td>";
                    var i = 0;
                    for (var key in value) {
                        if ((i++) > 0)
                            html += "|"
                        html += key + ":" + value[key].text

                    }

                    html += "</td>";

                    html += "<tr>";
                })
            }

            if (table.rows) {

                table.rows.forEach(function (row, indexRow) {
                    html += "<tr>";
                    row.forEach(function (cell, indexCell) {
                        html += "<td>";
                        html += cell.text;
                        html += "</td>";

                        if (cell.images)
                            html += extractImages(cell.images, fileName)
                    })
                    html += "<tr>";
                })
            }
            html += "</table>";
            return html;
        }

        function extractImages(images, fileName) {
            var line = ""
            images.forEach(function (image, index) {
                var url = image.replace("media/", config.imagesServerUrl + "" + fileName + "/");
                if (index > 0)
                    line += " | ";
                line += url;
            })
            return line;
        }


        function removeHtmlTags(text) {
            var regex = /<([^>^\/]*)>(.*)(<[^>^]*>)/;
            var array = regex.exec(text)

            if (array && array.length == 4) {
                return array[2];
            }
            return text;
        }

        function formatBullets(paragraph) {

            if (paragraph.isSplitBullet) {
                if (paragraph.text == "")
                    return "";
                return "<ul-li>" + paragraph.text + "</ul-li>"
            }
            var bullets = paragraph.bullets;
            if (!bullets || bullets.length == 0) {
                return paragraph.text;
            }


            var bulletsText = "";
            var start = 0;
            var bulletPrefix = "";//<"+paragraph.style+">";
            bulletsText += bulletPrefix;
            bullets.forEach(function (bullet, index) {

                if (index == 0)
                    start = bullet.offset;
                bulletsText += "<" + bullet.type + "-li>" + bullet.text + "</" + bullet.type + "-li>"
            })

            return paragraph.text.substring(0, start) + bulletsText + paragraph.text.substring(start + 1)

        }

        /* *************************end internal functions****************************/


        var line = ""
        var cellImages = "";


        //tables
        var cellTables = "";
        if (sourceJson.paragraph.tables) {
            sourceJson.paragraph.tables.forEach(function (table) {
                if (table.type == "table") {
                    if (table.rows) {

                        table.rows.forEach(function (row, indexRow) {
                            row.forEach(function (cell, indexCell) {
                                if(cell.images) {
                                    if (cellImages != "" )
                                        cellImages += " | "
                                    cellImages += extractImages(cell.images, sourceJson.fileName);
                                }
                            })

                        })
                    }


                }

                // on cree un tableau pour chaque ligne
                else if (table.type == "splitTable") {
                    var json = {rows: []};
                    table.values.forEach(function (obj) {
                        var row = []
                        for (var key in obj) {
                            row.push(key);
                            row.push(obj[key]);

                        }
                        json.rows.push(row)

                    })
                    cellTables += getTableJson(table);
                }
            })
        }


        if (sourceJson.paragraph.text.indexOf("considered according API are") > -1)
            var ww = 1


        sourceJson.paragraph.text == sourceJson.paragraph.text.replace(/\n/gm, "<br>")
        //   sourceJson.paragraph.text= removeHtmlTags( sourceJson.paragraph.text);
        //images

        var cellImages2 = extractImages(sourceJson.paragraph.images, sourceJson.fileName);
        if (cellImages != "" && cellImages2 != "")
            cellImages += " | "
        cellImages += cellImages2

        ///  sourceJson.paragraph.text =sourceJson.paragraph.text .replace(/{{"image":.*}}/gm,"");*/

        //bullets

        sourceJson.paragraph.text = formatBullets(sourceJson.paragraph);

        //   sourceJson.paragraph.text = sourceJson.paragraph.text.replace(/<br>/gm, "\n");


        //infos
        sourceJson.docTitle = removeHtmlTags(sourceJson.chapter.title);
        var cellDocTitle = sourceJson.fileName + "  " + sourceJson.docTitle


        //titre
        line += sourceJson.chapter.title + "\t";

        line += sourceJson.paragraph.text + "\t";


        line += cellTables + "\t";

        line += cellDocTitle + "\t";

        line += cellImages + "\t";


        line = line.replace(/\n/gm, "<br>")
        line = line.replace(/\r/gm, "")

        return line;


    }


}

module.exports = formatToColumns;