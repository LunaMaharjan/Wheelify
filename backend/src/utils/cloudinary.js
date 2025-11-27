import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
        let folder = 'vendor_images';
        let transformation = [];

        if (file.fieldname === 'image') {
            transformation = [{ width: 500, height: 500, crop: 'limit' }];
        } else if (file.fieldname === 'fonepayQr') {
            transformation = [{ width: 300, height: 300, crop: 'limit' }];
        }
        return {
            folder,
            allowed_formats: ['jpg', 'jpeg', 'png'],
            transformation: transformation.length ? transformation : undefined,
            resource_type: 'image',
        };
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG files are allowed.'), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024 // max 15MB per file (optional)
    }
});

export { cloudinary };