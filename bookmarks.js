// ================= BOOKMARKS.JS =================
// This new file contains all bookmark management functionality

// Bookmark data structure
let bookmarks = [];
let bookmarksBarVisible = true;
let draggedBookmark = null;
let dragOverTarget = null;
let dropPosition = null;

// Initialize bookmarks
function initializeBookmarks() {
  console.log('Initializing bookmarks system...');
  
  // Load saved bookmarks or set defaults
  const savedBookmarks = localStorage.getItem('browser-bookmarks');
  if (savedBookmarks) {
    try {
      bookmarks = JSON.parse(savedBookmarks);
    } catch (e) {
      console.error('Error loading saved bookmarks:', e);
      setDefaultBookmarks();
    }
  } else {
    setDefaultBookmarks();
  }
  
  // Get visibility state
  bookmarksBarVisible = localStorage.getItem('bookmarks-bar-visible') !== 'false';
  
  // Render the bookmarks bar
  renderBookmarksBar();
  
  // Setup keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+B to toggle bookmarks bar
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'b') {
      toggleBookmarksBar();
      e.preventDefault();
    }
    
    // Ctrl+D to bookmark current page
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      bookmarkCurrentPage();
      e.preventDefault();
    }
  });
}

// Set default bookmarks
function setDefaultBookmarks() {
  bookmarks = [
    {
      id: generateId(),
      title: "Google",
      url: "https://www.google.com",
      favicon: "",
      isFolder: false,
      parentId: null
    },
    {
      id: generateId(),
      title: "Favorites",
      isFolder: true,
      children: [],
      parentId: null
    },
    {
      id: generateId(),
      title: "GitHub",
      url: "https://github.com",
      favicon: "",
      isFolder: false,
      parentId: null
    }
  ];
  
  saveBookmarks();
}

// Save bookmarks to localStorage
function saveBookmarks() {
  try {
    localStorage.setItem('browser-bookmarks', JSON.stringify(bookmarks));
  } catch (e) {
    console.error('Error saving bookmarks:', e);
    showNotification('Failed to save bookmarks', 'error');
  }
}

// Render the bookmarks bar
function renderBookmarksBar() {
  const bookmarksBar = document.getElementById('bookmarks-bar');
  if (!bookmarksBar) {
    console.error('Bookmarks bar element not found');
    return;
  }
  
  // Set visibility
  bookmarksBar.style.display = bookmarksBarVisible ? 'flex' : 'none';
  
  // Clear existing bookmarks
  bookmarksBar.innerHTML = '';
  
  // Add root-level bookmarks and folders
  const rootBookmarks = bookmarks.filter(b => b.parentId === null);
  
  rootBookmarks.forEach(bookmark => {
    const bookmarkElement = createBookmarkElement(bookmark);
    bookmarksBar.appendChild(bookmarkElement);
  });
  
  // Add "Add Bookmark" button at the end
  const addButton = document.createElement('div');
  addButton.className = 'bookmark-item add-bookmark';
  addButton.innerHTML = `
    <span class="material-symbols-rounded">add</span>
    <span class="bookmark-title">Add</span>
  `;
  addButton.addEventListener('click', () => {
    bookmarkCurrentPage();
  });
  
  bookmarksBar.appendChild(addButton);
}

