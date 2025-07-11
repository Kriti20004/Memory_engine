(function() {
  if (window.__memoryBoxInjected) return;
  window.__memoryBoxInjected = true;

  // Create styles
  const style = document.createElement('style');
  style.textContent = `
    .memory-box {
      position: fixed;
      top: 18px;
      right: 18px;
      width: 270px;
      background: #f8fafc;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.10);
      z-index: 999999;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #222;
      padding: 14px 14px 10px 14px;
      transition: opacity 0.2s;
    }
    .memory-box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .memory-box-title {
      font-size: 1.08rem;
      font-weight: 600;
    }
    .memory-toggle-btn {
      background: #e0e7ff;
      border: none;
      border-radius: 8px;
      padding: 3px 10px;
      font-size: 0.95rem;
      cursor: pointer;
      font-weight: 500;
      color: #3730a3;
      transition: background 0.2s;
    }
    .memory-toggle-btn:hover {
      background: #c7d2fe;
    }
    .memory-list {
      margin: 0;
      padding: 0;
      list-style: none;
      max-height: 180px;
      overflow-y: auto;
    }
    .memory-item {
      margin-bottom: 6px;
      border-radius: 8px;
      background: #fff;
      padding: 7px 10px;
      cursor: pointer;
      font-size: 0.98rem;
      transition: background 0.18s;
    }
    .memory-item:hover {
      background: #f1f5f9;
    }
    .memory-content {
      margin-top: 7px;
      background: #f1f5f9;
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 0.97rem;
      color: #374151;
      word-break: break-word;
    }
  `;
  document.head.appendChild(style);

  // Create memory box
  const box = document.createElement('div');
  box.className = 'memory-box';

  const header = document.createElement('div');
  header.className = 'memory-box-header';
  const title = document.createElement('span');
  title.className = 'memory-box-title';
  title.textContent = 'Memories';
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'memory-toggle-btn';
  toggleBtn.textContent = 'Hide';
  header.appendChild(title);
  header.appendChild(toggleBtn);
  box.appendChild(header);

  const list = document.createElement('ul');
  list.className = 'memory-list';
  box.appendChild(list);

  document.body.appendChild(box);

  let hidden = false;
  toggleBtn.addEventListener('click', () => {
    hidden = !hidden;
    list.style.display = hidden ? 'none' : '';
    toggleBtn.textContent = hidden ? 'Show' : 'Hide';
  });

  function renderMemories(memories) {
    list.innerHTML = '';
    memories.forEach((mem, idx) => {
      const item = document.createElement('li');
      item.className = 'memory-item';
      item.textContent = mem.title;
      item.addEventListener('click', () => {
        // Toggle summary display
        const existing = item.querySelector('.memory-content');
        if (existing) {
          existing.remove();
        } else {
          const content = document.createElement('div');
          content.className = 'memory-content';
          content.textContent = mem.content;
          item.appendChild(content);
        }
      });
      list.appendChild(item);
    });
  }

  function loadMemories() {
    chrome.storage.local.get({ memories: [] }, (data) => {
      renderMemories(data.memories || []);
    });
  }

  // Initial load
  loadMemories();
  // Listen for changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.memories) {
      loadMemories();
    }
  });
})(); 