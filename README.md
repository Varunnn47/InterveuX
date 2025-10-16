# 🧠 InterveuX-AI

> **InterveuX-AI** is an intelligent interview preparation platform that analyzes resumes using **Azure AI Foundry**, predicts **suitable job roles**, and conducts **AI-driven mock interviews** — all powered by **Machine Learning** and **Natural Language Processing (NLP)**.

---

![Tech Stack](https://img.shields.io/badge/Frontend-React.js-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js-green)
![Database](https://img.shields.io/badge/Database-MongoDB-brightgreen)
![AI](https://img.shields.io/badge/AI-Azure%20AI%20Foundry-blueviolet)
![Language](https://img.shields.io/badge/Language-JavaScript-yellow)
![License](https://img.shields.io/badge/License-MIT-orange)

---

## 🚀 Features

- 📄 **Smart Resume Analysis** — Extracts and understands candidate skills, education, and experience.  
- 💼 **Job Role Prediction** — Suggests the most relevant job positions using ML.  
- 💻 **Conditional Coding Round** — Automatically launches a coding round if the candidate has technical skills.  
- 🗣️ **Personalized Mock Interview** — Generates dynamic, skill-based interview questions.  
- 🔗 **Azure AI Foundry Integration** — Powers NLP-based resume analysis and question generation.  
- ⚡ **Modern UI** — Built with React and Tailwind CSS for a smooth, responsive user experience.

---

## 🧩 Tech Stack

| Layer | Technology |
|--------|-------------|
| **Frontend** | React.js, Axios, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (via Mongoose ORM) |
| **AI/ML** | Azure AI Foundry (for Resume Analysis & Question Generation) |
| **Resume Parsing** | pdf-parse / mammoth.js |
| **Communication** | REST APIs with Axios |

---

## 🧠 Machine Learning Role

Machine Learning (through **Azure AI Foundry**) powers the system’s intelligence and adaptability.

### 🧾 ML-driven Processes:
- **Resume Understanding:** Extracts key information like skills, experience, and education.  
- **Job Role Prediction:** Suggests relevant job titles using classification models.  
- **Decision Logic:**  
  - If the resume shows technical skills → **Coding Round → Mock Interview**  
  - If non-technical → **Direct Mock Interview**  
- **Personalized Interview Generation:** Generates context-aware interview questions related to the user’s resume.

---

## 🧾 Resume Validation Format

| Validation Type | Rule |
|------------------|------|
| **File Type** | `.pdf` or `.docx` only |
| **File Size** | 10 KB – 5 MB |
| **Text Length** | Minimum 200 characters |
| **Content Sections** | Must include at least 3 of: Skills, Education, Experience, Projects, or Personal Info |
| **AI Output Validation** | Must contain: `skills`, `jobRoles`, `summary` |

✅ This ensures only **valid, high-quality resumes** are processed by the ML model.

---

## 🧭 System Architecture

```text
                   ┌──────────────────────────────┐
                   │          Frontend             │
                   │   React.js + Tailwind + Axios │
                   └──────────────┬───────────────┘
                                  │
                                  ▼
                   ┌──────────────────────────────┐
                   │          Backend              │
                   │   Node.js + Express + MongoDB │
                   └──────────────┬───────────────┘
                                  │
                                  ▼
                   ┌──────────────────────────────┐
                   │        Azure AI Foundry       │
                   │ Resume Analysis + NLP Models  │
                   └──────────────┬───────────────┘
                                  │
                                  ▼
                   ┌──────────────────────────────┐
                   │     Result & Interview Flow   │
                   │ Job Role → Coding → Mock Int. │
                   └──────────────────────────────┘