// Create a bookmark element
function createBookmarkElement(bookmark) {
  const element = document.createElement('div');
  element.className = 'bookmark-item';
  element.setAttribute('data-id', bookmark.id);
  element.setAttribute('draggable', 'true');
  
  if (bookmark.isFolder) {
    element.classList.add('bookmark-folder');
    
    element.innerHTML = `
      <span class="material-symbols-rounded folder-icon">folder</span>
      <span class="bookmark-title">${escapeHtml(bookmark.title)}</span>
      <span class="material-symbols-rounded dropdown-icon">arrow_drop_down</span>
    `;
    
    // Create dropdown menu for folder
    const dropdown = document.createElement('div');
    dropdown.className = 'bookmark-folder-dropdown';
    
    if (bookmark.children && bookmark.children.length > 0) {
      bookmark.children.forEach(childId => {
        const childBookmark = bookmarks.find(b => b.id === childId);
        if (childBookmark) {
          const childElement = createBookmarkElement(childBookmark);
          childElement.classList.add('dropdown-item');
          dropdown.appendChild(childElement);
        }
      });
    } else {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-folder-message';
      emptyMessage.textContent = 'Empty folder';
      dropdown.appendChild(emptyMessage);
    }
    
    // Add "Add bookmark" option to folder dropdown
    const addToFolderItem = document.createElement('div');
    addToFolderItem.className = 'dropdown-item add-to-folder';
    addToFolderItem.innerHTML = `
      <span class="material-symbols-rounded">add</span>
      <span>Add current page</span>
    `;
    addToFolderItem.addEventListener('click', (e) => {
      e.stopPropagation();
      bookmarkCurrentPage(bookmark.id);
    });
    dropdown.appendChild(addToFolderItem);
    
    element.appendChild(dropdown);
    
    // Toggle dropdown on click
    element.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown-item')) {
        element.classList.toggle('open');
      }
    });
  } else {
    // Regular bookmark
    const faviconHtml = bookmark.favicon ? 
      `<img src="${bookmark.favicon}" alt="" class="bookmark-favicon">` : 
      `<span class="material-symbols-rounded">public</span>`;
    
    element.innerHTML = `
      <div class="bookmark-icon">
        ${faviconHtml}
      </div>
      <span class="bookmark-title">${escapeHtml(bookmark.title)}</span>
    `;
    
    // Navigate on click
    element.addEventListener('click', () => {
      navigateToUrl(bookmark.url);
    });
  }
  
  // Setup drag and drop
  element.addEventListener('dragstart', (e) => {
    draggedBookmark = bookmark;
    element.classList.add('dragging');
    e.dataTransfer.setData('text/plain', bookmark.id);
    e.dataTransfer.effectAllowed = 'move';
  });
  
  element.addEventListener('dragend', () => {
    element.classList.remove('dragging');
    clearDragIndicators();
    draggedBookmark = null;
  });
  
  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    
    if (!draggedBookmark || draggedBookmark.id === bookmark.id) {
      return;
    }
    
    // Determine drop position
    const rect = element.getBoundingClientRect();
    const mouseX = e.clientX;
    const isFolder = bookmark.isFolder;
    
    // Calculate position (before, inside folder, after)
    if (isFolder && mouseX > rect.left + rect.width * 0.7) {
      // Inside folder
      dropPosition = 'inside';
      element.classList.add('drop-inside');
      element.classList.remove('drop-before', 'drop-after');
    } else if (mouseX < rect.left + rect.width * 0.3) {
      // Before element
      dropPosition = 'before';
      element.classList.add('drop-before');
      element.classList.remove('drop-inside', 'drop-after');
    } else {
      // After element
      dropPosition = 'after';
      element.classList.add('drop-after');
      element.classList.remove('drop-inside', 'drop-before');
    }
    
    dragOverTarget = bookmark;
  });
  
  element.addEventListener('dragleave', () => {
    element.classList.remove('drop-before', 'drop-after', 'drop-inside');
    if (dragOverTarget && dragOverTarget.id === bookmark.id) {
      dragOverTarget = null;
    }
  });
  
  element.addEventListener('drop', (e) => {
    e.preventDefault();
    element.classList.remove('drop-before', 'drop-after', 'drop-inside');
    
    if (!draggedBookmark || draggedBookmark.id === bookmark.id) {
      return;
    }
    
    // Move bookmark based on position
    if (dropPosition === 'inside' && bookmark.isFolder) {
      // Move into folder
      moveBookmarkToFolder(draggedBookmark.id, bookmark.id);
    } else if (dropPosition === 'before' || dropPosition === 'after') {
      // Reorder at same level
      reorderBookmark(draggedBookmark.id, bookmark.id, dropPosition);
    }
    
    // Save and re-render
    saveBookmarks();
    renderBookmarksBar();
  });
  
  // Setup context menu
  element.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showBookmarkContextMenu(bookmark, e.clientX, e.clientY);
  });
  
  return element;
}

// Bookmark current page
function bookmarkCurrentPage(folderId = null) {
  if (!activeTabId) return;
  
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  
  // Show bookmark dialog
  showBookmarkDialog(tab, folderId);
}

