import { useState } from 'react'
import AssignmentSelector from './components/AssignmentSelector'

// Simple markdown formatter
function formatMarkdown(text) {
  if (!text) return ''
  
  // Split into lines
  const lines = text.split('\n')
  const result = []
  let inList = false
  let listItems = []
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    const trimmed = line.trim()
    
    // Check for headers
    if (trimmed.startsWith('### ')) {
      if (inList) {
        result.push(`<ul>${listItems.join('')}</ul>`)
        listItems = []
        inList = false
      }
      result.push(`<h3>${escapeHtml(trimmed.substring(4))}</h3>`)
      continue
    }
    if (trimmed.startsWith('## ')) {
      if (inList) {
        result.push(`<ul>${listItems.join('')}</ul>`)
        listItems = []
        inList = false
      }
      result.push(`<h2>${escapeHtml(trimmed.substring(3))}</h2>`)
      continue
    }
    if (trimmed.startsWith('# ')) {
      if (inList) {
        result.push(`<ul>${listItems.join('')}</ul>`)
        listItems = []
        inList = false
      }
      result.push(`<h1>${escapeHtml(trimmed.substring(2))}</h1>`)
      continue
    }
    
    // Check for list items (bullet points or numbered)
    const listMatch = trimmed.match(/^[\*\-\d]\.?\s+(.+)$/)
    if (listMatch) {
      if (!inList) {
        inList = true
        listItems = []
      }
      const itemText = formatInlineMarkdown(listMatch[1])
      listItems.push(`<li>${itemText}</li>`)
      continue
    }
    
    // Not a list item
    if (inList) {
      result.push(`<ul>${listItems.join('')}</ul>`)
      listItems = []
      inList = false
    }
    
    // Regular paragraph
    if (trimmed) {
      result.push(`<p>${formatInlineMarkdown(trimmed)}</p>`)
    } else {
      result.push('<br>')
    }
  }
  
  // Close any remaining list
  if (inList && listItems.length > 0) {
    result.push(`<ul>${listItems.join('')}</ul>`)
  }
  
  return result.join('')
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatInlineMarkdown(text) {
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Italic (but not if part of bold)
  text = text.replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
  return text
}

