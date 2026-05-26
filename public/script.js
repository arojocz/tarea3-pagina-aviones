const API_URL = "http://127.0.0.1:8000/api/chat";
const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('dropArea');
const uploadZone = document.getElementById('uploadZone');
const slotsContainer = document.getElementById('slotsContainer');
const publishButton = document.getElementById('publishButton');
const postsGrid = document.getElementById('postsGrid');
const postTemplate = document.getElementById('postTemplate');
const inputModel = document.getElementById('inputModel');
const inputType = document.getElementById('inputType');
const inputLocation = document.getElementById('inputLocation');
const inputDescription = document.getElementById('inputDescription');
const inputTags = document.getElementById('inputTags');

const STORAGE_KEY = 'aeroPublicaciones';
const MAX_PHOTOS = 3;
let selectedFiles = [null, null, null];
let activeSlotIndex = 0;

function getSavedPosts() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (error) {
    return [];
  }
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function renderPosts() {
  const posts = getSavedPosts();
  postsGrid.innerHTML = '';
  if (posts.length === 0) {
    postsGrid.innerHTML = '<p class="empty-state">No hay publicaciones aún. Crea la primera usando el formulario de arriba.</p>';
    return;
  }

  posts.slice().reverse().forEach((post) => {
    const clone = postTemplate.content.cloneNode(true);
    const card = clone.querySelector('.post-card');
    const image = clone.querySelector('.post-image');
    const title = clone.querySelector('.post-title');
    const text = clone.querySelector('.post-text');

    image.style.backgroundImage = post.images[0]
      ? `url('${post.images[0]}')`
      : `linear-gradient(135deg, #dbe7fb 0%, #f6f7fd 100%)`;
    title.textContent = `${post.model} · ${post.type}`;
    text.textContent = post.description.length > 120 ? `${post.description.slice(0, 120)}...` : post.description;

    postsGrid.appendChild(clone);
  });
}

function updateSlotButtons() {
  const slots = slotsContainer.querySelectorAll('.slot');
  slots.forEach((slot) => {
    const index = Number(slot.dataset.index);
    const file = selectedFiles[index];
    slot.classList.toggle('has-file', Boolean(file));
    slot.textContent = file ? `Foto ${index + 1} cargada` : `Subir Foto ${index + 1}`;
  });
}

function renderUploadPreviews() {
  const existingPreview = uploadZone.querySelector('.upload-preview-grid');
  if (existingPreview) existingPreview.remove();

  const uploadedFiles = selectedFiles.filter(Boolean);
  if (uploadedFiles.length === 0) return;

  const previewGrid = document.createElement('div');
  previewGrid.className = 'upload-preview-grid';
  uploadedFiles.forEach((fileObject) => {
    const item = document.createElement('div');
    item.className = 'preview-item';
    item.style.backgroundImage = `url('${fileObject.dataUrl}')`;
    previewGrid.appendChild(item);
  });

  uploadZone.insertBefore(previewGrid, slotsContainer);
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleFiles(files, targetIndex) {
  const fileArray = Array.from(files).slice(0, MAX_PHOTOS);
  for (let i = 0; i < fileArray.length; i += 1) {
    const insertionIndex = targetIndex + i;
    if (insertionIndex >= MAX_PHOTOS) break;
    const file = fileArray[i];
    const dataUrl = await readFileAsDataURL(file);
    selectedFiles[insertionIndex] = {
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl,
    };
  }
  updateSlotButtons();
  renderUploadPreviews();
}

function clearForm() {
  inputModel.value = '';
  inputType.value = 'Avión Comercial';
  inputLocation.value = '';
  inputDescription.value = '';
  inputTags.value = '';
  selectedFiles = [null, null, null];
  activeSlotIndex = 0;
  updateSlotButtons();
  renderUploadPreviews();
}

function publishPost() {
  const model = inputModel.value.trim();
  const type = inputType.value;
  const location = inputLocation.value.trim();
  const description = inputDescription.value.trim();
  const tags = inputTags.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!model || !description) {
    alert('Por favor, completa el modelo y la descripción antes de publicar.');
    return;
  }

  const images = selectedFiles.filter(Boolean).map((file) => file.dataUrl);
  const newPost = {
    id: Date.now(),
    model,
    type,
    location,
    description,
    tags,
    images,
    createdAt: new Date().toISOString(),
  };

  const posts = getSavedPosts();
  posts.push(newPost);
  savePosts(posts);
  renderPosts();
  clearForm();
}