// Show bookmark dialog
function showBookmarkDialog(tab, folderId = null) {
  // Create dialog overlay
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  
  // Create dialog
  const dialog = document.createElement('div');
  dialog.className = 'bookmark-dialog';
  
  // Create dialog content
  dialog.innerHTML = `
    <h3>${tab.url === getHomepageUrl() ? 'Add Bookmark' : 'Edit Bookmark'}</h3>
    <div class="dialog-form">
      <div class="form-group">
        <label for="bookmark-name">Name</label>
        <input type="text" id="bookmark-name" value="${escapeHtml(tab.title)}">
      </div>
      <div class="form-group">
        <label for="bookmark-url">URL</label>
        <input type="text" id="bookmark-url" value="${escapeHtml(tab.url)}">
      </div>
      <div class="form-group">
        <label for="bookmark-folder">Folder</label>
        <select id="bookmark-folder">
          <option value="">Bookmarks bar</option>
          ${getFolderOptionsHtml(folderId)}
        </select>
      </div>
    </div>
    <div class="dialog-buttons">
      <button class="dialog-button cancel">Cancel</button>
      <button class="dialog-button primary save">Save</button>
    </div>
  `;
  
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  // Focus name input
  setTimeout(() => {
    document.getElementById('bookmark-name').focus();
    document.getElementById('bookmark-name').select();
  }, 50);
  
  // Handle save
  const saveButton = dialog.querySelector('.save');
  saveButton.addEventListener('click', () => {
    const name = document.getElementById('bookmark-name').value.trim();
    const url = document.getElementById('bookmark-url').value.trim();
    const folder = document.getElementById('bookmark-folder').value;
    
    if (!name) {
      showValidationError('Please enter a name');
      return;
    }
    
    if (!url) {
      showValidationError('Please enter a URL');
      return;
    }
    
    addBookmark(name, url, tab.favicon, folder);
    overlay.remove();
  });
  
  // Handle cancel
  const cancelButton = dialog.querySelector('.cancel');
  cancelButton.addEventListener('click', () => {
    overlay.remove();
  });
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
  
  // Show validation error
  function showValidationError(message) {
    let errorEl = dialog.querySelector('.validation-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'validation-error';
      dialog.querySelector('.dialog-form').appendChild(errorEl);
    }
    
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

// Get folder options HTML
function getFolderOptionsHtml(selectedFolderId = null) {
  const folders = bookmarks.filter(b => b.isFolder);
  
  return folders.map(folder => {
    const selected = folder.id === selectedFolderId ? 'selected' : '';
    return `<option value="${folder.id}" ${selected}>${escapeHtml(folder.title)}</option>`;
  }).join('');
}

// Add a bookmark
function addBookmark(title, url, favicon = '', folderId = null) {
  // Create bookmark object
  const newBookmark = {
    id: generateId(),
    title,
    url,
    favicon,
    isFolder: false,
    parentId: folderId
  };
  
  // Add to bookmarks array
  bookmarks.push(newBookmark);
  
  // If adding to a folder, update the folder
  if (folderId) {
    const folder = bookmarks.find(b => b.id === folderId);
    if (folder && folder.isFolder) {
      folder.children = folder.children || [];
      folder.children.push(newBookmark.id);
    }
  }
  
  // Save and re-render
  saveBookmarks();
  renderBookmarksBar();
  
  // Show notification
  showNotification('Bookmark added', 'success');
}

// Create a new bookmark folder
function createBookmarkFolder(title, parentId = null) {
  // Create folder object
  const newFolder = {
    id: generateId(),
    title,
    isFolder: true,
    children: [],
    parentId
  };
  
  // Add to bookmarks array
  bookmarks.push(newFolder);
  
  // If adding to a parent folder, update the parent
  if (parentId) {
    const parent = bookmarks.find(b => b.id === parentId);
    if (parent && parent.isFolder) {
      parent.children = parent.children || [];
      parent.children.push(newFolder.id);
    }
  }
  
  // Save and re-render
  saveBookmarks();
  renderBookmarksBar();
  
  // Show notification
  showNotification('Folder created', 'success');
}

// Delete a bookmark or folder
function deleteBookmark(id) {
  const bookmark = bookmarks.find(b => b.id === id);
  
  if (!bookmark) return;
  
  // If it's a folder, recursively delete children
  if (bookmark.isFolder && bookmark.children) {
    bookmark.children.forEach(childId => {
      deleteBookmark(childId);
    });
  }
  
  // Remove from parent folder if needed
  if (bookmark.parentId) {
    const parent = bookmarks.find(b => b.id === bookmark.parentId);
    if (parent && parent.isFolder && parent.children) {
      parent.children = parent.children.filter(childId => childId !== id);
    }
  }
  
  // Remove from bookmarks array
  bookmarks = bookmarks.filter(b => b.id !== id);
  
  // Save and re-render
  saveBookmarks();
  renderBookmarksBar();
  
  // Show notification
  showNotification('Bookmark deleted', 'success');
}

// Move bookmark to folder
function moveBookmarkToFolder(bookmarkId, folderId) {
  const bookmark = bookmarks.find(b => b.id === bookmarkId);
  const folder = bookmarks.find(b => b.id === folderId);
  
  if (!bookmark || !folder || !folder.isFolder) return;
  
  // If bookmark is already in a folder, remove it
  if (bookmark.parentId) {
    const oldParent = bookmarks.find(b => b.id === bookmark.parentId);
    if (oldParent && oldParent.children) {
      oldParent.children = oldParent.children.filter(id => id !== bookmarkId);
    }
  }
  
  // Add to new folder
  bookmark.parentId = folderId;
  folder.children = folder.children || [];
  folder.children.push(bookmarkId);
  
  // Save and re-render
  saveBookmarks();
  renderBookmarksBar();
}

// Reorder bookmark (before or after target)
function reorderBookmark(bookmarkId, targetId, position) {
  const bookmark = bookmarks.find(b => b.id === bookmarkId);
  const target = bookmarks.find(b => b.id === targetId);
  
  if (!bookmark || !target) return;
  
  // Remove from current parent if any
  if (bookmark.parentId) {
    const oldParent = bookmarks.find(b => b.id === bookmark.parentId);
    if (oldParent && oldParent.children) {
      oldParent.children = oldParent.children.filter(id => id !== bookmarkId);
    }
  }
  
  // Make sure bookmark is at root level (matches target)
  bookmark.parentId = target.parentId;
  
  // If target is in a folder, add to folder's children
  if (target.parentId) {
    const parent = bookmarks.find(b => b.id === target.parentId);
    if (parent && parent.isFolder && parent.children) {
      const index = parent.children.indexOf(targetId);
      const newIndex = position === 'before' ? index : index + 1;
      parent.children.splice(newIndex, 0, bookmarkId);
    }
  } else {
    // Root level reordering - we need to reorder the entire bookmarks array
    const rootBookmarks = bookmarks.filter(b => b.parentId === null);
    const sourceIndex = rootBookmarks.findIndex(b => b.id === bookmarkId);
    let targetIndex = rootBookmarks.findIndex(b => b.id === targetId);
    
    if (sourceIndex !== -1 && targetIndex !== -1) {
      // Remove from current position
      const [removed] = rootBookmarks.splice(sourceIndex, 1);
      
      // Adjust target index if needed
      if (sourceIndex < targetIndex) {
        targetIndex--;
      }
      
      // Insert at new position
      if (position === 'after') {
        targetIndex++;
      }
      
      rootBookmarks.splice(targetIndex, 0, removed);
      
      // Reconstruct bookmarks array with updated order
      const nonRootBookmarks = bookmarks.filter(b => b.parentId !== null);
      bookmarks = [...rootBookmarks, ...nonRootBookmarks];
    }
  }
  
  // Save and re-render
  saveBookmarks();
  renderBookmarksBar();
}

// Edit bookmark
function editBookmark(id) {
  const bookmark = bookmarks.find(b => b.id === id);
  
  if (!bookmark) return;
  
  // Create dialog overlay
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  
  // Create dialog
  const dialog = document.createElement('div');
  dialog.className = 'bookmark-dialog';
  
  // Create dialog content
  dialog.innerHTML = `
    <h3>Edit ${bookmark.isFolder ? 'Folder' : 'Bookmark'}</h3>
    <div class="dialog-form">
      <div class="form-group">
        <label for="bookmark-name">Name</label>
        <input type="text" id="bookmark-name" value="${escapeHtml(bookmark.title)}">
      </div>
      ${bookmark.isFolder ? '' : `
      <div class="form-group">
        <label for="bookmark-url">URL</label>
        <input type="text" id="bookmark-url" value="${escapeHtml(bookmark.url)}">
      </div>
      `}
      <div class="form-group">
        <label for="bookmark-folder">Folder</label>
        <select id="bookmark-folder">
          <option value="">Bookmarks bar</option>
          ${getFolderOptionsHtml(bookmark.parentId)}
        </select>
      </div>
    </div>
    <div class="dialog-buttons">
      <button class="dialog-button cancel">Cancel</button>
      <button class="dialog-button primary save">Save</button>
    </div>
  `;
  
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  // Focus name input
  setTimeout(() => {
    document.getElementById('bookmark-name').focus();
    document.getElementById('bookmark-name').select();
  }, 50);
  
  // Handle save
  const saveButton = dialog.querySelector('.save');
  saveButton.addEventListener('click', () => {
    const name = document.getElementById('bookmark-name').value.trim();
    const url = bookmark.isFolder ? null : document.getElementById('bookmark-url').value.trim();
    const folderId = document.getElementById('bookmark-folder').value || null;
    
    if (!name) {
      showValidationError('Please enter a name');
      return;
    }
    
    if (!bookmark.isFolder && !url) {
      showValidationError('Please enter a URL');
      return;
    }
    
    // Update bookmark properties
    bookmark.title = name;
    if (!bookmark.isFolder) {
      bookmark.url = url;
    }
    
    // Handle folder change if needed
    if (bookmark.parentId !== folderId) {
      // Remove from old parent
      if (bookmark.parentId) {
        const oldParent = bookmarks.find(b => b.id === bookmark.parentId);
        if (oldParent && oldParent.isFolder && oldParent.children) {
          oldParent.children = oldParent.children.filter(childId => childId !== id);
        }
      }
      
      // Add to new parent
      bookmark.parentId = folderId;
      if (folderId) {
        const newParent = bookmarks.find(b => b.id === folderId);
        if (newParent && newParent.isFolder) {
          newParent.children = newParent.children || [];
          newParent.children.push(id);
        }
      }
    }
    
    // Save and re-render
    saveBookmarks();
    renderBookmarksBar();
    
    // Remove dialog
    overlay.remove();
    
    // Show notification
    showNotification(`${bookmark.isFolder ? 'Folder' : 'Bookmark'} updated`, 'success');
  });
  
  // Handle cancel
  const cancelButton = dialog.querySelector('.cancel');
  cancelButton.addEventListener('click', () => {
    overlay.remove();
  });
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
  
  // Show validation error
  function showValidationError(message) {
    let errorEl = dialog.querySelector('.validation-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'validation-error';
      dialog.querySelector('.dialog-form').appendChild(errorEl);
    }
    
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

// Show bookmark context menu
function showBookmarkContextMenu(bookmark, x, y) {
  // Remove any existing context menu
  const existingMenu = document.querySelector('.context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
  
  // Create context menu
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  
  // Add menu items
  const isFolder = bookmark.isFolder;
  
  let menuHtml = '';
  
  if (!isFolder) {
    menuHtml += `
      <div class="context-menu-item" data-action="open">
        <span class="material-symbols-rounded">open_in_new</span>
        <span>Open</span>
      </div>
      <div class="context-menu-item" data-action="new-tab">
        <span class="material-symbols-rounded">tab</span>
        <span>Open in New Tab</span>
      </div>
      <div class="context-menu-separator"></div>
    `;
  }
  
  menuHtml += `
    <div class="context-menu-item" data-action="edit">
      <span class="material-symbols-rounded">edit</span>
      <span>Edit</span>
    </div>
    <div class="context-menu-item" data-action="delete">
      <span class="material-symbols-rounded">delete</span>
      <span>Delete</span>
    </div>
  `;
  
  if (!isFolder) {
    menuHtml += `
      <div class="context-menu-separator"></div>
      <div class="context-menu-item" data-action="copy-url">
        <span class="material-symbols-rounded">content_copy</span>
        <span>Copy URL</span>
      </div>
    `;
  } else {
    menuHtml += `
      <div class="context-menu-separator"></div>
      <div class="context-menu-item" data-action="add-bookmark">
        <span class="material-symbols-rounded">bookmark_add</span>
        <span>Add Current Page</span>
      </div>
      <div class="context-menu-item" data-action="add-folder">
        <span class="material-symbols-rounded">create_new_folder</span>
        <span>Create New Folder</span>
      </div>
    `;
  }
  
  menu.innerHTML = menuHtml;
  document.body.appendChild(menu);
  
  // Ensure menu is within viewport
  const menuRect = menu.getBoundingClientRect();
  if (menuRect.right > window.innerWidth) {
    menu.style.left = `${window.innerWidth - menuRect.width - 10}px`;
  }
  
  if (menuRect.bottom > window.innerHeight) {
    menu.style.top = `${window.innerHeight - menuRect.height - 10}px`;
  }
  
  // Handle menu item clicks
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.context-menu-item');
    if (!item) return;
    
    const action = item.dataset.action;
    
    switch (action) {
      case 'open':
        navigateToUrl(bookmark.url);
        break;
      case 'new-tab':
        const newTabId = createNewTab();
        const newTab = tabs.find(t => t.id === newTabId);
        if (newTab) {
          newTab.url = bookmark.url;
          const newWebview = document.getElementById(`webview-${newTabId}`);
          if (newWebview) {
            setTimeout(() => {
              newWebview.src = bookmark.url;
            }, 50);
          }
          saveTabs();
        }
        break;
      case 'edit':
        editBookmark(bookmark.id);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${bookmark.title}"?`)) {
          deleteBookmark(bookmark.id);
        }
        break;
      case 'copy-url':
        navigator.clipboard.writeText(bookmark.url)
          .then(() => showNotification('URL copied to clipboard', 'success'))
          .catch(() => showNotification('Failed to copy URL', 'error'));
        break;
      case 'add-bookmark':
        bookmarkCurrentPage(bookmark.id);
        break;
      case 'add-folder':
        showAddFolderDialog(bookmark.id);
        break;
    }
    
    // Remove menu after action
    menu.remove();
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
    }
  }, { once: true });
  
  // Close menu when pressing Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      menu.remove();
    }
  }, { once: true });
}

