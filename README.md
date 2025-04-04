# Enterprise AI Resume Screener

A production-ready AI-powered resume screening system for enterprise HR departments and recruitment agencies.

## Features

### HR and Recruitment Features
- **Rule-Based Resume Parsing**: Extract candidate data from PDF, DOCX, DOC, TXT formats
- **Smart Skill Matching**: Match candidate skills to job requirements
- **ATS Integration**: Export data to existing Applicant Tracking Systems
- **Candidate Pipeline**: Track candidates through hiring stages
- **Calendar Integration**: Schedule interviews directly from the platform
- **Multi-user Support**: Role-based access for team collaboration

### Technical Features
- **Full Stack**: React frontend with Node.js/Express backend
- **Rule-Based Parsing**: Text analysis using regex patterns (no API key needed)
- **MongoDB Database**: Secure data storage
- **JWT Authentication**: Secure user management
- **Analytics Dashboard**: Recruitment metrics and insights

## System Requirements

- Node.js (v14+)
- MongoDB

## Installation

1. Clone the repository
```
git clone https://github.com/yourusername/enterprise-ai-resume-screener.git
```

2. Install dependencies
```
npm install
cd client && npm install
```

3. Configure environment variables
```
# Create .env file with:
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
# No OpenAI API key required!
```

4. Start development server
```
npm run dev:full
```

## Security Features

- Password hashing with bcrypt
- JWT authentication
- Secure file uploads
- Input validation
- RBAC (Role-Based Access Control)

## Enterprise Integration

The system provides integration with:
- ATS platforms
- Email services
- Calendar services
- Analytics tools

## License

MIT License 