function activateSlotButton(event) {
  const slot = event.target.closest('.slot');
  if (!slot) return;
  activeSlotIndex = Number(slot.dataset.index);
  fileInput.value = '';
  fileInput.click();
}

function handleDragOver(event) {
  event.preventDefault();
  dropArea.classList.add('dragover');
}

function handleDragLeave() {
  dropArea.classList.remove('dragover');
}

function handleDrop(event) {
  event.preventDefault();
  dropArea.classList.remove('dragover');
  const files = event.dataTransfer.files;
  if (files.length === 0) return;
  handleFiles(files, 0);
}

fileInput.addEventListener('change', (event) => {
  const files = event.target.files;
  if (files.length === 0) return;
  handleFiles(files, activeSlotIndex);
});

dropArea.addEventListener('dragover', handleDragOver);
dropArea.addEventListener('dragleave', handleDragLeave);
dropArea.addEventListener('drop', handleDrop);
dropArea.addEventListener('click', () => {
  activeSlotIndex = 0;
  fileInput.value = '';
  fileInput.click();
});
slotsContainer.addEventListener('click', activateSlotButton);
publishButton.addEventListener('click', publishPost);

// ============================================================================
// MÓDULO: CHAT CON AZURE AI FOUNDRY
// ============================================================================

const ChatManager = {
  // Estado
  threadId: null,
  isInitialized: false,
  isWaitingForResponse: false,
  messageHistory: [],
  
  // Constantes
  BACKEND_URL: 'http://localhost:8000',
  SESSION_STORAGE_KEY: 'chatThreadId',
  MESSAGE_RETRY_LIMIT: 3,
  RESPONSE_TIMEOUT_MS: 30000,
  
  // ========================================================================
  // Métodos de Inicialización
  // ========================================================================
  
  async init() {
    console.log('🚀 Inicializando ChatManager...');
    
    try {
      // Cargar threadId del sessionStorage si existe
      this.threadId = sessionStorage.getItem(this.SESSION_STORAGE_KEY);
      
      if (this.threadId) {
        console.log('✅ ThreadId cargado del sessionStorage:', this.threadId);
        this.isInitialized = true;
      } else {
        console.log('🆕 Creando nuevo thread...');
        await this.createNewThread();
      }
      
      // Vincular event listeners
      this.bindEventListeners();
      
      console.log('✅ ChatManager inicializado correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar ChatManager:', error);
      this.showError('No se pudo conectar al chat. Intenta recargar la página.');
    }
  },
  
  async createNewThread() {
    try {
      const response = await this.fetchWithTimeout(`${this.BACKEND_URL}/api/chat/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success' && data.thread_id) {
        this.threadId = data.thread_id;
        this.saveThreadId();
        this.isInitialized = true;
        console.log('✅ Nuevo thread creado:', this.threadId);
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('❌ Error al crear thread:', error);
      throw error;
    }
  },
  
  // ========================================================================
  // Métodos de Almacenamiento
  // ========================================================================
  
  saveThreadId() {
    if (this.threadId) {
      sessionStorage.setItem(this.SESSION_STORAGE_KEY, this.threadId);
      console.log('💾 ThreadId guardado en sessionStorage');
    }
  },
  
  clearThreadId() {
    sessionStorage.removeItem(this.SESSION_STORAGE_KEY);
    this.threadId = null;
    this.messageHistory = [];
    console.log('🗑️ ThreadId y historial borrados');
  },
  
  // ========================================================================
  // Métodos de UI - Renderizado de Mensajes
  // ========================================================================
  
  renderMessage(text, role = 'agent', timestamp = null) {
    const messagesContainer = document.getElementById('chatMessages');
    
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;
    
    messageDiv.appendChild(bubble);
    
    // Agregar timestamp (opcional)
    if (timestamp) {
      const timeElement = document.createElement('span');
      timeElement.className = 'chat-timestamp';
      timeElement.textContent = timestamp;
      messageDiv.appendChild(timeElement);
    }
    
    messagesContainer.appendChild(messageDiv);
    
    // Auto-scroll al final
    this.scrollToBottom();
  },
  
  scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  },
  
  showTypingIndicator() {
    const typingDiv = document.getElementById('chatTyping');
    if (typingDiv) {
      typingDiv.style.display = 'flex';
      this.scrollToBottom();
    }
  },
  
  hideTypingIndicator() {
    const typingDiv = document.getElementById('chatTyping');
    if (typingDiv) {
      typingDiv.style.display = 'none';
    }
  },
  
  showError(message) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'chat-error';
    errorDiv.textContent = '⚠️ ' + message;
    
    messagesContainer.appendChild(errorDiv);
    this.scrollToBottom();
  },
  
  // ========================================================================
  // Métodos de Comunicación con API
  // ========================================================================
  
  async fetchWithTimeout(url, options = {}) {
    const timeout = options.timeout || this.RESPONSE_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  },
  
  async sendMessage(userMessage) {
    const messageText = userMessage.trim();
    
    // Validar
    if (!messageText) {
      this.showError('Por favor escribe un mensaje.');
      return;
    }
    
    if (!this.isInitialized) {
      this.showError('El chat no está inicializado. Intenta recargar.');
      return;
    }
    
    if (this.isWaitingForResponse) {
      this.showError('Espera a que se complete el mensaje anterior.');
      return;
    }
    
    // Agregar mensaje del usuario a la UI
    const timestamp = this.getCurrentTime();
    this.renderMessage(messageText, 'user', timestamp);
    
    // Limpiar input
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.value = '';
    }
    
    // Marcar como esperando respuesta
    this.isWaitingForResponse = true;
    this.showTypingIndicator();
    
    try {
      // Hacer request al backend
      const response = await this.fetchWithTimeout(
        `${this.BACKEND_URL}/api/chat/message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            thread_id: this.threadId,
            message: messageText,
          }),
        }
      );
      
      this.hideTypingIndicator();
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success' && data.agent_response) {
        // Renderizar respuesta del agente
        const agentTimestamp = this.getCurrentTime();
        this.renderMessage(data.agent_response, 'agent', agentTimestamp);
        
        // Guardar en historial
        this.messageHistory.push({
          role: 'user',
          content: messageText,
          timestamp: timestamp,
        });
        this.messageHistory.push({
          role: 'agent',
          content: data.agent_response,
          timestamp: agentTimestamp,
        });
        
        console.log('✅ Mensaje procesado correctamente');
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      this.hideTypingIndicator();
      console.error('❌ Error al enviar mensaje:', error);
      
      if (error.name === 'AbortError') {
        this.showError('La respuesta tardó demasiado. Intenta de nuevo.');
      } else {
        this.showError(`Error: ${error.message}`);
      }
    } finally {
      this.isWaitingForResponse = false;
    }
  },
  
  getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  },
  
  // ========================================================================
  // Métodos de UI - Toggle y Controles
  // ========================================================================
  
  toggleChat() {
    const widget = document.getElementById('chatWidget');
    const fab = document.getElementById('chatFab');
    
    if (widget) widget.classList.toggle('open');
    if (fab) fab.classList.toggle('open');
    
    // Enfocar input si se abre
    if (widget && widget.classList.contains('open')) {
      const input = document.getElementById('chatInput');
      if (input) {
        setTimeout(() => input.focus(), 300);
      }
    }
  },
  
  closeChat() {
    const widget = document.getElementById('chatWidget');
    const fab = document.getElementById('chatFab');
    
    if (widget) widget.classList.remove('open');
    if (fab) fab.classList.remove('open');
  },
  
  openChat() {
    const widget = document.getElementById('chatWidget');
    const fab = document.getElementById('chatFab');
    
    if (widget) widget.classList.add('open');
    if (fab) fab.classList.add('open');
  },
  
  // ========================================================================
  // Vinculación de Event Listeners
  // ========================================================================
  
  bindEventListeners() {
    // Botón FAB (flotante)
    const chatFab = document.getElementById('chatFab');
    if (chatFab) {
      chatFab.addEventListener('click', () => this.toggleChat());
    }
    
    // Botón cerrar widget
    const chatToggle = document.getElementById('chatToggle');
    if (chatToggle) {
      chatToggle.addEventListener('click', () => this.closeChat());
    }
    
    // Botón enviar
    const chatSend = document.getElementById('chatSend');
    if (chatSend) {
      chatSend.addEventListener('click', () => {
        const input = document.getElementById('chatInput');
        if (input) {
          this.sendMessage(input.value);
        }
      });
    }
    
    // Enter en input
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          this.sendMessage(chatInput.value);
        }
      });
    }
  },
};

// ============================================================================
// Iniciar Chat cuando DOM esté listo
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ChatManager.init());
} else {
  ChatManager.init();
}

updateSlotButtons();
renderPosts();
