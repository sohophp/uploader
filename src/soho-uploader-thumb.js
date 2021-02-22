/**
 * 縮略圖
 */
class SohoUploaderThumb {

    static makeThumb(file, width = 100, height = 100, thumbType = 1) {
        const image = new Image();
        const reader = new FileReader();
        reader.addEventListener('load', ev => {
            const img = document.createElement('img');
            img.addEventListener('load', (e) => {
                this.thumbImgLoadHandler(e.target, width, height, thumbType, image);
            }, false);
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
            img.src = ev.target.result;
        }, false);
        reader.readAsDataURL(file);
        return image;
    }

    static thumbImgLoadHandler(image, width, height, thumbType, objImg) {

     
        let
            sourceX = 0,
            sourceY = 0,
            sourceWidth = image.width,
            sourceHeight = image.height,
            destX = 0,
            destY = 0,
            destWidth,
            destHeight;

        if (thumbType === 2) {
            let th = 'both',
                tw = 'both',
                w = width,
                h = height;
            if (width === 0 || image.width < width) {
                w = this.width;
            }
            if (height === 0 || image.height < height) {
                h = this.height;
            }
            destWidth = w;
            destHeight = h;
            let a = image.width / w,
                b = image.height / h, c;
            if (a < b) {
                sourceX = 0;
                sourceWidth = image.width;
                sourceHeight = h * a;
                c = image.height - sourceHeight;
                if (th === 'top') {
                    sourceY = c;
                } else if (th === 'bottom') {
                    sourceY = 0;
                } else { //both
                    sourceY = c / 2;
                }
            } else {
                sourceY = 0;
                sourceHeight = image.height;
                sourceWidth = w * b;
                c = image.width - sourceWidth;
                if (tw === 'left') {
                    sourceX = c;
                } else if (tw === 'right') {
                    sourceX = 0;
                } else { //both
                    sourceX = c / 2;
                }
            }
            width = w;
            height = h;
        } else {  //1  固定大小使用背景
            if (height && image.height > height) {
                destHeight = height;
                destWidth = height * (image.width / image.height);
            } else {
                destWidth = image.width;
                destHeight = image.height;
            }

            if (width && destWidth > width) {
                destHeight = width * (destHeight / destWidth);
                destWidth = width;
            }
            destX = (width - destWidth) / 2;
            destY = (height - destHeight) / 2;
        }
        // console.log('thumbType:' + thumbType);
        // console.log(sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
        const canvas = document.createElement('canvas');
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
        if (typeof objImg === 'function') {
            objImg.call(image, canvas.toDataURL(), width, height, image);
        } else {
            objImg.src = canvas.toDataURL();
            image.remove();
        }
        canvas.remove();
    }

}

export default SohoUploaderThumb;
