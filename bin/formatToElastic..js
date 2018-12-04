
var formatToElastic = {

    formatParagraphs: function (sourceJson,docId,chapterId,paragraphId) {

        var obj = {
            paragraphId:paragraphId,
            chapterId:chapterId,
            docId:docId,
            fileName: sourceJson.fileName,
            docTitle: sourceJson.docTitle,
            chapter: sourceJson.chapter.title,
            parentChapter: sourceJson.chapter.parent,
            chapterTocNumber: sourceJson.chapter.tocNumber,
            text: sourceJson.paragraph.text,



        }
        if (sourceJson.paragraph.tables && sourceJson.paragraph.tables.length > 0)
            obj.tables = sourceJson.paragraph.tables
        return obj;
    }


}

module.exports = formatToElastic;