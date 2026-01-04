const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const fsRegular = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

const app = express();
const PORT = process.env.PORT || 8069;

// Hardcoded API Key
const HARDCODED_GEMINI_KEY = "AIzaSyBHeHded7qQ26R4y-6OglmK22O_U3NeR-0";

app.use(cors());
app.use(express.json());

const upload = multer({ dest: '/tmp/uploads/' });
const DATABASE_DIR = '/tmp/database';
if (!fsRegular.existsSync(DATABASE_DIR)) fsRegular.mkdirSync(DATABASE_DIR, { recursive: true });

async function extractTextFromFile(filePath, originalFilename) {
    const ext = path.extname(originalFilename).toLowerCase();
    try {
        if (ext === '.pdf') {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdf(dataBuffer);
            return data.text;
        } else if (ext === '.docx') {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        } else if (ext === '.txt' || ext === '.md') {
            return await fs.readFile(filePath, 'utf8');
        }
        return "";
    } catch (e) { return ""; }
}

async function generateStudyGuide(transcript, goals, difficulty, examDate) {
    const genAI = new GoogleGenerativeAI(HARDCODED_GEMINI_KEY);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = "Expert study planner. Goals: " + goals + ". Difficulty: " + difficulty + ". Exam: " + examDate + ".\n" +
        "Generate JSON:\n" +
        "{\n" +
        "  \"title\": \"String\",\n" +
        "  \"summary\": \"String\",\n" +
        "  \"topics\": [{\"name\": \"Topic\", \"difficulty\": \"Easy|Medium|Hard\"}],\n" +
        "  \"study_tips\": [\"Tip\"],\n" +
        "  \"flash_cards\": [[\"Q\", \"A\"]],\n" +
        "  \"quiz\": [{\"question\": \"Q\", \"possible_answers\": [\"A\",\"B\",\"C\",\"D\"], \"index\": 0}],\n" +
        "  \"study_schedule\": [{\"day_offset\": 1, \"title\": \"...\", \"details\": \"...\", \"duration_minutes\": 45, \"type\": \"learning\", \"difficulty\": \"Hard\"}]\n" +
        "}\n" +
        "Transcript: " + transcript.substring(0, 40000);

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
}

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        const transcript = await extractTextFromFile(req.file.path, req.file.originalname);
        const guide = await generateStudyGuide(transcript, req.body.goals, req.body.difficulty, req.body.exam_date);
        const id = Date.now().toString();
        guide.id = id;
        guide.filename = req.file.originalname;
        await fs.writeFile(path.join(DATABASE_DIR, `${id}.json`), JSON.stringify(guide));
        res.json(guide);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/guides', async (req, res) => {
    try {
        const files = await fs.readdir(DATABASE_DIR);
        const guides = [];
        for (const f of files) {
            if (f.endsWith('.json')) {
                const d = JSON.parse(await fs.readFile(path.join(DATABASE_DIR, f)));
                guides.push({ id: d.id, title: d.title, filename: d.filename });
            }
        }
        res.json({ guides });
    } catch (e) { res.json({ guides: [] }); }
});

app.get('/api/guide/:id', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(DATABASE_DIR, `${req.params.id}.json`));
        res.json(JSON.parse(data));
    } catch (e) { res.status(404).end(); }
});

