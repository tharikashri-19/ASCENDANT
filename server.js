import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for parsing JSON requests
app.use(express.json());

// Enable Cross-Origin Resource Sharing (CORS)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ── 1. Backend Service Health & System Info ──────────────────────────────────
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'ASCENDANT Academic Node.js Backend Service',
    version: '2.0.0',
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// ── 2. Academic Logic: Calculate Semester SGPA ───────────────────────────────
app.post('/api/academic/calculate-sgpa', (req, res) => {
  try {
    const { courses } = req.body; // Array of { name, credits, gradePoint }

    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ error: 'Courses array is required with credits and grade points.' });
    }

    let totalCredits = 0;
    let weightedPoints = 0;

    courses.forEach(c => {
      const credits = parseFloat(c.credits) || 0;
      const gp = parseFloat(c.gradePoint) || 0;
      totalCredits += credits;
      weightedPoints += (credits * gp);
    });

    const sgpa = totalCredits > 0 ? parseFloat((weightedPoints / totalCredits).toFixed(2)) : 0;

    let classification = 'Pass';
    if (sgpa >= 9.0) classification = 'Outstanding / Distinction';
    else if (sgpa >= 7.5) classification = 'First Class with Distinction';
    else if (sgpa >= 6.0) classification = 'First Class';

    return res.json({
      success: true,
      totalCredits,
      totalPoints: parseFloat(weightedPoints.toFixed(2)),
      sgpa,
      classification
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal calculation error', detail: error.message });
  }
});

// ── 3. Academic Logic: Cumulative CGPA Calculation ───────────────────────────
app.post('/api/academic/calculate-cgpa', (req, res) => {
  try {
    const { semesters } = req.body; // Array of { number, sgpa, credits }

    if (!Array.isArray(semesters) || semesters.length === 0) {
      return res.status(400).json({ error: 'Semesters array is required.' });
    }

    let totalCredits = 0;
    let weightedScore = 0;

    semesters.forEach(s => {
      const cred = parseFloat(s.credits) || 20; // default 20 credits per semester
      const sgpa = parseFloat(s.sgpa) || 0;
      totalCredits += cred;
      weightedScore += (cred * sgpa);
    });

    const cgpa = totalCredits > 0 ? parseFloat((weightedScore / totalCredits).toFixed(2)) : 0;

    return res.json({
      success: true,
      totalSemestersEvaluated: semesters.length,
      totalCreditsAccumulated: totalCredits,
      cgpa
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal CGPA calculation error', detail: error.message });
  }
});

// ── 4. Attendance Logic: Safe Bunk & Recovery Margin ──────────────────────────
app.post('/api/academic/attendance-margin', (req, res) => {
  try {
    const { present, total, requiredPercentage = 75 } = req.body;

    const p = parseInt(present, 10) || 0;
    const t = parseInt(total, 10) || 0;
    const reqPct = parseFloat(requiredPercentage) || 75;

    if (t === 0) {
      return res.json({
        percentage: 0,
        status: 'No logs yet',
        safeSkips: 0,
        recoveryNeeded: 0
      });
    }

    const currentPct = parseFloat(((p / t) * 100).toFixed(1));
    const targetFrac = reqPct / 100;

    let safeSkips = 0;
    let recoveryNeeded = 0;

    if (currentPct >= reqPct) {
      safeSkips = Math.floor((p - targetFrac * t) / targetFrac);
      if (safeSkips < 0) safeSkips = 0;
    } else {
      recoveryNeeded = Math.ceil((targetFrac * t - p) / (1 - targetFrac));
      if (recoveryNeeded < 0) recoveryNeeded = 0;
    }

    return res.json({
      success: true,
      presentHours: p,
      totalHours: t,
      currentPercentage: currentPct,
      requiredPercentage: reqPct,
      isCompliant: currentPct >= reqPct,
      safeSkips,
      recoveryNeeded
    });
  } catch (error) {
    return res.status(500).json({ error: 'Attendance calculation error', detail: error.message });
  }
});

// ── 5. Target Prediction: Required GPA for Future Semesters ──────────────────
app.post('/api/academic/target-prediction', (req, res) => {
  try {
    const { currentCgpa, currentSemester, targetCgpa, totalSemesters = 8 } = req.body;

    const curCgpa = parseFloat(currentCgpa) || 0;
    const curSem = parseInt(currentSemester, 10) || 1;
    const tgtCgpa = parseFloat(targetCgpa) || 0;
    const totalSem = parseInt(totalSemesters, 10) || 8;

    const completedSems = curSem - 1;
    const remainingSems = totalSem - completedSems;

    if (remainingSems <= 0) {
      return res.json({
        achievable: false,
        message: 'All semesters have already been completed.'
      });
    }

    const requiredTotalPoints = tgtCgpa * totalSem;
    const earnedPoints = curCgpa * completedSems;
    const remainingPointsNeeded = requiredTotalPoints - earnedPoints;
    const requiredSgpa = parseFloat((remainingPointsNeeded / remainingSems).toFixed(2));

    const achievable = requiredSgpa <= 10.0 && requiredSgpa >= 0;

    return res.json({
      success: true,
      currentCgpa: curCgpa,
      targetCgpa: tgtCgpa,
      remainingSemesters: remainingSems,
      requiredSgpaPerRemainingSemester: requiredSgpa,
      isAchievable: achievable,
      message: achievable
        ? `You need an average SGPA of ${requiredSgpa} in each remaining semester.`
        : `Target mathematically requires an SGPA of ${requiredSgpa}, which exceeds the 10.0 scale.`
    });
  } catch (error) {
    return res.status(500).json({ error: 'Target prediction error', detail: error.message });
  }
});

// Serve static frontend build files when in production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Node.js Express Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 ASCENDANT Node.js Backend Server running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📊 Health Endpoint: http://localhost:${PORT}/api/status`);
  console.log(`🎓 Academic Calculations: http://localhost:${PORT}/api/academic/...`);
  console.log(`==================================================\n`);
});
