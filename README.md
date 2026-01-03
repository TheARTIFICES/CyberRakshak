# CyberRakshak

A comprehensive cybersecurity vulnerability scanning and analysis platform built with modern web technologies.

## Overview

CyberRakshak is a centralized vulnerability detection system that integrates multiple security scanning tools to provide comprehensive security assessments. The platform combines the power of various open-source security tools with an intuitive web interface for easy vulnerability management.

## Features

- **Multi-Scanner Integration**: Supports Nmap, Nuclei, Nikto, OWASP ZAP, Wappalyzer, Metasploit, and OpenVAS
- **Real-time Scanning**: Live progress tracking and log streaming during scans
- **Vulnerability Intelligence**: CVE enrichment with CISA KEV database and exploit information
- **Attack Path Visualization**: Interactive graph visualization of potential attack paths
- **Reporting**: PDF report generation for scan results
- **Dashboard**: Comprehensive overview of security metrics and findings
- **AI Assistant**: Cybersecurity chat assistant for analysis and recommendations

## Architecture

The system follows a microservices architecture with:

- **Frontend**: React with TypeScript, TailwindCSS for styling
- **Backend**: FastAPI with Python for REST API
- **Task Queue**: Celery with RabbitMQ for distributed task processing
- **Database**: PostgreSQL for data persistence
- **Containerization**: Docker for consistent deployment across environments

### Backend Components

1. **API Server**: FastAPI application serving REST endpoints
2. **Worker Service**: Celery workers executing security scans
3. **Database**: PostgreSQL for storing scan results and metadata
4. **Message Broker**: RabbitMQ for task queue management

### Security Scanners

- **Nmap**: Network discovery and port scanning
- **Nuclei**: Vulnerability scanning based on templates
- **Nikto**: Web server scanning
- **OWASP ZAP**: Web application security testing
- **Wappalyzer**: Technology fingerprinting
- **Metasploit**: Exploitation framework integration
- **OpenVAS**: Comprehensive vulnerability scanning

## Prerequisites

- Docker and Docker Compose
- Node.js (for frontend development)
- Python 3.8+ (for local development)

## Quick Start

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd CyberRakshak
   ```

2. Start the services using Docker Compose:
   ```bash
   cd backend
   docker-compose up -d
   ```

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - RabbitMQ Management: http://localhost:15672

## Project Structure

```
CyberRakshak/
├── ai_service/                    # GPU AI Service (Kaggle)
│   ├── kaggle_brain.py            # Main inference server
│   ├── enrich_metadata.py         # RAG metadata enrichment
│   ├── cve_parser.py              # CVE RAG builder
│   ├── nuclei_parser.py           # Nuclei templates RAG builder
│   ├── exploitdb_parser.py        # ExploitDB RAG builder
│   ├── mitre_parser.py            # MITRE ATT&CK RAG builder
│   ├── metasploit_parser.py       # Metasploit RAG builder
│   ├── gtfobins_parser.py         # GTFOBins RAG builder
│   ├── peass_parser.py            # LinPEAS RAG builder
│   ├── owasp_parser.py            # OWASP Cheat Sheets RAG builder
│   ├── nmap_nse_parser.py         # Nmap NSE scripts RAG builder
│   ├── http_header_parser.py      # HTTP Headers RAG builder
│   └── PayloadsAllTheThings_parser.py  # Payloads RAG builder
├── backend/
│   ├── app/
│   │   ├── api.py                 # API endpoints
│   │   ├── models.py              # Database models
│   │   ├── database.py            # Database configuration
│   │   ├── chat_assistant.py      # AI Chat service
│   │   ├── intent_classifier.py   # Query intent classification
│   │   ├── rag_registry.py        # RAG index management
│   │   ├── rag_routing.py         # Intent-based RAG routing
│   │   ├── rag_fusion.py          # Multi-source RAG fusion
│   │   ├── worker/                # Celery worker tasks
│   │   └── utils/                 # Utility functions
│   ├── rag_storage/               # FAISS indexes & metadata (gitignored)
│   ├── rag_backup/                # RAG data backups (gitignored)
│   ├── docker-compose.yml         # Docker services configuration
│   ├── Dockerfile.api             # API service Dockerfile
│   ├── Dockerfile.worker          # Worker service Dockerfile
│   └── requirements.txt           # Python dependencies
├── Frontend/
│   ├── src/
│   │   ├── components/            # React components
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API service layer
│   │   ├── layouts/               # Layout components
│   │   └── App.tsx                # Main application component
│   ├── package.json               # Node.js dependencies
│   └── vite.config.ts             # Vite configuration
├── nginx/                         # Nginx reverse proxy config
├── docker-compose.yml             # Root Docker Compose
└── README.md
```

## Development Setup

### Backend Development

1. Create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables (copy .env.example to .env and configure)

4. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Development

1. Install dependencies:
   ```bash
   cd Frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## Configuration

### Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/database
RABBITMQ_URL=amqp://user:password@localhost:5672//
```

## API Documentation

The backend API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all the open-source security tools that make this project possible
- Special recognition to the cybersecurity community for their continuous contributions