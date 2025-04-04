const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Define schemas
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  company: { type: String },
  role: { type: String, default: 'recruiter' },
  createdAt: { type: Date, default: Date.now }
});

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  skills: [{ type: String }],
  experienceLevel: { type: String },
  department: { type: String },
  location: { type: String },
  salary: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  resumeUrl: { type: String },
  resumeText: { type: String },
  skills: [{ type: String }],
  experience: { type: Number },
  education: [{ 
    degree: String, 
    institution: String, 
    year: Number 
  }],
  jobHistory: [{
    title: String,
    company: String,
    startDate: Date,
    endDate: Date,
    description: String
  }],
  createdAt: { type: Date, default: Date.now }
});

const ApplicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  matchScore: { type: Number },
  status: { type: String, default: 'new' }, // new, reviewed, interviewed, rejected, hired
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Define models
const User = mongoose.model('User', UserSchema);
const Job = mongoose.model('Job', JobSchema);
const Candidate = mongoose.model('Candidate', CandidateSchema);
const Application = mongoose.model('Application', ApplicationSchema);

// Configure file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Resume files only (PDF, DOC, DOCX, TXT)!');
    }
  }
});

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new Error();
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate' });
  }
};

// Extract text from resume
const extractTextFromResume = async (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  let text = '';
  
  try {
    if (extension === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      text = data.text;
    } else if (extension === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (extension === '.doc') {
      // For .doc files, we'd need more complex libraries
      // This is simplified for demo purposes
      text = "DOC file extraction would be implemented with appropriate library";
    } else if (extension === '.txt') {
      text = fs.readFileSync(filePath, 'utf8');
    }
    
    return text;
  } catch (error) {
    console.error('Error extracting text:', error);
    return '';
  }
};

// Function to parse resume without OpenAI
const parseResumeWithoutAI = (resumeText) => {
  try {
    // Simple rule-based parsing
    const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line);
    
    // Basic extraction logic
    const name = lines[0] || 'Unknown';
    
    // Find email with regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = resumeText.match(emailRegex);
    const email = emailMatch ? emailMatch[0] : '';
    
    // Find phone with regex
    const phoneRegex = /(\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/;
    const phoneMatch = resumeText.match(phoneRegex);
    const phone = phoneMatch ? phoneMatch[0] : '';
    
    // Extract skills (keywords after "SKILLS" heading)
    const skillsSection = resumeText.match(/SKILLS[:\s]+([\s\S]*?)(?:\n\n|\n[A-Z])/i);
    const skills = skillsSection 
      ? skillsSection[1].split(/[,;]|\n/).map(s => s.trim()).filter(s => s.length > 2 && s.length < 30)
      : ['JavaScript', 'Communication', 'Problem Solving']; // Default skills
    
    // Estimate experience from text
    const yearsRegex = /(\d+)[\s-]years?/i;
    const yearsMatch = resumeText.match(yearsRegex);
    const experience = yearsMatch ? parseInt(yearsMatch[1]) : 2; // Default to 2 years
    
    return {
      name,
      email,
      phone,
      skills,
      experience,
      education: [{ degree: 'Not specified', institution: 'Not specified', year: 2020 }],
      jobHistory: [{ title: 'Not specified', company: 'Not specified', dates: 'Not specified' }]
    };
  } catch (error) {
    console.error('Error in rule-based resume parsing:', error);
    return {
      name: 'Candidate',
      email: '',
      phone: '',
      skills: ['JavaScript', 'Communication', 'Problem Solving'],
      experience: 2,
      education: [{ degree: 'Not specified', institution: 'Not specified', year: 2020 }],
      jobHistory: [{ title: 'Not specified', company: 'Not specified', dates: 'Not specified' }]
    };
  }
};

// Calculate match score
const calculateMatchScore = (candidate, job) => {
  // Basic scoring algorithm
  let score = 0;
  const jobSkills = job.skills.map(skill => skill.toLowerCase());
  
  // Skills match
  const matchedSkills = candidate.skills.filter(skill => 
    jobSkills.includes(skill.toLowerCase())
  );
  
  score += (matchedSkills.length / jobSkills.length) * 70; // Skills worth 70%
  
  // Experience match
  const expMap = { 'entry': 0, 'mid': 3, 'senior': 6 };
  const requiredExp = expMap[job.experienceLevel] || 0;
  
  if (candidate.experience >= requiredExp) {
    if (candidate.experience <= requiredExp + 2) {
      score += 30; // Perfect experience match
    } else {
      score += 20; // Overqualified
    }
  } else {
    score += (candidate.experience / requiredExp) * 20; // Partial experience match
  }
  
  return Math.min(100, Math.round(score));
};

// ROUTES

// Authentication routes
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password, company, role } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      name,
      email,
      password,
      company,
      role
    });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();
    
    // Create JWT
    const payload = {
      id: user.id
    };
    
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    // Create JWT
    const payload = {
      id: user.id
    };
    
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

