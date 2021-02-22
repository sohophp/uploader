/**
 * 文件(圖片)上傳
 * @requirements jQuery,HTML5(IE9.0+)
 * @version 2016-04
 * @since 2016-06-06 增加require.js
 * @since 2016-06-24 完成分片上传
 * @since 2020-01-30 完成 esm (ES2015 Modules) 放棄 require.js
 * 2020-11-13
 * debug: 修改complete爲單獨屬性值，解決success狀態值被complete修改，不能激活success問題
 */

import SohoUploaderFile from './soho-uploader-file.js';

class SohoUploader {

    constructor(opts = {}) {

        const defaults = {
            name: 'file',// 上傳後PHP得到的$_FILES[名稱]
            selectBtn: null, // 選擇button
            uploadBtn: null, // 上傳button
            auto: true, // 是否選擇後自動上傳
            server: 'upload.php',
            accept: {
                title: 'Images',
                extensions: 'gif,jpg,jpeg,bmp,png,svg',
                mimeTypes: 'image/*'
            },
            data: {}, // 附加的參數,
            numThreads: 3, // 最多同時上傳的線程數
            uploadProgress: null,//上傳進度,回調函數
            uploadComplete: null,//上傳完成,回調函數
            uploadFailed: null,//上傳失敗,回調函數
            uploadError: null,//上傳出錯,回調函數
            uploadCanceled: null,//取消上傳,回調函數
            uploadSuccess: null,//上傳成功,回調函數
            uploadQueued: null,//加入上傳隊列時觸發@addFile
            uploadBeforeSend: null,//發送上傳請求回調函數
            debug: 0,//是否開啟調試
            timeout: 300000,//上傳超時時間1000表示1秒
            dataType: 'json',
            thumbWidth: 60,
            thumbHeight: 60,
            chunked: 0, // 分塊上傳,
            chunkSize: 1024 * 1024 * 5,//单位byte,  1024*1024*2 = 2MB ,
            chunkAction: 'chunkUpload.php',
            chunkCancelUrl: '',//取消分片上传网址,用于清理临时文件
            multiple: 1, // 多選上傳,
            allComplete: null,//全部完成,回調函數
            allSuccess: null//合部成功,回調函數
        };

        this.opts = Object.assign({}, defaults, opts);

        this.files = [];// 儲存所有files
        this.threads = [];//儲存上傳的線程,
        this.threadNumber = 0;//有幾個正在上傳的線程
        this.fileField = null;//上传栏位
        this.create();
    }

    log(v) {
        v = `[SohoUploader] ${v}`;
        if (this.opts.debug) {
            window.console.log(v);
        }
    }

    create() {
        this.createFileField();
        if (this.opts.selectBtn && $(this.opts.selectBtn).length) {
            $(this.opts.selectBtn).on('click', (e) => {
                e.preventDefault();
                this.choose();
            });
        }
        if (this.opts.uploadBtn && $(this.opts.uploadBtn).length) {
            $(this.opts.uploadBtn).on('click', (e) => {
                e.preventDefault();
                this.start();
            });
        }
    }

    /**
     *  創建file element
     */
    createFileField() {
        this.fileField = document.createElement('input');
        this.fileField.type = 'file';
        this.fileField.accept = this.opts.accept.mimeTypes;
        if (this.opts.multiple) {
            this.fileField.multiple = 'multiple';
        }

        document.createDocumentFragment().appendChild(this.fileField);

        $(this.fileField)
            .css({position: 'absolute', left: '-1000px', 'top': '-1000px'})
            .on('change', e => {
                const target = e.currentTarget;
                e.preventDefault();
                this.log('fileField Changed');
                this.addFiles(target.files);
                this.log('auto:' + this.opts.auto);
                if (this.opts.auto) {
                    this.start();
                }
            });
        return this;
    }

    /**
     * 添加一組file
     * @param files
     */
    addFiles(files) {
        for (let i = 0; i < files.length; i++) {
            this.addFile(files[i]);
        }
        return this;
    }

    /**
     * 添加file
     * @param file
     */
    addFile(file) {
        let UploaderFile = new SohoUploaderFile(this, file);
        //this.files.push(UploaderFile); @tudo 備用
        //push 不能上傳重復的文件
        this.threads.push(UploaderFile); //目前完成全部上傳後,沒有刪除隊列只是做了標記已上傳.備用其他操作

        UploaderFile.uploadQueued();//加入隊列準備上傳前執行
    }

    /**
     * 開始上傳
     */

    start() {
        this.startThread();
    }

    startThread() {
        this.nextThread();
    }

    /**
     *  查找是否有排队進程.如果有並且正在上傳的數量小於numThreads.開始上傳下一個或多個
     * @return {number}
     */
    nextThread() {
        let completes = 0;
        if (this.threadNumber >= this.opts.numThreads) {
            return completes;
        }

        for (let i = 0; i < this.threads.length; i++) {
            let UploaderFile = this.threads[i];
            if (UploaderFile.status === 0) {
                this.threadNumber++;
                UploaderFile.upload();
                if (this.threadNumber >= this.opts.numThreads) {//同時上傳進程數
                    return 1;
                }
            } else if (UploaderFile.isCompleted()) { //不是等待0,也不是正在上傳1,標記一個完成
                completes++;
            }
        }

        if (completes >= this.threads.length) {//全部完成
            this.allComplete();
        }
    }

    /**
     * 是否全部完成
     * @return {boolean}
     */
    isAllCompleted() {
        for (let i = 0; i < this.threads.length; i++) {
            if (!this.threads[i].isCompleted()) {
                return false;
            }
        }
        return true;
    }

    /**
     *  上傳進程全部完成
     */
    allComplete() {
        this.log('allComplete');
        if (typeof this.opts.allComplete === 'function') {
            let progress = this.progress();
            this.opts.allComplete.apply(this, [this, progress]);
        }
    }

    /**
     * 全部進度
     */
    progress() {
        let total = 0,//總大小
            position = 0,//總進度
            percent = 0;//百分比
        for (let i = 0; i < this.threads.length; i++) {
            let UploaderFile = this.threads[i];
            if (UploaderFile.status > 0) {
                total += UploaderFile.getTotal();
                position += UploaderFile.getPosition();
            }
        }
        if (position && total) {
            percent = Math.ceil(position / total * 100);
        }
        return {total, position, percent};
    }

    /**
     * 全部進度
     */
    allProgress() {
        let v = this.progress();
        if (typeof this.opts.allProgress === 'function') {
            this.opts.allProgress.apply(this, [this, v.total, v.position, v.percent]);
        }
    }

    /**
     * 觸發選擇圖片
     * @returns {SohoUploader}
     */
    choose() {
        $(this.fileField).trigger('click');
        return this;
    }

    /**
     * 返回選項
     * @param key
     * @returns {*}
     */
    opt(key) {
        return this.opts[key];
    }

    /**
     * 是否全部上傳完成
     */

    isAllSuccess() {
        for (let i = 0; i < this.threads.length; i++) {
            if (!this.threads[i].isSuccess()) {
                return false;
            }
        }
        return true;
    }

    /**
     * 全部完成
     */
    allSuccess() {
        if (typeof this.opts.allSuccess === 'function') {
            this.opts.allSuccess.apply(this, [this]);
        }
    }

}

export default SohoUploader;
