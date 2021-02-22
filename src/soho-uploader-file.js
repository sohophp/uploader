/**
 * 上传的文件封装
 */
import SohoUploaderFileChunk from './soho-uploader-file-chunk.js';
import SohoUploaderFileNormal from './soho-uploader-file-normal.js';
import SohoUploaderThumb from './soho-uploader-thumb.js';

class SohoUploaderFile {

    constructor(Uploader, file) {

        this.status = 0; // 狀態, 0: 等待上傳,1: 正在上傳,2:上傳完成,3:上傳出錯,4:已取消上傳,5:上傳成功,6:上傳失敗
        this.position = 0;//已上傳大小
        this.percent = 0;//已上傳百分比,
        this.xhr = null;//XMLHttpRequest,
        this.canceled = false;
        this.uid = SohoUploaderFile.qid++;
        this._file = file;
        this.name = file.name;
        this.type = file.type;
        this.size = file.size;
        this.total = file.size;//總大小
        this.Uploader = Uploader;
        this.Helper = null;
        this.complete = 0;

        //如果设定了分片上传.并且达到分片大小.使用分片上传方式
        if (Uploader.opts.chunked) {
            this.Helper = new SohoUploaderFileChunk(this);
        } else {
            this.Helper = new SohoUploaderFileNormal(this);
        }

    }

    qid() {
        return this.uid;
    }

    /**
     * @todo 解決abort問題. 但會影響續傳...
     * @return {boolean}
     */

    upload() {

        if (this.canceled) {
            return false;
        }

        if (this.status > 0) {
            console.log('重复上传');
            return false;
        }

        this.status = 1;//標記正在上傳

        this.Helper.upload();

    }

    getTotal() {
        return this.total;
    }

    getPosition() {
        return this.position;
    }

    /**
     * //是否上傳完成
     * @return {boolean}
     */
    isCompleted() {
        return this.complete;
        // return this.status > 1;
    }

    /**
     * //是否上傳成功
     * @return {boolean}
     */
    isSuccess() {
        return this.status === 5;
    }

    isCanceled() {
        return this.canceled;
    }

    cancel() {
        this.canceled = true;
        console.log(this.qid() + ':cancel...');
        if (this.Helper.xhr && this.Helper.xhr.abort) {
            this.Helper.xhr.abort();
        }
        this.status = 4;
        this.canceled = true;

        if (this.Uploader.opt('chunked')) {
            let url = this.Uploader.opt("chunkCancelUrl");
            // url += url.indexOf('?') === -1 ? '?' : '&';
            // url += `filename=${this.Helper.getFileName()}`;
            window.fetch(url, {
                method: 'DELETE',
                body: JSON.stringify({filename: this.Helper.getFileName()}),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'Fetcher'
                },
            }).then(response => {
                console.log(response.status, response.statusText);
            });
        }

    }

    sizeFormat() {
        let value = this.size;
        if (!value) {
            return '0 Bytes';
        }
        let unitArr = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        let index = 0;
        let srcsize = parseFloat(value);
        let size = Math.round(srcsize / Math.pow(1024, (index = Math.floor(Math.log(srcsize) / Math.log(1024)))) * 100, 2) / 100;
        return size + unitArr[index];
    }


    /**
     * 上傳進度
     * @param position
     * @param total
     * @param percent
     */
    uploadProgress(position, total, percent) {
        this.position = position;
        this.total = total;
        this.percent = percent;
        // console.log(position,  total , percent);
        if (typeof this.Uploader.opts.uploadProgress === 'function') {
            this.Uploader.opts.uploadProgress.apply(this, [this, position, total, percent]);
        }
        this.Uploader.allProgress();
    }

    /**
     * 上傳完成
     * @param ts
     */
    uploadComplete(ts) {

        this.complete = 1;
        // if (this.status !== 5) {
        //     this.status = 2;
        // }

        this.Uploader.log('uploadComplete');
        if (typeof this.Uploader.opts.uploadComplete === 'function') {
            this.Uploader.opts.uploadComplete.apply(this, [this, ts]);
        }

        if (this.Uploader.isAllCompleted()) {
            this.Uploader.allComplete();
        }

        this.Uploader.threadNumber--;
        this.Uploader.nextThread();

    }

    /**
     * 上傳失敗
     * @param xhr
     * @param status
     * @param e
     */
    uploadError(xhr, status, e) {
        this.status = 3;
        this.Uploader.log('uploadError');
        this.Uploader.log(status);
        if (typeof this.Uploader.opts.uploadError === 'function') {
            this.Uploader.opts.uploadError.apply(this, [this, xhr, status, e]);
        }
    }

    /**
     * 由 chunk 或者 normal 的 handleAbort 執行
     * 取消上傳
     */
    uploadCanceled() {
        this.Uploader.log('uploadCanceled');
        this.status = 4;
        if (typeof this.Uploader.opts.uploadCanceled === 'function') {
            this.Uploader.opts.uploadCanceled.apply(this, [this]);
        }
    }

    /**
     *  加入上傳隊列時觸發
     */
    uploadQueued() {
        if (typeof this.Uploader.opts.uploadQueued === 'function') {
            this.Uploader.opts.uploadQueued.apply(this, [this]);
        }
    }

    /**
     *  上傳成功
     * @param responseJson
     * @param status
     * @param xhr
     */
    uploadSuccess(responseJson, status, xhr) {
        this.status = 5;
        this.Uploader.log('uploadSuccess');
        if (typeof this.Uploader.opts.uploadSuccess === 'function') {
            this.Uploader.opts.uploadSuccess.apply(this, [this, responseJson, status, xhr]);
        }
        if (this.Uploader.isAllSuccess()) {
            this.Uploader.allSuccess();
        }
    }

    /**
     * 開始上傳前
     * @param xhr
     * @returns {boolean|*}
     */
    uploadBeforeSend(xhr) {
        this.Uploader.log(this.qid() + ':uploadBeforeSend...');
        if (typeof this.Uploader.opts.uploadBeforeSend === 'function') {
            return this.Uploader.opts.uploadBeforeSend.apply(this, [this, xhr]);
        }
        return true;
    }

    /**
     * 上傳前驗證.返回true才上傳.否則不上傳
     * @return {boolean}
     */
    uploadBefore() {

        this.Uploader.log(this.qid() + ':uploadBefore...');
        if (!(this.status in [0, 1])) {
            console.log(`status is ${this.status}!`);
            return false;
        }

        if (typeof this.Uploader.opts.uploadBefore === 'function') {
            return this.Uploader.opts.uploadBefore.apply(this, [this]);
        }

        return true;
    }

    thumbImage(width = 100, height = 100) {
        //this.Uploader.opts.thumbWidth, this.Uploader.opts.thumbHeight
        return SohoUploaderThumb.makeThumb(this._file, width, height);
    }

}

//唯一ID
SohoUploaderFile.qid = 0;

export default SohoUploaderFile;
