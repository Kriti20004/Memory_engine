const summariseBtn = document.getElementById('summarise-btn');
const statusDiv = document.getElementById('status');
const memoriesList = document.getElementById('memories-list');
const searchBar = document.getElementById('search-bar');
let allMemories = [];

const OPENROUTER_API_KEY = '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';
const MODEL = 'deepseek/deepseek-chat-v3-0324:free';

async function getPageContent() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => document.body.innerText,
      }, (results) => {
        resolve(results[0].result);
      });
    });
  });
}

async function callDeepSeek(text) {
  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: 'Summarise the following webpage content in 5-7 sentences, focusing on the main ideas and key details.' },
      { role: 'user', content: text.substring(0, 8000) }
    ],
    max_tokens: 512,
    temperature: 0.5
  };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://memoryengine.extension',
      'X-Title': 'Memory Engine Extension'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('DeepSeek API error: ' + (await res.text()));
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No summary returned.';
}

async function saveMemory(title, content) {
  return new Promise((resolve) => {
    chrome.storage.local.get({ memories: [] }, (data) => {
      const memories = data.memories || [];
      memories.push({ title, content });
      chrome.storage.local.set({ memories }, resolve);
    });
  });
}

async function deleteMemory(index) {
  return new Promise((resolve) => {
    chrome.storage.local.get({ memories: [] }, (data) => {
      const memories = data.memories || [];
      memories.splice(index, 1);
      chrome.storage.local.set({ memories }, resolve);
    });
  });
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
}

function renderMemories(filter = '') {
  const filterText = filter.trim().toLowerCase();
  const memories = filterText
    ? allMemories.filter(mem =>
        mem.title.toLowerCase().includes(filterText) ||
        mem.content.toLowerCase().includes(filterText)
      )
    : allMemories;
  memoriesList.innerHTML = '';
  memories.forEach((mem, idx) => {
    const item = document.createElement('div');
    item.className = 'memory-entry';
    const title = document.createElement('div');
    title.className = 'memory-title';
    title.textContent = mem.title;
    const content = document.createElement('div');
    content.className = 'memory-content';
    content.textContent = mem.content;
    const btnRow = document.createElement('div');
    btnRow.className = 'memory-btn-row';
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy';
    copyBtn.className = 'memory-btn';
    copyBtn.onclick = () => copyToClipboard(mem.content);
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'memory-btn memory-btn-delete';
    delBtn.onclick = async () => {
      await deleteMemory(idx);
      await loadMemories();
      renderMemories(searchBar.value);
    };
    btnRow.appendChild(copyBtn);
    btnRow.appendChild(delBtn);
    item.appendChild(title);
    item.appendChild(content);
    item.appendChild(btnRow);
    memoriesList.appendChild(item);
  });
}

async function loadMemories() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ memories: [] }, (data) => {
      allMemories = data.memories || [];
      resolve();
    });
  });
}

searchBar.addEventListener('input', () => {
  renderMemories(searchBar.value);
});

summariseBtn.addEventListener('click', async () => {
  statusDiv.textContent = 'Summarising...';
  try {
    const pageContent = await getPageContent();
    const summary = await callDeepSeek(pageContent);
    let title = prompt('Name this memory:', '');
    if (!title) {
      statusDiv.textContent = 'Cancelled.';
      return;
    }
    await saveMemory(title, summary);
    statusDiv.textContent = `Saved as "${title}"!`;
    renderMemories();
  } catch (err) {
    statusDiv.textContent = 'Error: ' + err.message;
  }
});

// Initial load
(async () => {
  await loadMemories();
  renderMemories();
})();

// Listen for changes from other parts (e.g., content.js)
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'local' && changes.memories) {
    await loadMemories();
    renderMemories(searchBar.value);
  }
}); 