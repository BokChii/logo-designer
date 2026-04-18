import { Router } from 'express';
import multer from 'multer';
import { generateVariation } from '../services/gemini.js';
import { buildPrompt } from '../utils/prompt-builder.js';

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', `지원하지 않는 파일 형식입니다. PNG, JPG, WEBP만 가능합니다. (현재: ${file.mimetype})`));
        }
    },
});

// Accept main image + reference images for background, outfit, style
const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'backgroundRef', maxCount: 1 },
    { name: 'outfitRef', maxCount: 1 },
    { name: 'styleRef', maxCount: 1 },
]);

/**
 * POST /api/generate
 * Body: multipart/form-data
 *   - image: File (mascot image)
 *   - backgroundRef?, outfitRef?, styleRef?: File (reference images)
 *   - pose, background, outfit, style, expression, accessory, season: string
 *   - customPrompt, aspectRatio: string
 */
router.post('/generate', (req, res, next) => {
    uploadFields(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.field || err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const mainFile = req.files?.image?.[0];
        if (!mainFile) {
            return res.status(400).json({ error: '마스코트 이미지를 업로드해주세요.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.' });
        }

        const {
            pose = 'default',
            background = 'none',
            outfit = 'default',
            style = 'original',
            expression = 'default',
            accessory = 'none',
            season = 'none',
            customPrompt = '',
            aspectRatio = '1:1',
        } = req.body;

        // Collect reference images with their semantic labels
        const referenceImages = [];
        const refLabels = {};

        if (req.files?.backgroundRef?.[0]) {
            const f = req.files.backgroundRef[0];
            referenceImages.push({ buffer: f.buffer, mimeType: f.mimetype, label: 'background' });
            refLabels.background = referenceImages.length; // 1-indexed position
        }
        if (req.files?.outfitRef?.[0]) {
            const f = req.files.outfitRef[0];
            referenceImages.push({ buffer: f.buffer, mimeType: f.mimetype, label: 'outfit' });
            refLabels.outfit = referenceImages.length + 1;
        }
        if (req.files?.styleRef?.[0]) {
            const f = req.files.styleRef[0];
            referenceImages.push({ buffer: f.buffer, mimeType: f.mimetype, label: 'style' });
            refLabels.style = referenceImages.length + 1;
        }

        const prompt = buildPrompt({
            pose, background, outfit, style,
            expression, accessory, season, customPrompt,
            refLabels,
        });

        const result = await generateVariation(
            mainFile.buffer,
            mainFile.mimetype,
            prompt,
            { aspectRatio, referenceImages },
        );

        if (!result.image) {
            return res.status(500).json({
                error: '이미지 생성에 실패했습니다. 다시 시도해주세요.',
                detail: result.text || 'No image returned from model',
            });
        }

        res.json({ image: result.image, text: result.text, mimeType: 'image/png' });
    } catch (err) {
        console.error('Generate error:', err);
        res.status(500).json({ error: err.message || '알 수 없는 오류가 발생했습니다.' });
    }
});

export default router;