function App() {
  const defaultPromptTemplate = `# SYSTEM PROMPT: Feedback Co-Pilot (версія з урахуванням реального стилю)

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

{{task}}

### STUDENT WORK:

{{content}}

---

Створи фідбек за структурою: Вступ → Context → Strengths → Improvements → Next Steps.

Використовуй українську мову.`

  const [file, setFile] = useState(null)
  const [googleDocsLink, setGoogleDocsLink] = useState('')
  const [assignmentText, setAssignmentText] = useState('')
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null)
  const [customPrompt, setCustomPrompt] = useState(defaultPromptTemplate)
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [feedback, setFeedback] = useState('')
  const [editedFeedback, setEditedFeedback] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setGoogleDocsLink('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setLoadingStep('')
    setError('')
    setFeedback('')

    try {
      let content = ''
      let contentType = null

      // If file is uploaded, process it first
      if (file) {
        setLoadingStep('Uploading and processing file...')
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }))
          throw new Error(errorData.error || 'Failed to upload file')
        }

        const uploadData = await uploadResponse.json()
        content = uploadData.content
        
        // Determine content type from file
        const fileName = file.name.toLowerCase()
        if (fileName.endsWith('.pdf')) {
          contentType = 'pdf'
        } else if (['.png', '.jpg', '.jpeg'].some(ext => fileName.endsWith(ext))) {
          contentType = 'image'
        }
      } else if (googleDocsLink) {
        // For Google Docs link, pass it directly - server will fetch the content
        setLoadingStep('Fetching Google Docs content...')
        content = googleDocsLink
        
        // Determine if it's Docs or Slides
        if (googleDocsLink.includes('/presentation/')) {
          contentType = 'google-slides'
        } else if (googleDocsLink.includes('/document/')) {
          contentType = 'google-docs'
        }
      } else {
        throw new Error('Please provide either a file or Google Docs link')
      }

      // Validate required fields
      if (!assignmentText.trim()) {
        throw new Error('Assignment text is required')
      }

      // Send to analyze endpoint
      setLoadingStep('Generating feedback with AI...')
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: assignmentText,
          content: content,
          contentType: contentType,
          customPrompt: useCustomPrompt && customPrompt.trim() ? customPrompt : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      const newFeedback = data.feedback || ''
      setFeedback(newFeedback)
      setEditedFeedback(newFeedback)
      setIsEditing(false)
    } catch (err) {
      setError(err.message || 'Failed to generate feedback')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.statusIndicator}></div>
        <h1 style={styles.title}>Feedback Co-Pilot</h1>
      </div>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.card}>
          <div style={styles.cardIcon}>📄</div>
          <div style={styles.cardContent}>
            <label style={styles.label}>
              Upload File (PDF, PNG, JPG)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              disabled={loading || !!googleDocsLink}
              style={styles.fileInput}
            />
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>🔗</div>
          <div style={styles.cardContent}>
            <label style={styles.label}>
              Google Docs or Slides Link
            </label>
            <input
              type="text"
              value={googleDocsLink}
              onChange={(e) => {
                setGoogleDocsLink(e.target.value)
                if (e.target.value) {
                  setFile(null)
                }
              }}
              placeholder="https://docs.google.com/document/... or https://docs.google.com/presentation/..."
              disabled={loading || !!file}
              style={styles.textInput}
            />
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>📚</div>
          <div style={styles.cardContent}>
            <AssignmentSelector
              value={selectedAssignmentId}
              onChange={(assignment) => {
                if (assignment) {
                  setSelectedAssignmentId(assignment.id);
                  setAssignmentText(assignment.details);
                } else {
                  setSelectedAssignmentId(null);
                }
              }}
              disabled={loading}
            />
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>📝</div>
          <div style={styles.cardContent}>
            <label style={styles.label}>
              Assignment text
            </label>
            <textarea
              value={assignmentText}
              onChange={(e) => setAssignmentText(e.target.value)}
              rows={8}
              disabled={loading}
              style={styles.textarea}
              placeholder="Enter the assignment description or select from Airtable above..."
            />
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardIcon}>⚙️</div>
          <div style={styles.cardContent}>
            <label style={styles.label}>
              <input
                type="checkbox"
                checked={useCustomPrompt}
                onChange={(e) => setUseCustomPrompt(e.target.checked)}
                disabled={loading}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              Use custom prompt (optional)
            </label>
            {useCustomPrompt && (
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={12}
                disabled={loading}
                style={styles.textarea}
                placeholder={`Enter custom prompt. Use {{task}}, {{criteria}}, and {{content}} as placeholders.

Example:
You are Feedback Co-Pilot — an assistant for course curators.

Your task: analyze a student's work and produce professional structured feedback.

### Inputs:

- ASSIGNMENT:
{{task}}

- EVALUATION CRITERIA:
{{criteria}}

- STUDENT WORK:
{{content}}

### Your Output Format (MUST FOLLOW EXACTLY):

**Context**
...

**Strengths**
...

**Improvements**
...

**Next Steps**
...`}
              />
            )}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={loading ? styles.buttonDisabled : styles.button}
        >
          {loading ? 'Generating feedback...' : 'Generate feedback'}
        </button>
      </form>

      {loading && (
        <div style={styles.loadingCard}>
          <div style={styles.loadingText}>Loading...</div>
          {loadingStep && <div style={styles.loadingStep}>{loadingStep}</div>}
        </div>
      )}

      {error && (
        <div style={styles.errorCard}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {feedback && (
        <div style={styles.feedbackCard}>
          <div style={styles.feedbackHeader}>
            <h2 style={styles.feedbackTitle}>Feedback:</h2>
            <div style={styles.feedbackActions}>
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={styles.editButton}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(editedFeedback || feedback)
                      alert('Feedback copied to clipboard!')
                    }}
                    style={styles.copyButton}
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([editedFeedback || feedback], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `feedback-${new Date().toISOString().split('T')[0]}.txt`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                    style={styles.downloadButton}
                  >
                    💾 Download
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setFeedback(editedFeedback)
                      setIsEditing(false)
                    }}
                    style={styles.saveButton}
                  >
                    💾 Save
                  </button>
                  <button
                    onClick={() => {
                      setEditedFeedback(feedback)
                      setIsEditing(false)
                    }}
                    style={styles.cancelButton}
                  >
                    ❌ Cancel
                  </button>
                </>
              )}
            </div>
          </div>
          {isEditing ? (
            <textarea
              value={editedFeedback}
              onChange={(e) => setEditedFeedback(e.target.value)}
              style={styles.feedbackTextarea}
              rows={20}
            />
          ) : (
            <div 
              style={styles.feedbackContent}
              dangerouslySetInnerHTML={{ __html: formatMarkdown(editedFeedback || feedback) }}
              className="feedback-formatted"
            />
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '30px',
    gap: '15px',
  },
  statusIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#4a90e2',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#333',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  cardIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px',
  },
  fileInput: {
    fontSize: '14px',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  textInput: {
    fontSize: '14px',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    width: '100%',
    boxSizing: 'border-box',
  },
  textarea: {
    fontSize: '14px',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '120px',
  },
  button: {
    backgroundColor: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'not-allowed',
    marginTop: '8px',
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '20px',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '8px',
  },
  loadingStep: {
    fontSize: '14px',
    color: '#999',
    fontStyle: 'italic',
  },
  errorCard: {
    backgroundColor: '#ffebee',
    border: '1px solid #ef5350',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '20px',
    color: '#d32f2f',
  },
  feedbackCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginTop: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  feedbackTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '16px',
    marginTop: 0,
  },
  feedbackHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  feedbackActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  editButton: {
    backgroundColor: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  copyButton: {
    backgroundColor: '#666',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  downloadButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  feedbackContent: {
    lineHeight: '1.8',
    fontSize: '14px',
    color: '#333',
  },
  feedbackContentH1: {
    fontSize: '24px',
    fontWeight: '600',
    marginTop: '20px',
    marginBottom: '12px',
    color: '#333',
  },
  feedbackContentH2: {
    fontSize: '20px',
    fontWeight: '600',
    marginTop: '18px',
    marginBottom: '10px',
    color: '#333',
  },
  feedbackContentH3: {
    fontSize: '18px',
    fontWeight: '600',
    marginTop: '16px',
    marginBottom: '8px',
    color: '#333',
  },
  feedbackContentP: {
    marginBottom: '12px',
  },
  feedbackContentUl: {
    marginLeft: '20px',
    marginBottom: '12px',
  },
  feedbackContentLi: {
    marginBottom: '6px',
  },
  feedbackTextarea: {
    width: '100%',
    minHeight: '400px',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    lineHeight: '1.6',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
}

export default App

