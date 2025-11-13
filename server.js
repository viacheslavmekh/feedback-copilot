import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to convert image to base64
function imageToBase64(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  let mimeType = 'image/jpeg';
  
  if (ext === '.png') {
    mimeType = 'image/png';
  } else if (ext === '.jpg' || ext === '.jpeg') {
    mimeType = 'image/jpeg';
  }
  
  return {
    data: base64,
    mimeType: mimeType,
  };
}

// Helper function to extract document/presentation ID from Google Docs/Slides URL
function extractGoogleDocId(url) {
  // Match Google Docs patterns:
  // https://docs.google.com/document/d/DOCUMENT_ID/edit
  // https://docs.google.com/document/d/DOCUMENT_ID/view
  // https://docs.google.com/document/d/DOCUMENT_ID/
  const docMatch = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  if (docMatch) {
    return { id: docMatch[1], type: 'document' };
  }
  
  // Match Google Slides patterns:
  // https://docs.google.com/presentation/d/PRESENTATION_ID/edit
  // https://docs.google.com/presentation/d/PRESENTATION_ID/view
  // https://docs.google.com/presentation/d/PRESENTATION_ID/
  const slidesMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
  if (slidesMatch) {
    return { id: slidesMatch[1], type: 'presentation' };
  }
  
  return null;
}

// Helper function to fetch text content from Google Docs or Slides
async function fetchGoogleDocsContent(url) {
  try {
    const docInfo = extractGoogleDocId(url);
    if (!docInfo) {
      throw new Error('Invalid Google Docs or Slides URL format');
    }

    let exportUrl;
    
    if (docInfo.type === 'document') {
      // Use the export endpoint to get plain text for Google Docs
      exportUrl = `https://docs.google.com/document/d/${docInfo.id}/export?format=txt`;
    } else if (docInfo.type === 'presentation') {
      // Use the export endpoint to get plain text for Google Slides
      // Format: txt exports as plain text
      exportUrl = `https://docs.google.com/presentation/d/${docInfo.id}/export?format=txt`;
    }
    
    const response = await fetch(exportUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FeedbackCoPilot/1.0)',
      },
    });

    if (!response.ok) {
      // For documents, try plain text alternative
      if (docInfo.type === 'document') {
        const altUrl = `https://docs.google.com/document/d/${docInfo.id}/export?format=plain`;
        const altResponse = await fetch(altUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FeedbackCoPilot/1.0)',
          },
        });

        if (!altResponse.ok) {
          throw new Error(`Failed to fetch ${docInfo.type} content: ${response.status} ${response.statusText}`);
        }

        return await altResponse.text();
      } else {
        throw new Error(`Failed to fetch ${docInfo.type} content: ${response.status} ${response.statusText}`);
      }
    }

    return await response.text();
  } catch (error) {
    console.error(`Error fetching Google ${docInfo?.type || 'Docs/Slides'}:`, error);
    throw new Error(`Failed to fetch Google Docs/Slides content: ${error.message}`);
  }
}

// POST /api/upload - Handle file uploads
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    // Handle PDF files
    if (fileExtension === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const text = pdfData.text;
      
      // Clean up file
      fs.unlinkSync(filePath);
      
      return res.json({
        type: 'text',
        content: text,
      });
    }

    // Handle image files
    if (['.png', '.jpg', '.jpeg'].includes(fileExtension)) {
      const base64Data = imageToBase64(filePath);
      
      // Clean up file
      fs.unlinkSync(filePath);
      
      return res.json({
        type: 'image',
        content: `data:${base64Data.mimeType};base64,${base64Data.data}`,
      });
    }

    // Unsupported file type
    fs.unlinkSync(filePath);
    return res.status(400).json({ error: 'Unsupported file type' });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// Helper function to generate default prompt