// Show add folder dialog
function showAddFolderDialog(parentId = null) {
  // Create dialog overlay
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  
  // Create dialog
  const dialog = document.createElement('div');
  dialog.className = 'bookmark-dialog';
  
  // Create dialog content
  dialog.innerHTML = `
    <h3>Create Folder</h3>
    <div class="dialog-form">
      <div class="form-group">
        <label for="folder-name">Name</label>
        <input type="text" id="folder-name" placeholder="Folder name" autofocus>
      </div>
      <div class="form-group">
        <label for="parent-folder">Location</label>
        <select id="parent-folder">
          <option value="">Bookmarks bar</option>
          ${getFolderOptionsHtml(parentId)}
        </select>
      </div>
    </div>
    <div class="dialog-buttons">
      <button class="dialog-button cancel">Cancel</button>
      <button class="dialog-button primary save">Create</button>
    </div>
  `;
  
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  // Focus name input
  setTimeout(() => {
    document.getElementById('folder-name').focus();
  }, 50);
  
  // Handle save
  const saveButton = dialog.querySelector('.save');
  saveButton.addEventListener('click', () => {
    const name = document.getElementById('folder-name').value.trim();
    const parentFolder = document.getElementById('parent-folder').value || null;
    
    if (!name) {
      showValidationError('Please enter a folder name');
      return;
    }
    
    createBookmarkFolder(name, parentFolder);
    overlay.remove();
  });
  
  // Handle cancel
  const cancelButton = dialog.querySelector('.cancel');
  cancelButton.addEventListener('click', () => {
    overlay.remove();
  });
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
  
  // Show validation error
  function showValidationError(message) {
    let errorEl = dialog.querySelector('.validation-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'validation-error';
      dialog.querySelector('.dialog-form').appendChild(errorEl);
    }
    
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

// Toggle bookmarks bar visibility
function toggleBookmarksBar() {
  bookmarksBarVisible = !bookmarksBarVisible;
  localStorage.setItem('bookmarks-bar-visible', bookmarksBarVisible.toString());
  renderBookmarksBar();
  
  // Show notification
  showNotification(`Bookmarks bar ${bookmarksBarVisible ? 'shown' : 'hidden'}`, 'info');
}

// Clear drag indicators
function clearDragIndicators() {
  document.querySelectorAll('.bookmark-item').forEach(item => {
    item.classList.remove('drop-before', 'drop-after', 'drop-inside');
  });
}

// Helper: Generate ID
function generateId() {
  return 'bookmark-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

// Helper: Escape HTML
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Export to global scope
window.bookmarksManager = {
  initialize: initializeBookmarks,
  add: addBookmark,
  createFolder: createBookmarkFolder,
  delete: deleteBookmark,
  edit: editBookmark,
  toggle: toggleBookmarksBar,
  bookmarkCurrent: bookmarkCurrentPage
};