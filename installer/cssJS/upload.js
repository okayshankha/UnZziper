function checkOptions(xpo_) {
    //console.log(xpo_);
    if ($('#extractZip').is(":checked")) {
      if (!$('#deleteZip').is(":checked")) {
        var xpo = '{"fileName":"' + xpo_ + '"}';
      }else{
      	var xpo = '{"fileName":"' + xpo_ + '","deleteXpo":"true"}';
        //console.log(xpo_);
      }
        $.ajax({
            url: 'unzip.php',
            data: {Xpo: xpo},
            method: "POST",
            success: function (response) {
                response = JSON.parse(response);
                if (response['unzip'] == 'success') {
                    console.log("Finished true" + response);
                  	alert("Finished");
                }else{
                    alert("Uploaded But error occured while extracting");
                }
            },
            error: function (response) {
                alert("Failed");
                console.log(response);
            }
        });

    } else {
        alert("Finished");
    }
}


(function ()
{
    function support()
    {
        var input = document.createElement('input');
        input.setAttribute('type', 'file');
        if (typeof input['files'] === 'object')
            return true;
        return false;
    }

    function $(id) {
        return document.getElementById(id);
    }


    var form;
    var index = 0;
    var data_name;

    if (support())
    {
        // 50KB chunk sizes.
        var BYTES_PER_CHUNK = 1024 * 1024 * 0.5;

        var _files_data = [];

        window.onload = function ()
        {
            form = $('formUpload');
            var inputs = $('formUpload-file');
            for (i in inputs)
            {
                if (typeof inputs == 'object')
                {
                    if (inputs.getAttribute('type') == 'file')
                    {
                        var file_input = inputs;
                        break;
                    }
                }
            }

            form.reset();

            form.onsubmit = function (e)
            {
                e.preventDefault();
                sendRequest(file_input, this);
            };

            file_input.onchange = function (e)
            {
                var target = e.target ? e.target : e.srcElement;

                var files = target.files;

                for (var i in files)
                {
                    if (typeof files[i] == 'object')
                    {
                        var found = false;
                        var lis = $('formUpload-file');
                        lis.setAttribute('data-name', files[i]['name']);
                        lis.setAttribute('data-end', getSlicesCount(files[i]));

                        if (typeof lis.getAttribute == 'function')
                        {
                            data_name = lis.getAttribute('data-name');
                            console.log("data_name:: "+data_name);
                            Data_name = data_name;
                            var slices = getSlicesCount(files[i]);
                            if (data_name == files[i]['name'] && slices == lis.getAttribute('data-end'))
                            {
                                var tmp =
                                        {
                                            'data-start': lis.getAttribute('data-start'),
                                            'data-end': lis.getAttribute('data-end')
                                        };
                                _files_data = tmp;

                                found = true;
                            }
                        }
                        if (found === false)
                        {
                            var tmp =
                                    {
                                        'data-start': 0,
                                        'data-end': getSlicesCount(files[i])
                                    };
                            _files_data = tmp;
                        }
                    }
                }
            };
        };

        function getSlicesCount(blob)
        {
            var slices = Math.ceil(blob.size / BYTES_PER_CHUNK);
            return slices;
        }

        function sendRequest(input)
        {
            var blobs = input.files;
            async(blobs, 0, blobs.length);
        }

        function async(blobs, i, length)
        {
            if (i >= length)
            {
                form.reset();
                _files_data = [];
                return false;
            }

            var index = _files_data['data-start'];
            if (typeof index === 'undefined') {
                index = 0;
                //console.log("index:: " + index);
            }
            if (index > 0)
                index++;

            var start = 0;

            for (var j = 0; j < index; j++)
            {
                var start = start + BYTES_PER_CHUNK;
                if (start > blobs[i].size)
                    start = blobs[i].size;
            }

            uploadFile(blobs[i], index, start, _files_data['data-end'], function ()
            {
                i++;
                async(blobs, i, length);
            });
        }

        /**
         * Blob to ArrayBuffer (needed ex. on Android 4.0.4)
         **/
        var str2ab_blobreader = function (str, callback)
        {
            var blob;
            var BlobBuilder = window.MozBlobBuilder || window.WebKitBlobBuilder || window.BlobBuilder;
            if (typeof (BlobBuilder) !== 'undefined')
            {
                var bb = new BlobBuilder();
                bb.append(str);
                blob = bb.getBlob();
            } else
                blob = new Blob([str]);

            var f = new FileReader();
            f.onload = function (e)
            {
                var target = e.target ? e.target : e.srcElement;
                callback(target.result);
            };
            f.readAsArrayBuffer(blob);
        };

        /**
         * Performs actual upload, adjustes progress bars
         *
         * @param blob
         * @param index
         * @param start
         * @param end
         */
        function uploadFile(blob, index, start, slicesTotal, callback)
        {
            if (typeof blob == 'undefined') {
                console.log('stop');
                return;
            }

            if (typeof index == 'undefined') {
                console.log("index:: " + index);
                index = 0;
                console.log("index:: " + index);
            }
            var end = start + BYTES_PER_CHUNK;
            if (end > blob.size)
                end = blob.size;

            getChunk(blob, start, end, function (zati)
            {
                // hash md5
                var reader = new FileReader();
                reader.onload = function (e)
                {
                    var target = e.target ? e.target : e.srcElement;

                    var binary = "";
                    var bytes = new Uint8Array(target.result);
                    var length = bytes.byteLength;
                    for (var i = 0; i < length; i++)
                        binary += String.fromCharCode(bytes[i]);

                    var hash = md5(binary);
                    binary = undefined;

                    var xhr = new XMLHttpRequest();
                    xhr.onreadystatechange = function ()
                    {
                        if (xhr.readyState == 4)
                        {
                            console.log(xhr.response);
                            var j = JSON.parse(xhr.response);

                            if (typeof j['error'] !== undefined && j['error'] === 'E_HASH')
                            {
                                window.setTimeout(function ()
                                {
                                    uploadFile(blob, index, start, slicesTotal, callback);
                                }, 100);
                            } else
                            {
                                if (data_name == j['filename'])
                                {
                                    var progress_bar = $('progress-bar');
                                    progress_bar.style.width = j['percent'] + "%";


                                    if (j['percent'] == 100)
                                    {
                                        // CODE ON FINISH
                                        console.log('Finished');
                                      	hideSub();
                                        checkOptions(data_name);
                                    }
                                }
//                                    }
//                                }

                                index++;
                                if (index < slicesTotal)
                                {
                                    window.setTimeout(function ()
                                    {
                                        uploadFile(blob, index, end, slicesTotal, callback);
                                    }, 100);
                                } else
                                    callback();
                            }
                        }
                    };

                    if (typeof index == 'undefined' || index == null) {
                        console.log("index:: " + index);
                        index = 0;
                        console.log("index:: " + index);
                    }
                    
                    xhr.open("post", "upload.php", true);
                    xhr.setRequestHeader("X-File-Name", blob.name);
                    xhr.setRequestHeader("X-Index", index);
                    xhr.setRequestHeader("X-Total", slicesTotal);
                    xhr.setRequestHeader("X-Hash", hash);
                    xhr.send(zati);
                };
                reader.readAsArrayBuffer(zati);
            });
        }

        function getChunk(blob, start, end, callback)
        {
            var chunk;

            if (blob.webkitSlice)
                chunk = blob.webkitSlice(start, end);
            else if (blob.mozSlice)
                chunk = blob.mozSlice(start, end);
            else
                chunk = blob.slice(start, end);

            // android default browser in version 4.0.4 has webkitSlice instead of slice()
            if (blob.webkitSlice)
            {
                str2ab_blobreader(chunk, function (buf)
                {
                    callback(buf);
                });
            } else
                callback(chunk);
        }
    } else
    {
        window.onload = function ()
        {
            form = $('formUpload');
            var inputs = $('formUpload-file');
            
            form.reset();

            form.onsubmit = function (e)
            {
                var img = document.createElement('img');
                img.setAttribute('src', 'loading.gif');
                img.setAttribute('alt', 'loading');

                this.appendChild(img);
            };

            file_input.onchange = function (e)
            {
                var name = 'File selected';

                if (typeof e !== undefined)
                {
                    e.preventDefault();
                    var target = e.target ? e.target : e.srcElement;
                    //console.log(target);
                    name = target.value || 'File selected';
                }

                var toupload = document.getElementById('toupload');
                var ul = toupload.getElementsByTagName('ul')[0];
                while (ul.hasChildNodes())
                    ul.removeChild(ul.firstChild);

                var li = document.createElement('li');
                li.appendChild(document.createTextNode(name));

                ul.appendChild(li);
            };
        };
    }
})();