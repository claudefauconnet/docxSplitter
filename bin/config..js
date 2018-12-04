/*******************************************************************************
 * DOCX SPLITTER************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2018 Claude Fauconnet claude.fauconnet@neuf.fr
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
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


/**
 * configuration file
 * @module config
 */



var config = {
    /**
     *
     *  imagesServerUrl optional absolute location of images on server (used by html output)
     */
    imagesServerUrl: "http://vps254642.ovh.net/scoreparts/media/",


    /**
     *
     *  imageMagick parameter used to transform images to png
     *  @params cmdPath location of agick.exe
     *  @params options : resize or pointsize parameter : empty string if no transformation
     *  @params target format
     *
     *
     */


    imageMagick: {
        cmdPath: "magick.exe",
        options: "-resize 250x250",
        format: "png"

    }

}

module.exports = config;