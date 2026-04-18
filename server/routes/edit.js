import { Router } from 'express';
import { editImage, editRegion } from '../services/gemini.js';

const router = Router();

/**
 * POST /api/edit
 * Fine-tune a generated image with a text prompt.
 * Body (JSON): { imageBase64, mimeType?, prompt }
 */
router.post('/edit', async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
        }

        const { imageBase64, mimeType = 'image/png', prompt } = req.body;

        if (!imageBase64) return res.status(400).json({ error: '이미지 데이터가 없습니다.' });
        if (!prompt?.trim()) return res.status(400).json({ error: '프롬프트를 입력해주세요.' });

        const imageBuffer = Buffer.from(imageBase64, 'base64');
        const result = await editImage(imageBuffer, mimeType, prompt.trim());

        if (!result.image) {
            return res.status(500).json({ error: '이미지 편집에 실패했습니다.', detail: result.text });
        }

        res.json({ image: result.image, text: result.text, mimeType: 'image/png' });
    } catch (err) {
        console.error('Edit error:', err);
        res.status(500).json({ error: err.message || '오류가 발생했습니다.' });
    }
});

/**
 * POST /api/edit-region
 * Edit only the selected region of an image using a mask.
 * Body (JSON): { imageBase64, maskBase64, prompt, selectionDesc? }
 */
router.post('/edit-region', async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
        }

        const { imageBase64, maskBase64, prompt, selectionDesc = '' } = req.body;

        if (!imageBase64) return res.status(400).json({ error: '이미지 데이터가 없습니다.' });
        if (!maskBase64) return res.status(400).json({ error: '마스크 데이터가 없습니다.' });
        if (!prompt?.trim()) return res.status(400).json({ error: '프롬프트를 입력해주세요.' });

        const imageBuffer = Buffer.from(imageBase64, 'base64');
        const maskBuffer = Buffer.from(maskBase64, 'base64');

        const result = await editRegion(imageBuffer, maskBuffer, prompt.trim(), selectionDesc);

        if (!result.image) {
            return res.status(500).json({ error: '영역 편집에 실패했습니다.', detail: result.text });
        }

        res.json({ image: result.image, text: result.text, mimeType: 'image/png' });
    } catch (err) {
        console.error('Edit-region error:', err);
        res.status(500).json({ error: err.message || '오류가 발생했습니다.' });
    }
});

export default router;
