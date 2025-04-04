document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const uploadArea = document.getElementById('uploadArea');
    const resumeList = document.getElementById('resumeList');
    const resumeText = document.getElementById('resumeText');
    const analyzeTextBtn = document.getElementById('analyzeText');
    const saveRequirementsBtn = document.getElementById('saveRequirements');
    const resultsSection = document.getElementById('resultsSection');
    const resultsList = document.getElementById('resultsList');
    const candidateModal = document.getElementById('candidateModal');
    const candidateDetails = document.getElementById('candidateDetails');
    const closeModal = document.querySelector('.close-modal');
    const sortResults = document.getElementById('sortResults');
    const searchResults = document.getElementById('searchResults');
    
    // State
    let resumes = [];
    let jobRequirements = {
        title: '',
        description: '',
        skills: [],
        experienceLevel: 'mid'
    };
    let candidates = [];
    
    // Initialize statistics
    updateStats();
    
    // Event Listeners
    browseBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', handleFileUpload);
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('highlight');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('highlight');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('highlight');
        
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    });
    
    analyzeTextBtn.addEventListener('click', () => {
        if (resumeText.value.trim() === '') {
            alert('Please paste a resume text to analyze');
            return;
        }
        
        analyzeResume(resumeText.value);
        resumeText.value = '';
    });
    
    saveRequirementsBtn.addEventListener('click', saveJobRequirements);
    
    sortResults.addEventListener('change', sortCandidates);
    
    searchResults.addEventListener('input', filterCandidates);
    
    closeModal.addEventListener('click', () => {
        candidateModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === candidateModal) {
            candidateModal.style.display = 'none';
        }
    });
    
    // Functions
    function handleFileUpload(e) {
        handleFiles(e.target.files);
        fileInput.value = ''; // Clear the input
    }
    
    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type === 'application/pdf' || 
                file.type === 'application/msword' || 
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.type === 'text/plain') {
                
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    // In a real application, this would use a proper parser for each file type
                    // For demo purposes, we'll just use the text content
                    const content = e.target.result;
                    analyzeResume(content, file.name);
                };
                
                if (file.type === 'text/plain') {
                    reader.readAsText(file);
                } else {
                    // In a real app, we'd use proper PDF/DOC parsing libraries
                    // For demo, just pretend we extracted text
                    simulateFileReading(file);
                }
            } else {
                alert(`File type not supported: ${file.type}`);
            }
        });
    }
    
    function simulateFileReading(file) {
        // This simulates PDF/DOC file reading since we can't actually parse these in this demo
        const fileItem = document.createElement('div');
        fileItem.className = 'resume-item';
        fileItem.innerHTML = `
            <div class="resume-item-name">
                <i class="fas fa-file-alt"></i>
                ${file.name} (Processing...)
            </div>
        `;
        resumeList.appendChild(fileItem);
        
        // Simulate processing delay
        setTimeout(() => {
            // Remove the processing item
            resumeList.removeChild(fileItem);
            
            // Generate fake resume content based on filename
            let resumeContent = generateFakeResumeContent(file.name);
            analyzeResume(resumeContent, file.name);
        }, 1500);
    }
    
    function generateFakeResumeContent(filename) {
        // This generates fake resume content for demonstration purposes
        const skills = [
            'JavaScript', 'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 
            'Python', 'Django', 'Flask', 'Java', 'Spring', 'C#', '.NET',
            'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Azure', 'Docker', 'Kubernetes',
            'HTML', 'CSS', 'SASS', 'UI/UX Design', 'Figma', 'Sketch', 'Adobe XD',
            'Git', 'CI/CD', 'Jenkins', 'Agile', 'Scrum', 'Product Management'
        ];
        
        const companies = [
            'Google', 'Microsoft', 'Amazon', 'Apple', 'Facebook', 'Twitter',
            'Netflix', 'Uber', 'Airbnb', 'Stripe', 'Square', 'Shopify',
            'IBM', 'Oracle', 'Salesforce', 'Adobe', 'Intel', 'Cisco',
            'TechStartup Inc.', 'InnovateNow', 'CodeMasters', 'DevPro Solutions'
        ];
        
        const universities = [
            'Stanford University', 'MIT', 'Harvard', 'UC Berkeley', 'Carnegie Mellon',
            'University of Washington', 'Georgia Tech', 'University of Texas',
            'University of Michigan', 'University of Illinois', 'Cornell University'
        ];
        
        const positions = [
            'Software Engineer', 'Frontend Developer', 'Backend Developer', 
            'Full Stack Developer', 'Mobile Developer', 'DevOps Engineer',
            'Data Scientist', 'Machine Learning Engineer', 'Product Manager',
            'UX Designer', 'UI Developer', 'QA Engineer', 'Project Manager'
        ];
        
        // Get name from filename (assuming format like "John_Doe_Resume.pdf")
        let name = filename.split('.')[0].replace(/_/g, ' ').replace('Resume', '').trim();
        if (!name || name.length < 5) {
            name = 'John Doe'; // Default name if we can't extract
        }
        
        // Randomly select skills, experiences, education
        const randomSkills = getRandomItems(skills, 8);
        const randomExperience = [];
        for (let i = 0; i < 3; i++) {
            randomExperience.push({
                position: getRandomItems(positions, 1)[0],
                company: getRandomItems(companies, 1)[0],
                duration: `${2018 - i * 2}-${2020 - i * 2}`
            });
        }
        
        const education = {
            degree: Math.random() > 0.7 ? "Master's in Computer Science" : "Bachelor's in Computer Science",
            university: getRandomItems(universities, 1)[0],
            year: 2014 + Math.floor(Math.random() * 5)
        };
        
        // Generate the content
        let content = `
            ${name}
            Email: ${name.toLowerCase().replace(' ', '.')}@example.com
            Phone: (555) 123-4567
            
            SKILLS
            ${randomSkills.join(', ')}
            
            WORK EXPERIENCE
            ${randomExperience.map(exp => 
                `${exp.position} at ${exp.company} (${exp.duration})`).join('\n')}
            
            EDUCATION
            ${education.degree} - ${education.university} (${education.year})
        `;
        
        return content;
    }
    
    function getRandomItems(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    function analyzeResume(content, filename = 'Pasted Resume') {
        if (!jobRequirements.skills.length) {
            if (!confirm('Job requirements not set. Do you want to continue with default requirements?')) {
                return;
            }
            setDefaultRequirements();
        }
        
        // Add to resume list
        const resumeItem = document.createElement('div');
        resumeItem.className = 'resume-item';
        resumeItem.innerHTML = `
            <div class="resume-item-name">
                <i class="fas fa-file-alt"></i>
                ${filename}
            </div>
            <div class="resume-item-actions">
                <button><i class="fas fa-trash"></i></button>
            </div>
        `;
        resumeList.appendChild(resumeItem);
        
        // Delete button functionality
        const deleteBtn = resumeItem.querySelector('button');
        deleteBtn.addEventListener('click', () => {
            resumeList.removeChild(resumeItem);
        });
        
        // Simulate AI analysis
        analyzeResumeWithAI(content, filename);
    }
    
    function analyzeResumeWithAI(content, filename) {
        // This simulates AI analysis of the resume
        // In a real application, this would call an API
        
        const name = filename.split('.')[0].replace(/_/g, ' ').replace('Resume', '').trim();
        
        // Extract skills from content
        const candidateSkills = [];
        jobRequirements.skills.forEach(skill => {
            if (content.toLowerCase().includes(skill.toLowerCase())) {
                candidateSkills.push(skill);
            }
        });
        
        // Add some random skills
        const extraSkills = ['Team Leadership', 'Problem Solving', 'Communication', 'Creativity', 'Adaptability'];
        for (let i = 0; i < 3; i++) {
            const randomSkill = extraSkills[Math.floor(Math.random() * extraSkills.length)];
            if (!candidateSkills.includes(randomSkill)) {
                candidateSkills.push(randomSkill);
            }
        }
        
        // Calculate match score
        const matchScore = Math.min(100, Math.round((candidateSkills.length / jobRequirements.skills.length) * 80 + Math.random() * 20));
        
        // Create candidate object
        const candidate = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: name || 'Candidate',
            skills: candidateSkills,
            resumeContent: content,
            matchScore,
            date: new Date().toISOString(),
            experience: Math.floor(Math.random() * 10) + 1 // Random years of experience
        };
        
        // Add to candidates list
        candidates.push(candidate);
        
        // Update stats
        updateStats();
        
        // Render results
        renderResults();
    }
    
    function saveJobRequirements() {
        const jobTitle = document.getElementById('jobTitle').value.trim();
        const jobDescription = document.getElementById('jobDescription').value.trim();
        const requiredSkills = document.getElementById('requiredSkills').value.trim();
        const experienceLevel = document.getElementById('experienceLevel').value;
        
        if (!jobTitle || !requiredSkills) {
            alert('Please fill in job title and required skills');
            return;
        }
        
        jobRequirements = {
            title: jobTitle,
            description: jobDescription,
            skills: requiredSkills.split(',').map(s => s.trim()),
            experienceLevel
        };
        
        alert('Job requirements saved!');
    }
    
    function setDefaultRequirements() {
        jobRequirements = {
            title: 'Frontend Developer',
            description: 'We are looking for a skilled Frontend Developer to join our team.',
            skills: ['JavaScript', 'React', 'HTML', 'CSS', 'Git', 'Responsive Design'],
            experienceLevel: 'mid'
        };
        
        // Update form fields
        document.getElementById('jobTitle').value = jobRequirements.title;
        document.getElementById('jobDescription').value = jobRequirements.description;
        document.getElementById('requiredSkills').value = jobRequirements.skills.join(', ');
        document.getElementById('experienceLevel').value = jobRequirements.experienceLevel;
    }
    
    function renderResults() {
        if (candidates.length === 0) return;
        
        resultsSection.style.display = 'block';
        resultsList.innerHTML = '';
        
        candidates.forEach(candidate => {
            const candidateCard = document.createElement('div');
            candidateCard.className = 'candidate-card';
            candidateCard.dataset.id = candidate.id;
            
            // Determine score color
            let scoreClass = '';
            if (candidate.matchScore >= 80) {
                scoreClass = 'high-match';
            } else if (candidate.matchScore >= 60) {
                scoreClass = 'medium-match';
            } else {
                scoreClass = 'low-match';
            }
            
            candidateCard.innerHTML = `
                <div class="candidate-header">
                    <div class="candidate-name">${candidate.name}</div>
                    <div class="match-score ${scoreClass}">${candidate.matchScore}%</div>
                </div>
                <div class="candidate-skills">
                    ${candidate.skills.slice(0, 4).map(skill => {
                        const isMatching = jobRequirements.skills.some(s => 
                            s.toLowerCase() === skill.toLowerCase());
                        return `<span class="skill-tag ${isMatching ? 'matching-skill' : ''}">${skill}</span>`;
                    }).join('')}
                    ${candidate.skills.length > 4 ? `<span class="skill-tag">+${candidate.skills.length - 4} more</span>` : ''}
                </div>
                <div class="candidate-footer">
                    <div class="experience">${candidate.experience} years exp.</div>
                    <div class="date">${new Date(candidate.date).toLocaleDateString()}</div>
                </div>
            `;
            
            candidateCard.addEventListener('click', () => showCandidateDetails(candidate));
            
            resultsList.appendChild(candidateCard);
        });
    }
    
    function showCandidateDetails(candidate) {
        candidateDetails.innerHTML = `
            <h2>${candidate.name}</h2>
            <div class="score-badge ${candidate.matchScore >= 80 ? 'high-match' : candidate.matchScore >= 60 ? 'medium-match' : 'low-match'}">
                ${candidate.matchScore}% Match
            </div>
            
            <div class="detail-section">
                <h3>Skills Analysis</h3>
                <div class="skills-match">
                    <div class="match-analysis-item">
                        <div class="match-label">Overall Skills Match</div>
                        <div class="match-bar">
                            <div class="match-bar-fill" style="width: ${candidate.matchScore}%"></div>
                        </div>
                    </div>
                    
                    <div class="matched-skills">
                        <h4>Matched Skills (${candidate.skills.filter(skill => 
                            jobRequirements.skills.some(s => s.toLowerCase() === skill.toLowerCase())).length} of ${jobRequirements.skills.length})</h4>
                        <div class="skill-tags">
                            ${candidate.skills.map(skill => {
                                const isMatching = jobRequirements.skills.some(s => s.toLowerCase() === skill.toLowerCase());
                                return isMatching ? `<span class="skill-tag matching-skill">${skill}</span>` : '';
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="missing-skills">
                        <h4>Missing Skills</h4>
                        <div class="skill-tags">
                            ${jobRequirements.skills.filter(skill => 
                                !candidate.skills.some(s => s.toLowerCase() === skill.toLowerCase()))
                                .map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Resume Content</h3>
                <pre class="resume-content">${candidate.resumeContent}</pre>
            </div>
            
            <div class="detail-section">
                <h3>AI Recommendation</h3>
                <div class="ai-recommendation">
                    <p>${generateAIRecommendation(candidate)}</p>
                </div>
            </div>
            
            <button class="primary-btn">Contact Candidate</button>
        `;
        
        candidateModal.style.display = 'block';
    }
    
    function generateAIRecommendation(candidate) {
        if (candidate.matchScore >= 85) {
            return `<strong>Excellent match!</strong> This candidate has most of the required skills and experience for the ${jobRequirements.title} position. Recommended for immediate interview.`;
        } else if (candidate.matchScore >= 70) {
            return `<strong>Good match.</strong> This candidate has many of the required skills for the ${jobRequirements.title} position, but may need training in some areas. Consider for interview.`;
        } else if (candidate.matchScore >= 50) {
            return `<strong>Potential match.</strong> This candidate has some of the required skills for the ${jobRequirements.title} position. May be suitable if no better candidates are available.`;
        } else {
            return `<strong>Low match.</strong> This candidate lacks many of the key skills required for the ${jobRequirements.title} position. Not recommended for interview at this time.`;
        }
    }
    
    function sortCandidates() {
        const sortBy = sortResults.value;
        
        switch (sortBy) {
            case 'score':
                candidates.sort((a, b) => b.matchScore - a.matchScore);
                break;
            case 'name':
                candidates.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'date':
                candidates.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
        }
        
        renderResults();
    }
    
    function filterCandidates() {
        const searchTerm = searchResults.value.toLowerCase();
        const candidateCards = document.querySelectorAll('.candidate-card');
        
        candidateCards.forEach(card => {
            const candidateName = card.querySelector('.candidate-name').textContent.toLowerCase();
            const candidateSkills = Array.from(card.querySelectorAll('.skill-tag')).map(tag => tag.textContent.toLowerCase());
            
            if (candidateName.includes(searchTerm) || candidateSkills.some(skill => skill.includes(searchTerm))) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    function updateStats() {
        document.getElementById('resumeCount').textContent = candidates.length;
        
        const qualifiedCount = candidates.filter(c => c.matchScore >= 70).length;
        document.getElementById('qualifiedCount').textContent = qualifiedCount;
        
        // Assume 30 minutes saved per resume
        const timeSaved = Math.round(candidates.length * 0.5 * 10) / 10;
        document.getElementById('timeSaved').textContent = `${timeSaved} hrs`;
    }
}); 