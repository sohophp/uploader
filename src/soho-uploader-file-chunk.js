/**
 * 分块上传
 */
class SohoUploaderFileChunk {

    constructor(UploaderFile) {
        this.jQuery = window.jQuery;
        this.UploaderFile = UploaderFile;
        this.Uploader = UploaderFile.Uploader;
        //第一次分片上传会传回一个文件名,
        this.chunk_filename = "";
        //共分成几块
        this.chunk_length = Math.ceil(this.UploaderFile.size / this.Uploader.opts.chunkSize);
        //第几块
        this.chunk_index = 0;

        //每块多大
        this.chunk_size = this.Uploader.opts.chunkSize;
    }

    upload() {
        if (!this.UploaderFile.uploadBefore()) {
            return false;
        }
        this.uploadChunk();
    }

    getFileName() {
        return this._filename;
    }

    /**
     * @return {boolean}
     */
    uploadChunk() {
        // console.log(this.UploaderFile)
        if (!this.UploaderFile.uploadBefore()) {
            return false;
        }

        // console.log(this.chunk_index ,  this.UploaderFile)
        let
            fd = new FormData(),
            start = this.chunk_index * this.chunk_size,
            slice = "slice";
        if (Blob.prototype.webkitSlice) {
            slice = "webkitSlice";
        } else if (Blob.prototype.mozSlice) {
            slice = "mozSlice";
        }

        let end = Math.min(this.UploaderFile.size, start + this.chunk_size);
        // console.log(this.UploaderFile  , start , end);

        fd.append("chunk", this.UploaderFile._file[slice](start, end));
        fd.append("name", this.UploaderFile.name);
        fd.append("id", this.UploaderFile.uid);
        fd.append("size", this.UploaderFile.size);
        fd.append("index", this.chunk_index);
        fd.append("start", start);
        fd.append("end", end);
        fd.append("filename", this._filename);

        let opts = {
            url: this.Uploader.opts.chunkAction,
            type: "POST",
            context: this,
            timeout: this.Uploader.opts.timeout,
            success: this.uploadSuccess,
            error: this.uploadError,
            complete: this.uploadComplete,
            abort: this.handleAbort,
            beforeSend: this.uploadBeforeSend,
            data: fd,
            cache: false,
            contentType: false,//指定为false才能形成正确的Content-Type
            processData: false,//不要对form进行处理
            async: true,
            dataType: this.Uploader.opts.dataType
        };
        opts.xhr = () => {
            let xhr = this.jQuery.ajaxSettings.xhr();
            if (xhr.upload) {
                xhr.upload.addEventListener("progress", event => {
                    let percent = 0;
                    let position = event.loaded || event.position;
                    let total = event.total;
                    if (event.lengthComputable) {
                        percent = Math.ceil(position / total * 100);
                    }
                    this.uploadProgress(event, position, total, percent);
                }, false);
            } else {
                window.alert("請升級瀏覽器");
            }
            return xhr;
        };
        this.xhr = this.jQuery.ajax(opts);
    }

    /**
     *  //上傳進度
     * @param event
     * @param position
     * @param total
     * @param percent
     * @constructor
     */
    uploadProgress(event, position, total, percent) {
        console.log(percent);
        let pos = position + this.chunk_index * this.chunk_size;
        total = this.UploaderFile.size;
        let pc = pos ? Math.ceil(pos / total * 100) : 0;
        this.UploaderFile.uploadProgress(pos, total, pc);
    }

    /**
     *  //上傳完成
     * @param xhr
     * @param ts
     * @constructor
     */
    uploadComplete(xhr, ts) {
        this.Uploader.log("uploadComplete:" + this.chunk_index);
        if (this.uploadIsCompleted()) {
            this.UploaderFile.uploadComplete(ts);
        }
    }

    /**
     * //上傳失敗
     * @param xhr
     * @param status
     * @param e
     * @constructor
     */
    uploadError(xhr, status) {
        // this.status  = 3;
        switch (status) {
            case "parsererror":
                this.Uploader.log("uploadError");
                console.error("parsererror:");
                console.log(xhr.responseText);
                break;
            case "abort":
                //console.log('取消觸發的error');
                break;
            default:
                this.Uploader.log("uploadError");
                console.error(status, xhr.responseText);
        }

    }

    /**
     * 取消上傳
     * @constructor
     */
    handleAbort() {
        this.Uploader.log("handleAbort");
        this.UploaderFile.uploadCanceled();
    }

    /**
     * 上傳成功
     * @param responseJson
     * @param status
     * @param xhr
     * @return {boolean}
     * @constructor
     */
    uploadSuccess(responseJson, status, xhr) {
        //console.clear();
        if (this.UploaderFile.canceled || xhr.readyState !== 4) {
            console.log("success:is canceled".xhr.readyState);
            return false;
        }
        this.Uploader.log("uploadSuccess");
        // console.log(responseJson)
        let returnParams = responseJson.results;
        if (!returnParams || returnParams.name !== this.UploaderFile.name || returnParams.id !== this.UploaderFile.uid || !returnParams.filename) {
            console.error(responseJson, returnParams, this.UploaderFile.name, this.UploaderFile.uid);
            this.UploaderFile.cancel();
            return false;
        }

        this._filename = returnParams.filename;

        if (!this.uploadIsCompleted()) {
            this.chunk_index++;
            this.uploadChunk();
        } else {
            console.log(responseJson);
            this.UploaderFile.uploadSuccess(responseJson, status, xhr);
        }
    }

    uploadBeforeSend() {
        this.Uploader.log(this.UploaderFile.qid() + ":uploadBeforeSend...");
        return true;
    }

    /**
     * 分片上傳是否結束
     * @return {boolean}
     * @constructor
     */
    uploadIsCompleted() {
        return this.chunk_index + 1 >= this.chunk_length;
    }
}

export default SohoUploaderFileChunk;