const FRONTEND_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scholar AI</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root { --primary: #a855f7; --secondary: #6366f1; --bg: #0a0a0f; --card: rgba(255, 255, 255, 0.03); --border: rgba(255, 255, 255, 0.08); --text: #ffffff; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; margin: 0; padding: 0; overflow-x: hidden; }
        .container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
        nav { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 0; }
        .logo { font-size: 1.5rem; font-weight: 800; background: linear-gradient(to right, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 2rem; backdrop-filter: blur(10px); }
        .btn { background: linear-gradient(to right, var(--primary), var(--secondary)); color: #fff; border: none; padding: 0.8rem 1.5rem; border-radius: 10px; font-weight: 700; cursor: pointer; }
        .upload-zone { border: 2px dashed var(--border); border-radius: 12px; padding: 2rem; text-align: center; cursor: pointer; }
        .form-group { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        input, select, textarea { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 8px; padding: 0.8rem; color: #fff; width: 100%; box-sizing: border-box; }
        .guide-view { display: none; }
        .tabs { display: flex; gap: 0.5rem; margin: 2rem 0; }
        .tab { padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; border: 1px solid var(--border); }
        .tab.active { background: var(--primary); }
        .section { display: none; } .section.active { display: block; }
        .item { background: var(--card); border: 1px solid var(--border); padding: 1rem; border-radius: 10px; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="container">
        <nav><div class="logo">Scholar AI</div></nav>
        <div id="home">
            <h1 style="text-align:center; font-size: 3rem;">Study <span style="color:var(--primary)">Smarter</span></h1>
            <div class="card" style="margin-top: 2rem;">
                <div class="upload-zone" onclick="document.getElementById('f').click()">
                    <p id="fl">Click to Upload PDF/DOCX</p>
                    <input type="file" id="f" style="display:none" onchange="document.getElementById('fl').innerText=this.files[0].name">
                </div>
                <div class="form-group">
                    <textarea id="g" placeholder="Study Goals..."></textarea>
                    <select id="d"><option>Beginner</option><option selected>Intermediate</option><option>Advanced</option></select>
                    <input type="date" id="e">
                    <button class="btn" style="width:100%" onclick="gen()">Generate Guide</button>
                </div>
            </div>
            <div id="re"></div>
        </div>
        <div id="guide" class="guide-view">
            <button class="btn" onclick="location.reload()">Back</button>
            <h2 id="gt" style="margin: 1rem 0;"></h2>
            <div class="tabs">
                <div class="tab active" onclick="tab('summary',this)">Summary</div>
                <div class="tab" onclick="tab('flash',this)">Flashcards</div>
                <div class="tab" onclick="tab('quiz',this)">Quiz</div>
                <div class="tab" onclick="tab('sche',this)">Schedule</div>
            </div>
            <div id="summary" class="section active card"></div>
            <div id="flash" class="section card" style="text-align:center;">
                <div id="fc" style="font-size: 1.5rem; height: 150px; display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="flip()"></div>
                <button class="btn" onclick="next()">Next Flashcard</button>
            </div>
            <div id="quiz" class="section card"></div>
            <div id="sche" class="section"></div>
        </div>
    </div>
    <script>
        let cur = null, fIdx = 0, flipd = false;
        async function gen() {
            const fd = new FormData();
            fd.append('file', document.getElementById('f').files[0]);
            fd.append('goals', document.getElementById('g').value);
            fd.append('difficulty', document.getElementById('d').value);
            fd.append('exam_date', document.getElementById('e').value);
            document.body.style.opacity = 0.5;
            const res = await fetch('/api/upload', {method:'POST', body:fd});
            cur = await res.json();
            document.body.style.opacity = 1;
            render();
        }
        function render() {
            document.getElementById('home').style.display = 'none';
            document.getElementById('guide').style.display = 'block';
            document.getElementById('gt').innerText = cur.title;
            document.getElementById('summary').innerText = cur.summary;
            document.getElementById('fc').innerText = cur.flash_cards[0][0];
            document.getElementById('sche').innerHTML = cur.study_schedule.map(function(s) {
                return '<div class="item"><b>Day ' + s.day_offset + ': ' + s.title + '</b><p>' + s.details + '</p></div>';
            }).join('');
            document.getElementById('quiz').innerHTML = cur.quiz.map(function(q) {
                return '<div class="item"><b>' + q.question + '</b>' + q.possible_answers.map(function(a) { return '<div>• ' + a + '</div>'; }).join('') + '</div>';
            }).join('');
        }
        function tab(id, el) {
            document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
            document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
            document.getElementById(id).classList.add('active'); el.classList.add('active');
        }
        function flip() { flipd = !flipd; document.getElementById('fc').innerText = cur.flash_cards[fIdx][flipd?1:0]; }
        function next() { fIdx = (fIdx+1)%cur.flash_cards.length; flipd=false; flip(); }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(FRONTEND_HTML));
app.listen(PORT, () => console.log('Scholar AI running on http://localhost:' + PORT));