app.get('/api/users/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Job routes
app.post('/api/jobs', auth, async (req, res) => {
  try {
    const { title, description, skills, experienceLevel, department, location, salary } = req.body;
    
    const job = new Job({
      title,
      description,
      skills,
      experienceLevel,
      department,
      location,
      salary,
      createdBy: req.user.id
    });
    
    await job.save();
    res.json(job);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

app.get('/api/jobs', auth, async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

app.get('/api/jobs/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server error');
  }
});

// Resume upload and analysis
app.post('/api/resumes/upload', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    
    const resumeText = await extractTextFromResume(req.file.path);
    if (!resumeText) {
      return res.status(400).json({ msg: 'Could not extract text from resume' });
    }
    
    // Use rule-based parsing instead of AI
    const parsedResume = parseResumeWithoutAI(resumeText);
    if (!parsedResume) {
      return res.status(500).json({ msg: 'Failed to parse resume' });
    }
    
    // Create candidate
    const candidate = new Candidate({
      name: parsedResume.name,
      email: parsedResume.email,
      phone: parsedResume.phone,
      resumeUrl: req.file.path,
      resumeText,
      skills: parsedResume.skills,
      experience: parsedResume.experience,
      education: parsedResume.education,
      jobHistory: parsedResume.jobHistory
    });
    
    await candidate.save();
    
    res.json(candidate);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

app.post('/api/resumes/text', auth, async (req, res) => {
  try {
    const { resumeText } = req.body;
    
    if (!resumeText) {
      return res.status(400).json({ msg: 'No resume text provided' });
    }
    
    // Use rule-based parsing instead of AI
    const parsedResume = parseResumeWithoutAI(resumeText);
    if (!parsedResume) {
      return res.status(500).json({ msg: 'Failed to parse resume' });
    }
    
    // Create candidate
    const candidate = new Candidate({
      name: parsedResume.name,
      email: parsedResume.email,
      phone: parsedResume.phone,
      resumeText,
      skills: parsedResume.skills,
      experience: parsedResume.experience,
      education: parsedResume.education,
      jobHistory: parsedResume.jobHistory
    });
    
    await candidate.save();
    
    res.json(candidate);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Applications
app.post('/api/applications/match', auth, async (req, res) => {
  try {
    const { candidateId, jobId } = req.body;
    
    const candidate = await Candidate.findById(candidateId);
    const job = await Job.findById(jobId);
    
    if (!candidate || !job) {
      return res.status(404).json({ msg: 'Candidate or job not found' });
    }
    
    const matchScore = calculateMatchScore(candidate, job);
    
    // Create application
    const application = new Application({
      job: jobId,
      candidate: candidateId,
      matchScore
    });
    
    await application.save();
    
    res.json({ application, matchScore });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

app.get('/api/applications', auth, async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('job', 'title department location')
      .populate('candidate', 'name email skills experience')
      .sort({ createdAt: -1 });
      
    res.json(applications);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

app.get('/api/applications/job/:jobId', auth, async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate('candidate', 'name email skills experience')
      .sort({ matchScore: -1 });
      
    res.json(applications);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

app.patch('/api/applications/:id/status', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }
    
    application.status = status || application.status;
    application.notes = notes || application.notes;
    
    await application.save();
    res.json(application);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Analytics
app.get('/api/analytics/overview', auth, async (req, res) => {
  try {
    const totalCandidates = await Candidate.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();
    
    // Average match score
    const applications = await Application.find();
    const avgMatchScore = applications.length > 0 
      ? applications.reduce((sum, app) => sum + app.matchScore, 0) / applications.length 
      : 0;
    
    // Applications by status
    const statusCounts = {
      new: await Application.countDocuments({ status: 'new' }),
      reviewed: await Application.countDocuments({ status: 'reviewed' }),
      interviewed: await Application.countDocuments({ status: 'interviewed' }),
      rejected: await Application.countDocuments({ status: 'rejected' }),
      hired: await Application.countDocuments({ status: 'hired' })
    };
    
    // Top skills
    const candidates = await Candidate.find();
    const skillsCount = {};
    
    candidates.forEach(candidate => {
      candidate.skills.forEach(skill => {
        skillsCount[skill] = (skillsCount[skill] || 0) + 1;
      });
    });
    
    const topSkills = Object.entries(skillsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));
    
    res.json({
      totalCandidates,
      totalJobs,
      totalApplications,
      avgMatchScore,
      statusCounts,
      topSkills
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Integration endpoints
app.post('/api/integrations/ats-export', auth, async (req, res) => {
  try {
    const { applicationIds } = req.body;
    
    const applications = await Application.find({ _id: { $in: applicationIds } })
      .populate('job')
      .populate('candidate');
      
    // Format data for ATS export
    const exportData = applications.map(app => ({
      jobTitle: app.job.title,
      candidateName: app.candidate.name,
      candidateEmail: app.candidate.email,
      candidatePhone: app.candidate.phone,
      matchScore: app.matchScore,
      status: app.status,
      appliedDate: app.createdAt
    }));
    
    res.json(exportData);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

app.post('/api/integrations/calendar', auth, async (req, res) => {
  try {
    const { candidateId, scheduledTime, interviewType } = req.body;
    
    // In a real implementation, this would integrate with Google Calendar or similar
    // For demo purposes, we'll just return success
    
    res.json({ success: true, message: 'Interview scheduled (demo)' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

app.post('/api/integrations/email', auth, async (req, res) => {
  try {
    const { candidateId, templateType } = req.body;
    
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ msg: 'Candidate not found' });
    }
    
    // In a real implementation, this would send an email via SendGrid, Mailchimp, etc.
    // For demo purposes, we'll just return success
    
    res.json({ success: true, message: `Email would be sent to ${candidate.email} (demo)` });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 