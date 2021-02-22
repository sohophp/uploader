/**
 * 正常上傳單個文件
 */
class SohoUploaderFileNormal {

    constructor(UploaderFile) {
        this.UploaderFile = UploaderFile;
        this.Uploader = UploaderFile.Uploader;
    }

    upload() {

        if (!this.UploaderFile.uploadBefore()) {
            return false;
        }

        const form_data = new FormData();
        const Uploader = this.Uploader;

        for (let k in Uploader.opts.data) {
            form_data.append(k, Uploader.opts.data[k]);
        }

        form_data.append(Uploader.opts.name, this.UploaderFile._file);

        let opts = {
            url: Uploader.opts.server,
            type: 'POST',
            context: this,
            timeout: Uploader.opts.timeout,
            success: this.uploadSuccess,
            error: this.uploadError,
            complete: this.uploadComplete,
            abort: this.handleAbort,
            beforeSend: this.uploadBeforeSend,
            data: form_data,
            cache: false,
            contentType: false,//指定为false才能形成正确的Content-Type
            processData: false,//不要对form进行处理
            async: true,
            dataType: Uploader.opts.dataType
        };

        opts.xhr = () => {
            let xhr = $.ajaxSettings.xhr();
            if (xhr.upload) {
                xhr.upload.addEventListener('progress', ev => {
                    let percent = 0,
                        position = ev.loaded || ev.position,
                        total = ev.total;
                    if (ev.lengthComputable) {
                        percent = Math.ceil(position / total * 100);
                    }
                    this.uploadProgress(ev, position, total, percent);
                }, false);
            } else {
                window.alert('請升級瀏覽器');
            }
            return xhr;
        };

        this.xhr = $.ajax(opts);
    }

    /**
     * 上傳進度
     * @param event
     * @param position
     * @param total
     * @param percent
     */
    uploadProgress(event, position, total, percent) {
        return this.UploaderFile.uploadProgress(position, total, percent);
    }

    /**
     * 上傳完成
     * @param xhr
     * @param ts
     */
    uploadComplete(xhr, ts) {
        return this.UploaderFile.uploadComplete(ts);
    }

    /**
     * 上傳失敗
     * @param xhr
     * @param status
     * @param e
     */
    uploadError(xhr, status, e) {
        return this.UploaderFile.uploadError(xhr, status, e);
    }

    //取消上傳
    handleAbort() {
        return this.UploaderFile.uploadCanceled();
    }

    //上傳成功
    uploadSuccess(responseText, status, xhr) {
        return this.UploaderFile.uploadSuccess(responseText, status, xhr);
    }

    uploadBeforeSend(xhr) {
        return this.UploaderFile.uploadBeforeSend(xhr);
    }

}

export default SohoUploaderFileNormal;