function generateDefaultPrompt(task, criteria, content, isImage = false) {
  const studentWorkPlaceholder = isImage ? '[Робота студента надана як зображення нижче]' : content;
  
  return `# SYSTEM PROMPT: Feedback Co-Pilot (версія з урахуванням реального стилю)

Ти — **AI-куратор у стилі реальних кураторів курсу**.  

Твоя задача — створювати теплий, дружній, але професійний фідбек, який відчувається «живим» і близьким до людини.  

Тон завжди підтримувальний, світлий, позитивний, з легкою емоційністю (але без надмірності).

Фідбек має бути одночасно:

- теплим і персоналізованим («Вітаю з домашкою!», «Класний старт!», «Ти молодець!»);

- структурованим (Context → Strengths → Improvements → Next steps);

- конкретним (з прикладами, поясненнями, точними порадами);

- емпатійним (без осуду, лише конструктив);

- стильовим і максимально схожим на фідбеки кураторів.

---

## 1. Орієнтуйся на реальний стиль кураторів

Використовуй стиль із прикладів:

- персональні звернення: «привіт!», «молодець», «класно, що…», «приємно читати»;

- комплімент перед зауваженнями;

- легкі емоційні маркери: «done! 🤩», «найс», «супер»;

- структуровані списки;

- м'які формулювання у критиці: «можна додати», «було б цікаво», «хотілося б трохи більше»;

- рекомендації як «ідеї на подумати»;

- тон розмовний, природний, але не фамільярний.

---

## 2. Оцінюй за чіткими критеріями курсу

### Розуміння теми

Чи коректно застосовані інструменти, логіка, теорія.

### Оформлення

Структура, підзаголовки, читабельність, візуали, грамотність.

### Розрахунки в Google Sheets (якщо є)

Формули, правильність логіки.

### Коментар студента

Чи пояснює хід думок, труднощі, рішення.

> Це не оцінка «правильно/неправильно», а аналіз розуміння.

---

## 3. Структура вихідного фідбеку

### Вступ

Тепле звернення + міні-комплімент + «done!» або подібне.

**Приклад:**

«Іро, привіт! Вітаю з домашкою — done! Дуже приємно було читати, ти класно підійшла до завдання 💛»

### Context

1–2 речення про те, яке було завдання і що зробив студент.

### Strengths

3–6 конкретних сильних моментів.

Стильові формулювання:

- «дуже класно, що…»

- «підкреслю окремо, що…»

- «видно, що ти реально попрацювала…»

- «структура зчитується плавно…»

### Improvements

М'які, конструктивні поради.

Кожен пункт має містити:

- що покращити,

- чому це важливо,

- приклад, як зробити краще.

Стильові фрази:

- «можна було б ще трохи додати…»

- «було б цікаво побачити…»

- «хотілось би більше конкретики…»

- «ідея на подумати…»

### Next Steps

3–6 коротких, практичних рекомендацій.

Формат:

1. …

2. …

3. …

---

## 4. Тон та стиль

Дотримуйся:

- теплого, дружнього тону: «молодець», «дуже класно», «приємно читати»;

- доброзичливої мови без осуду;

- легких emoji (1–2 максимум);

- розмовного, але грамотного стилю;

- конкретики та прикладів;

- ідей та гіпотез для розвитку.

Не використовуй:

- суху формальність;

- різку критику;

- надмірно академічний стиль.

---

## ЗАВДАННЯ:

### ASSIGNMENT:

${task}

${criteria ? `### EVALUATION CRITERIA:

${criteria}

` : ''}### STUDENT WORK:

${studentWorkPlaceholder}

---

Створи фідбек за структурою: Вступ → Context → Strengths → Improvements → Next Steps.

Використовуй українську мову.`;
}

// POST /api/analyze - Analyze content and generate feedback
app.post('/api/analyze', async (req, res) => {
  try {
    let { task, criteria, content, customPrompt } = req.body;

    if (!task || !content) {
      return res.status(400).json({
        error: 'Missing required fields: task and content are required',
      });
    }

    // Check if content is a Google Docs or Slides link and fetch it
    if (typeof content === 'string' && content.includes('docs.google.com')) {
      try {
        content = await fetchGoogleDocsContent(content);
      } catch (error) {
        return res.status(400).json({
          error: `Failed to fetch Google Docs/Slides content: ${error.message}`,
        });
      }
    }

    // Get the model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let prompt;
    let parts = [];

    // Check if content is a base64 image
    const isImage = typeof content === 'string' && content.startsWith('data:image');
    
    // Generate prompt - use custom if provided, otherwise use default
    let promptText;
    if (customPrompt && customPrompt.trim()) {
      // Replace placeholders in custom prompt
      let processedPrompt = customPrompt;
      
      // Handle optional criteria - replace or remove section
      if (criteria && criteria.trim()) {
        processedPrompt = processedPrompt.replace(/\{\{criteria\}\}/g, criteria);
      } else {
        // Remove criteria section if not provided
        processedPrompt = processedPrompt.replace(/\{\{criteria\}\}/g, '');
        // Remove empty criteria section lines
        processedPrompt = processedPrompt.replace(/### EVALUATION CRITERIA:\s*\n\s*\n/g, '');
      }
      
      promptText = processedPrompt
        .replace(/\{\{task\}\}/g, task)
        .replace(/\{\{content\}\}/g, isImage ? '[Робота студента надана як зображення нижче]' : content);
    } else {
      promptText = generateDefaultPrompt(task, criteria || '', content, isImage);
    }

    if (isImage) {
      // Extract base64 data and mime type
      const matches = content.match(/^data:image\/(\w+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        
        // Use Vision API for images
        parts = [
          {
            text: promptText,
          },
          {
            inlineData: {
              mimeType: `image/${mimeType}`,
              data: base64Data,
            },
          },
        ];
      } else {
        return res.status(400).json({ error: 'Invalid image format' });
      }
    } else {
      // Text content
      parts = [{ text: promptText }];
    }

    // Generate feedback
    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const response = await result.response;
    const feedback = response.text();

    res.json({ feedback });

  } catch (error) {
    console.error('Analysis error:', error);
    console.error('Error details:', error.message);
    
    // Handle specific Gemini API errors
    if (error.message && (error.message.includes('API_KEY') || error.message.includes('API key'))) {
      return res.status(500).json({
        error: 'Invalid or missing Gemini API key. Please check your .env file.',
      });
    }

    res.status(500).json({
      error: `Failed to generate feedback: ${error.message || 'Unknown error'}`,
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Feedback Co-Pilot server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

