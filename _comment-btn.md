---
cssclasses: [devinventory]
---

```dataviewjs
// ── Botón: añadir comentario al archivo activo ──
var obsidian = require('obsidian');
var Modal    = obsidian.Modal;
var Setting  = obsidian.Setting;
var Notice   = obsidian.Notice;

var btn = dv.container.createEl('button', { cls: 'di-comment-btn', text: '＋ Añadir comentario' });

btn.addEventListener('click', function() {
  var CommentModal = class extends Modal {
    onOpen() {
      var self = this;
      var contentEl = this.contentEl;
      contentEl.empty();
      contentEl.addClass('di-modal');

      contentEl.createEl('h2', { text: '＋ Añadir comentario' });

      var commentText = '';

      new Setting(contentEl)
        .setName('Comentario')
        .addTextArea(function(t) {
          t.setPlaceholder('Escribe tu comentario aquí...');
          t.onChange(function(v) { commentText = v; });
          t.inputEl.style.minHeight = '120px';
          t.inputEl.style.width = '100%';
          // Focus automático
          setTimeout(function() { t.inputEl.focus(); }, 50);
        });

      new Setting(contentEl)
        .addButton(function(b) {
          b.setButtonText('Añadir').setCta().onClick(async function() {
            if (!commentText.trim()) {
              new Notice('El comentario no puede estar vacío');
              return;
            }
            var activeFile = app.workspace.getActiveFile();
            if (!activeFile) {
              new Notice('No hay archivo activo');
              return;
            }

            var today    = new Date().toISOString().slice(0, 10);
            var lines    = commentText.trim().split('\n');
            var callout  = '\n> [!note] ' + today + '\n'
                         + lines.map(function(l) { return '> ' + l; }).join('\n')
                         + '\n';

            var content  = await app.vault.read(activeFile);
            await app.vault.modify(activeFile, content + callout);

            new Notice('✓ Comentario añadido');
            self.close();
          });
        })
        .addButton(function(b) {
          b.setButtonText('Cancelar').onClick(function() { self.close(); });
        });
    }
    onClose() { this.contentEl.empty(); }
  };

  new CommentModal(app).open();
});
```
