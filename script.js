class InteractiveList {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('interactiveList')) || [];
        this.currentEditIndex = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderList();
        this.setupDragAndDrop();
    }

    bindEvents() {
        // Botão adicionar
        document.getElementById('addBtn').addEventListener('click', () => this.addItem());
        
        // Enter no input
        document.getElementById('itemInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });

        // Validação em tempo real
        document.getElementById('itemInput').addEventListener('input', (e) => {
            this.validateInput(e.target);
        });

        // Botão ordenar
        document.getElementById('sortBtn').addEventListener('click', () => this.sortList());

        // Modal edição
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('saveEdit').addEventListener('click', () => this.saveEdit());
        
        // Fechar modal clicando fora
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('editModal');
            if (e.target === modal) this.closeModal();
        });
    }

    validateInput(input) {
        const message = document.getElementById('message');
        
        if (input.value.length >= 5) {
            input.classList.remove('error');
            input.classList.add('success');
            message.textContent = '';
            message.className = 'message';
        } else if (input.value.length > 0) {
            input.classList.remove('success');
            input.classList.add('error');
            message.textContent = 'Mínimo 5 caracteres necessários';
            message.className = 'message error';
        } else {
            input.classList.remove('success', 'error');
            message.textContent = '';
            message.className = 'message';
        }
    }

    addItem() {
        const input = document.getElementById('itemInput');
        const text = input.value.trim();

        if (text.length < 5) {
            this.showMessage('Erro: Mínimo 5 caracteres necessários', 'error');
            input.classList.add('error');
            return;
        }

        this.items.push({
            text: text,
            id: Date.now(),
            hasIcon: Math.random() > 0.5 // Simula a adição aleatória do PNG
        });

        this.saveToLocalStorage();
        this.renderList();
        this.showMessage('Item adicionado com sucesso!', 'success');
        
        input.value = '';
        input.classList.remove('success');
    }

    deleteItem(index) {
        if (confirm('Tem certeza que deseja excluir este item?')) {
            this.items.splice(index, 1);
            this.saveToLocalStorage();
            this.renderList();
            this.showMessage('Item excluído com sucesso!', 'success');
        }
    }

    editItem(index) {
        this.currentEditIndex = index;
        const modal = document.getElementById('editModal');
        const editInput = document.getElementById('editInput');
        
        editInput.value = this.items[index].text;
        modal.style.display = 'block';
        editInput.focus();
    }

    saveEdit() {
        if (this.currentEditIndex === null) return;

        const newText = document.getElementById('editInput').value.trim();
        
        if (newText.length < 5) {
            alert('Mínimo 5 caracteres necessários');
            return;
        }

        this.items[this.currentEditIndex].text = newText;
        this.saveToLocalStorage();
        this.renderList();
        this.closeModal();
        this.showMessage('Item editado com sucesso!', 'success');
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        this.currentEditIndex = null;
    }

    sortList() {
        this.items.sort((a, b) => a.text.localeCompare(b.text));
        this.saveToLocalStorage();
        this.renderList();
        this.showMessage('Lista ordenada alfabeticamente!', 'success');
    }

    setupDragAndDrop() {
        const list = document.getElementById('itemList');
        
        list.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('item')) {
                e.dataTransfer.setData('text/plain', e.target.dataset.index);
                e.target.classList.add('dragging');
            }
        });

        list.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('item')) {
                e.target.classList.remove('dragging');
            }
        });

        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(list, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (draggable) {
                if (afterElement == null) {
                    list.appendChild(draggable);
                } else {
                    list.insertBefore(draggable, afterElement);
                }
            }
        });

        list.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const itemsArray = Array.from(list.children);
            const toIndex = itemsArray.indexOf(document.querySelector('.item:not(.dragging)'));
            
            if (fromIndex !== toIndex && toIndex !== -1) {
                const [movedItem] = this.items.splice(fromIndex, 1);
                this.items.splice(toIndex, 0, movedItem);
                this.saveToLocalStorage();
                this.showMessage('Ordem alterada com sucesso!', 'success');
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    renderList() {
        const list = document.getElementById('itemList');
        list.innerHTML = '';

        this.items.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'item';
            li.draggable = true;
            li.dataset.index = index;

            li.innerHTML = `
                <div class="item-content">
                    <span class="drag-handle">≡</span>
                    ${item.hasIcon ? '<img src="icon.png" alt="Ícone" class="item-icon" onerror="this.style.display=\'none\'">' : ''}
                    <span class="item-text">${this.escapeHtml(item.text)}</span>
                </div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="interactiveList.editItem(${index})">Editar</button>
                    <button class="delete-btn" onclick="interactiveList.deleteItem(${index})">Excluir</button>
                </div>
            `;

            list.appendChild(li);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        
        setTimeout(() => {
            messageEl.textContent = '';
            messageEl.className = 'message';
        }, 3000);
    }

    saveToLocalStorage() {
        localStorage.setItem('interactiveList', JSON.stringify(this.items));
    }
}

// Inicializar a aplicação
const interactiveList = new InteractiveList();