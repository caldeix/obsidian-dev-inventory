---
cssclasses: [devinventory]
---

```dataviewjs
// ═══════════════════════════════════════════════════════
//  DEV INVENTORY — Dashboard principal
//  Requiere: _lib.js, plugin Dataview con JS habilitado
// ═══════════════════════════════════════════════════════

// ── 0. Cargar utilidades ─────────────────────────────
// _lib.js devuelve un objeto ({...}); lo destructuramos para tener
// las funciones disponibles en este scope sin depender del eval-scope.
var _lib = {};
try {
  _lib = eval(await app.vault.adapter.read('_lib.js'));
} catch(e) {
  dv.container.createEl('div', { text: '⚠ No se pudo cargar _lib.js: ' + e.message });
}
var safeDate        = _lib.safeDate        ? _lib.safeDate.bind(_lib)        : function(){ return null; };
var daysAgo         = _lib.daysAgo         ? _lib.daysAgo.bind(_lib)         : function(){ return Infinity; };
var ageBadge        = _lib.ageBadge        ? _lib.ageBadge.bind(_lib)        : function(d){ return d||''; };
var showBanner      = _lib.showBanner      ? _lib.showBanner.bind(_lib)      : function(m){ console.log(m); };
var buildLanguageBar= _lib.buildLanguageBar? _lib.buildLanguageBar.bind(_lib): function(){ return ''; };

// ── 1. Helper: normalizar arrays del frontmatter ─────
function normArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).map(s => s.trim()).filter(Boolean);
  return String(val).split(',').map(s => s.trim()).filter(Boolean);
}

// ── 2. Query de datos ────────────────────────────────
const all      = dv.pages().where(p => p.name && p.project);
const active   = all.where(p  => !p.deprecated);
const deprAll  = all.where(p  => p.deprecated === true);

const now       = new Date();
const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

// ── 3. Registrar comando global (guard: una sola vez) ─
if (!app.commands.commands['devinventory:new']) {
  app.commands.addCommand({
    id: 'devinventory:new',
    name: 'DEV: ⚡ Nueva entrada',
    callback: function() { openNewProgramModal(); }
  });
}

// ══════════════════════════════════════════════════════
//  MODAL: Nuevo programa
// ══════════════════════════════════════════════════════
function openNewProgramModal() {
  var obsidian = require('obsidian');
  var Modal   = obsidian.Modal;
  var Setting = obsidian.Setting;
  var Notice  = obsidian.Notice;

  var pagesNow       = dv.pages().where(function(p) { return p.name && p.project; });
  var existProjects  = Array.from(new Set(pagesNow.map(function(p) { return p.project; }).filter(Boolean))).sort();
  var existLangs     = Array.from(new Set(pagesNow.array().flatMap(function(p) { return normArray(p.languages); }))).filter(Boolean).sort();
  var existDbs       = Array.from(new Set(pagesNow.array().flatMap(function(p) { return normArray(p.databases); }))).filter(Boolean).sort();
  var existOwners    = Array.from(new Set(pagesNow.map(function(p) { return p.owner; }).filter(Boolean))).sort();
  var existNames     = pagesNow.map(function(p) { return p.name; }).filter(Boolean).sort();

  var NewProgramModal = class extends Modal {
    onOpen() {
      var self = this;
      var contentEl = this.contentEl;
      contentEl.empty();
      contentEl.addClass('di-modal');

      contentEl.createEl('h2', { text: '＋ Nuevo programa' });

      var data = {
        name: '', project: '', app_type: 'api', languages: '', databases: '',
        owner: '', criticality: 'medium',
        env_dev: '', env_pre: '', env_pro: '',
        dependencies: '', repo_url: '', version: '',
        last_updated: now.toISOString().slice(0, 10),
        deprecated: false, cicd: false, description: ''
      };

      // Datalists para autocomplete
      function mkDatalist(id, values) {
        var dl = contentEl.createEl('datalist', { attr: { id: id } });
        values.forEach(function(v) { dl.createEl('option', { attr: { value: v } }); });
      }
      mkDatalist('di-dl-proj',   existProjects);
      mkDatalist('di-dl-langs',  existLangs);
      mkDatalist('di-dl-dbs',    existDbs);
      mkDatalist('di-dl-owners', existOwners);
      mkDatalist('di-dl-deps',   existNames);

      // 1. Nombre
      new Setting(contentEl).setName('Nombre del programa *')
        .addText(function(t) {
          t.setPlaceholder('mi-servicio');
          t.onChange(function(v) { data.name = v.trim(); });
        });

      // 2. Proyecto
      new Setting(contentEl).setName('Proyecto *')
        .addText(function(t) {
          t.setPlaceholder('MiProyecto');
          t.inputEl.setAttribute('list', 'di-dl-proj');
          t.onChange(function(v) { data.project = v.trim(); });
        });

      // 3. Tipo
      new Setting(contentEl).setName('Tipo de aplicación')
        .addDropdown(function(d) {
          ['api','webapp','batch','library','cli'].forEach(function(o) { d.addOption(o, o); });
          d.setValue('api');
          d.onChange(function(v) { data.app_type = v; });
        });

      // 4. Lenguajes
      new Setting(contentEl).setName('Lenguajes')
        .addText(function(t) {
          t.setPlaceholder('PHP, JavaScript');
          t.inputEl.setAttribute('list', 'di-dl-langs');
          t.onChange(function(v) { data.languages = v; });
        });

      // 5. Bases de datos
      new Setting(contentEl).setName('Bases de datos')
        .addText(function(t) {
          t.setPlaceholder('MySQL, Redis');
          t.inputEl.setAttribute('list', 'di-dl-dbs');
          t.onChange(function(v) { data.databases = v; });
        });

      // 6. Owner
      new Setting(contentEl).setName('Owner / Responsable')
        .addText(function(t) {
          t.setPlaceholder('nombre.apellido');
          t.inputEl.setAttribute('list', 'di-dl-owners');
          t.onChange(function(v) { data.owner = v.trim(); });
        });

      // 7. Criticidad
      new Setting(contentEl).setName('Criticidad')
        .addDropdown(function(d) {
          ['critical','high','medium','low'].forEach(function(o) { d.addOption(o, o); });
          d.setValue('medium');
          d.onChange(function(v) { data.criticality = v; });
        });

      // 8. Entornos (fila custom)
      var envWrap = contentEl.createEl('div');
      envWrap.style.cssText = 'margin: 8px 0 16px; padding: 12px 0; border-top: 1px solid var(--background-modifier-border);';
      envWrap.createEl('div', { text: 'Entornos (DEV / PRE / PRO)' }).style.cssText = 'font-size:.88rem;font-weight:600;color:var(--text-normal);margin-bottom:8px;';
      var envRow = envWrap.createEl('div');
      envRow.style.cssText = 'display:flex;gap:10px;';
      ['DEV','PRE','PRO'].forEach(function(env) {
        var col = envRow.createEl('div');
        col.style.flex = '1';
        col.createEl('div', { text: env }).style.cssText = 'font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:4px;';
        var inp = col.createEl('input');
        inp.type = 'text';
        inp.placeholder = 'ip / dns';
        inp.style.cssText = 'width:100%;padding:5px 8px;border:1px solid var(--background-modifier-border);border-radius:4px;background:var(--background-primary);color:var(--text-normal);font-size:.82rem;font-family:inherit;box-sizing:border-box;';
        inp.addEventListener('input', (function(e) {
          return function() { data['env_' + e.toLowerCase()] = inp.value.trim(); };
        })(env));
      });

      // 9. Dependencias
      new Setting(contentEl).setName('Dependencias')
        .addText(function(t) {
          t.setPlaceholder('otro-servicio, libreria-x');
          t.inputEl.setAttribute('list', 'di-dl-deps');
          t.onChange(function(v) { data.dependencies = v; });
        });

      // 10. Repo URL
      new Setting(contentEl).setName('URL Repositorio')
        .addText(function(t) {
          t.setPlaceholder('https://bitbucket.org/...');
          t.onChange(function(v) { data.repo_url = v.trim(); });
        });

      // 11. Versión
      new Setting(contentEl).setName('Versión')
        .addText(function(t) {
          t.setPlaceholder('1.0.0');
          t.onChange(function(v) { data.version = v.trim(); });
        });

      // 12. Fecha última actualización
      new Setting(contentEl).setName('Última actualización')
        .addText(function(t) {
          t.inputEl.type = 'date';
          t.setValue(data.last_updated);
          t.onChange(function(v) { data.last_updated = v; });
        });

      // 13. Deprecated
      new Setting(contentEl).setName('Deprecated')
        .addToggle(function(t) {
          t.setValue(false);
          t.onChange(function(v) { data.deprecated = v; });
        });

      // 14. CI/CD
      new Setting(contentEl).setName('CI/CD activo')
        .addToggle(function(t) {
          t.setValue(false);
          t.onChange(function(v) { data.cicd = v; });
        });

      // 15. Descripción
      new Setting(contentEl).setName('Descripción')
        .addTextArea(function(t) {
          t.setPlaceholder('Breve descripción del programa...');
          t.onChange(function(v) { data.description = v; });
          t.inputEl.style.minHeight = '80px';
          t.inputEl.style.width = '100%';
        });

      // Botones
      new Setting(contentEl)
        .addButton(function(b) {
          b.setButtonText('Guardar').setCta().onClick(async function() {
            if (!data.name)    { new Notice('El nombre es obligatorio'); return; }
            if (!data.project) { new Notice('El proyecto es obligatorio'); return; }
            await saveProgram(data);
            self.close();
          });
        })
        .addButton(function(b) {
          b.setButtonText('Cancelar').onClick(function() { self.close(); });
        });
    }
    onClose() { this.contentEl.empty(); }
  };

  new NewProgramModal(app).open();
}

// ── Guardar programa en vault ─────────────────────────
async function saveProgram(data) {
  var Notice = require('obsidian').Notice;

  function toYamlArray(str) {
    if (!str || !str.trim()) return '[]';
    var parts = str.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
    return parts.length ? '[' + parts.join(', ') + ']' : '[]';
  }

  var today = now.toISOString().slice(0, 10);
  var envLines = [];
  if (data.env_dev) envLines.push('  dev: ' + data.env_dev);
  if (data.env_pre) envLines.push('  pre: ' + data.env_pre);
  if (data.env_pro) envLines.push('  pro: ' + data.env_pro);
  var envBlock = envLines.length ? envLines.join('\n') : '  pro: ""';

  var versionLine = data.version ? '\nversion: ' + data.version : '';
  var fm = [
    '---',
    'name: ' + data.name,
    'project: ' + data.project,
    'app_type: ' + data.app_type,
    'languages: ' + toYamlArray(data.languages),
    'databases: ' + toYamlArray(data.databases),
    'owner: ' + (data.owner || ''),
    'criticality: ' + data.criticality,
    'environments:',
    envBlock,
    'dependencies: ' + toYamlArray(data.dependencies),
    'last_updated: ' + (data.last_updated || today),
    'deprecated: ' + data.deprecated,
    'cicd: ' + data.cicd,
    'repo_url: ' + (data.repo_url || ''),
    (data.version ? 'version: ' + data.version : null),
    'description: ' + (data.description || '').replace(/\n/g, ' '),
    'created: ' + today,
    '---',
    '',
    '# ' + data.name,
    '',
    data.description || ''
  ].filter(function(l) { return l !== null; }).join('\n');

  var projectFolder = data.project;
  var targetFolder  = data.deprecated ? (data.project + '/⚠ DEPRECATED') : data.project;
  var filePath      = targetFolder + '/' + data.name + '.md';

  try {
    if (!app.vault.getAbstractFileByPath(projectFolder)) {
      await app.vault.createFolder(projectFolder);
    }
    if (data.deprecated && !app.vault.getAbstractFileByPath(targetFolder)) {
      await app.vault.createFolder(targetFolder);
    }
  } catch(e) { /* carpeta ya existe */ }

  if (app.vault.getAbstractFileByPath(filePath)) {
    new Notice('⚠ Ya existe: ' + filePath);
    return;
  }

  try {
    await app.vault.create(filePath, fm);
    showBanner('✓ Creado: ' + data.name, 'success');
  } catch(e) {
    new Notice('Error al crear: ' + e.message);
  }
}

// ══════════════════════════════════════════════════════
//  MODAL: Editar programa
// ══════════════════════════════════════════════════════
async function openEditProgramModal(row) {
  var obsidian = require('obsidian');
  var Modal   = obsidian.Modal;
  var Setting = obsidian.Setting;
  var Notice  = obsidian.Notice;

  var file = app.vault.getAbstractFileByPath(row.file.path);
  if (!file) { new Notice('No se encontró el fichero'); return; }

  var cache = app.metadataCache.getFileCache(file);
  var fm    = (cache && cache.frontmatter) ? cache.frontmatter : {};
  var envs  = fm.environments || {};

  var pagesNow      = dv.pages().where(function(p) { return p.name && p.project; });
  var existProjects = Array.from(new Set(pagesNow.map(function(p) { return p.project; }).filter(Boolean))).sort();
  var existLangs    = Array.from(new Set(pagesNow.array().flatMap(function(p) { return normArray(p.languages); }))).filter(Boolean).sort();
  var existDbs      = Array.from(new Set(pagesNow.array().flatMap(function(p) { return normArray(p.databases); }))).filter(Boolean).sort();
  var existOwners   = Array.from(new Set(pagesNow.map(function(p) { return p.owner; }).filter(Boolean))).sort();
  var existNames    = pagesNow.map(function(p) { return p.name; }).filter(Boolean).sort();

  function fmArr(val) {
    if (!val) return '';
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
  }

  var data = {
    name:         fm.name         || row.name,
    project:      fm.project      || row.project,
    app_type:     fm.app_type     || row.app_type || 'api',
    languages:    fmArr(fm.languages),
    databases:    fmArr(fm.databases),
    owner:        fm.owner        || '',
    criticality:  fm.criticality  || 'medium',
    env_dev:      envs.dev        ? String(envs.dev) : '',
    env_pre:      envs.pre        ? String(envs.pre) : '',
    env_pro:      envs.pro        ? String(envs.pro) : '',
    dependencies: fmArr(fm.dependencies),
    repo_url:     fm.repo_url     || '',
    version:      fm.version      ? String(fm.version) : '',
    last_updated: fm.last_updated ? String(fm.last_updated).slice(0,10) : '',
    deprecated:   !!fm.deprecated,
    cicd:         fm.cicd === true,
    description:  fm.description  || '',
    created:      fm.created      ? String(fm.created).slice(0,10) : ''
  };

  var EditProgramModal = class extends Modal {
    onOpen() {
      var self = this;
      var contentEl = this.contentEl;
      contentEl.empty();
      contentEl.addClass('di-modal');
      contentEl.createEl('h2', { text: '✏️ Editar: ' + data.name });

      function mkDatalist(id, values) {
        var dl = contentEl.createEl('datalist', { attr: { id: 'edit-' + id } });
        values.forEach(function(v) { dl.createEl('option', { attr: { value: v } }); });
      }
      mkDatalist('dl-proj',   existProjects);
      mkDatalist('dl-langs',  existLangs);
      mkDatalist('dl-dbs',    existDbs);
      mkDatalist('dl-owners', existOwners);
      mkDatalist('dl-deps',   existNames);

      new Setting(contentEl).setName('Nombre del programa')
        .addText(function(t) { t.setValue(data.name); t.onChange(function(v) { data.name = v.trim(); }); });

      new Setting(contentEl).setName('Proyecto')
        .addText(function(t) {
          t.setValue(data.project);
          t.inputEl.setAttribute('list', 'edit-dl-proj');
          t.onChange(function(v) { data.project = v.trim(); });
        });

      new Setting(contentEl).setName('Tipo de aplicación')
        .addDropdown(function(d) {
          ['api','webapp','batch','library','cli'].forEach(function(o) { d.addOption(o, o); });
          d.setValue(data.app_type);
          d.onChange(function(v) { data.app_type = v; });
        });

      new Setting(contentEl).setName('Lenguajes')
        .addText(function(t) {
          t.setValue(data.languages);
          t.inputEl.setAttribute('list', 'edit-dl-langs');
          t.onChange(function(v) { data.languages = v; });
        });

      new Setting(contentEl).setName('Bases de datos')
        .addText(function(t) {
          t.setValue(data.databases);
          t.inputEl.setAttribute('list', 'edit-dl-dbs');
          t.onChange(function(v) { data.databases = v; });
        });

      new Setting(contentEl).setName('Owner / Responsable')
        .addText(function(t) {
          t.setValue(data.owner);
          t.inputEl.setAttribute('list', 'edit-dl-owners');
          t.onChange(function(v) { data.owner = v.trim(); });
        });

      new Setting(contentEl).setName('Criticidad')
        .addDropdown(function(d) {
          ['critical','high','medium','low'].forEach(function(o) { d.addOption(o, o); });
          d.setValue(data.criticality);
          d.onChange(function(v) { data.criticality = v; });
        });

      var envWrap = contentEl.createEl('div');
      envWrap.style.cssText = 'margin:8px 0 16px;padding:12px 0;border-top:1px solid var(--background-modifier-border);';
      envWrap.createEl('div', { text: 'Entornos (DEV / PRE / PRO)' }).style.cssText = 'font-size:.88rem;font-weight:600;color:var(--text-normal);margin-bottom:8px;';
      var envRow = envWrap.createEl('div');
      envRow.style.cssText = 'display:flex;gap:10px;';
      var envVals = { DEV: data.env_dev, PRE: data.env_pre, PRO: data.env_pro };
      ['DEV','PRE','PRO'].forEach(function(env) {
        var col = envRow.createEl('div');
        col.style.flex = '1';
        col.createEl('div', { text: env }).style.cssText = 'font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:4px;';
        var inp = col.createEl('input');
        inp.type = 'text'; inp.placeholder = 'ip / dns';
        inp.value = envVals[env] || '';
        inp.style.cssText = 'width:100%;padding:5px 8px;border:1px solid var(--background-modifier-border);border-radius:4px;background:var(--background-primary);color:var(--text-normal);font-size:.82rem;font-family:inherit;box-sizing:border-box;';
        inp.addEventListener('input', (function(e) {
          return function() { data['env_' + e.toLowerCase()] = inp.value.trim(); };
        })(env));
      });

      new Setting(contentEl).setName('Dependencias')
        .addText(function(t) {
          t.setValue(data.dependencies);
          t.inputEl.setAttribute('list', 'edit-dl-deps');
          t.onChange(function(v) { data.dependencies = v; });
        });

      new Setting(contentEl).setName('URL Repositorio')
        .addText(function(t) { t.setValue(data.repo_url); t.onChange(function(v) { data.repo_url = v.trim(); }); });

      new Setting(contentEl).setName('Versión')
        .addText(function(t) { t.setValue(data.version); t.onChange(function(v) { data.version = v.trim(); }); });

      new Setting(contentEl).setName('Última actualización')
        .addText(function(t) {
          t.inputEl.type = 'date';
          t.setValue(data.last_updated);
          t.onChange(function(v) { data.last_updated = v; });
        });

      new Setting(contentEl).setName('Deprecated')
        .addToggle(function(t) { t.setValue(data.deprecated); t.onChange(function(v) { data.deprecated = v; }); });

      new Setting(contentEl).setName('CI/CD activo')
        .addToggle(function(t) { t.setValue(data.cicd); t.onChange(function(v) { data.cicd = v; }); });

      new Setting(contentEl).setName('Descripción')
        .addTextArea(function(t) {
          t.setValue(data.description);
          t.onChange(function(v) { data.description = v; });
          t.inputEl.style.minHeight = '80px';
          t.inputEl.style.width = '100%';
        });

      new Setting(contentEl)
        .addButton(function(b) {
          b.setButtonText('Actualizar').setCta().onClick(async function() {
            if (!data.name)    { new Notice('El nombre es obligatorio'); return; }
            if (!data.project) { new Notice('El proyecto es obligatorio'); return; }
            await updateProgram(data, file);
            self.close();
          });
        })
        .addButton(function(b) {
          b.setButtonText('Cancelar').onClick(function() { self.close(); });
        });
    }
    onClose() { this.contentEl.empty(); }
  };

  new EditProgramModal(app).open();
}

// ── Actualizar programa existente ──────────────────────
async function updateProgram(data, file) {
  var Notice = require('obsidian').Notice;

  function toYamlArray(str) {
    if (!str || !str.trim()) return '[]';
    var parts = str.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
    return parts.length ? '[' + parts.join(', ') + ']' : '[]';
  }

  var envLines = [];
  if (data.env_dev) envLines.push('  dev: ' + data.env_dev);
  if (data.env_pre) envLines.push('  pre: ' + data.env_pre);
  if (data.env_pro) envLines.push('  pro: ' + data.env_pro);
  var envBlock = envLines.length ? envLines.join('\n') : '  pro: ""';

  var newFm = [
    '---',
    'name: ' + data.name,
    'project: ' + data.project,
    'app_type: ' + data.app_type,
    'languages: ' + toYamlArray(data.languages),
    'databases: ' + toYamlArray(data.databases),
    'owner: ' + (data.owner || ''),
    'criticality: ' + data.criticality,
    'environments:',
    envBlock,
    'dependencies: ' + toYamlArray(data.dependencies),
    'last_updated: ' + (data.last_updated || ''),
    'deprecated: ' + data.deprecated,
    'cicd: ' + data.cicd,
    'repo_url: ' + (data.repo_url || ''),
    (data.version  ? 'version: '  + data.version  : null),
    'description: ' + (data.description || '').replace(/\n/g, ' '),
    (data.created  ? 'created: '  + data.created  : null),
    '---'
  ].filter(function(l) { return l !== null; }).join('\n');

  try {
    var raw = await app.vault.read(file);
    var closeIdx = raw.indexOf('\n---', 4);
    var body = closeIdx !== -1 ? raw.slice(closeIdx + 4) : '';
    await app.vault.modify(file, newFm + '\n' + body);
    showBanner('✓ Actualizado: ' + data.name, 'success');
  } catch(e) {
    new Notice('Error al actualizar: ' + e.message);
  }
}

// ══════════════════════════════════════════════════════
//  CÁLCULO DE KPIs
// ══════════════════════════════════════════════════════
var totalActive   = active.length;
var totalDepr     = deprAll.length;
var totalCicd     = active.where(function(p) { return p.cicd === true; }).length;
var totalCritical = active.where(function(p) { return (p.criticality||'').toLowerCase() === 'critical'; }).length;
var updatedMonth  = active.array().filter(function(p) {
  var d = safeDate(p.last_updated);
  return d && d.startsWith(thisMonth);
}).length;

// ── Lenguajes (solo activos) ──
var langMap = {};
active.array().forEach(function(p) {
  normArray(p.languages).forEach(function(l) { langMap[l] = (langMap[l]||0) + 1; });
});
var langSorted = Object.entries(langMap).sort(function(a,b) { return b[1]-a[1]; });
var langMax    = langSorted.length ? langSorted[0][1] : 1;

// ── Bases de datos (solo activos) ──
var dbMap = {};
active.array().forEach(function(p) {
  normArray(p.databases).forEach(function(d) { dbMap[d] = (dbMap[d]||0) + 1; });
});
var dbSorted = Object.entries(dbMap).sort(function(a,b) { return b[1]-a[1]; });
var dbMax    = dbSorted.length ? dbSorted[0][1] : 1;

// ── App types (solo activos) ──
var typeMap = {};
active.array().forEach(function(p) {
  var t = (p.app_type || 'unknown').toLowerCase();
  typeMap[t] = (typeMap[t]||0) + 1;
});

// ── Criticidad (solo activos) ──
var critMap = { critical: 0, high: 0, medium: 0, low: 0 };
active.array().forEach(function(p) {
  var c = (p.criticality || 'low').toLowerCase();
  if (critMap[c] !== undefined) critMap[c]++;
});

// ── Antigüedad (solo activos) ──
var ageThisMonth=0, age1_3=0, age3_6=0, age6_12=0, age1_2=0, age2plus=0;
active.array().forEach(function(p) {
  var d = safeDate(p.last_updated);
  var days = daysAgo(d);
  if      (days <=  30) ageThisMonth++;
  else if (days <=  90) age1_3++;
  else if (days <= 180) age3_6++;
  else if (days <= 365) age6_12++;
  else if (days <= 730) age1_2++;
  else                  age2plus++;
});

// ══════════════════════════════════════════════════════
//  RENDER
// ══════════════════════════════════════════════════════

// ── Botón nuevo programa ──
var btnNew = dv.container.createEl('button', { cls: 'di-btn-new', text: '＋ Nuevo programa' });
btnNew.addEventListener('click', function() { openNewProgramModal(); });

// ── KPIs ──
var kpiWrap = dv.container.createEl('div');
kpiWrap.innerHTML = '<div class="di-kpi-row">'
  + '<div class="di-kpi-card di-kpi-active"><div class="di-kpi-value">'   + totalActive   + '</div><div class="di-kpi-label">Programas activos</div></div>'
  + '<div class="di-kpi-card di-kpi-depr"><div class="di-kpi-value">'     + totalDepr     + '</div><div class="di-kpi-label">Deprecated</div></div>'
  + '<div class="di-kpi-card di-kpi-cicd"><div class="di-kpi-value">'     + totalCicd     + '</div><div class="di-kpi-label">Con CI/CD</div></div>'
  + '<div class="di-kpi-card di-kpi-updated"><div class="di-kpi-value">'  + updatedMonth  + '</div><div class="di-kpi-label">Actualizados este mes</div></div>'
  + '<div class="di-kpi-card di-kpi-critical"><div class="di-kpi-value">' + totalCritical + '</div><div class="di-kpi-label">Criticidad critical</div></div>'
  + '</div>';

// ── Lenguajes ──
dv.container.createEl('div', { cls: 'di-section-title', text: 'Lenguajes' });
var langWrap = dv.container.createEl('div', { cls: 'di-bars' });
langWrap.innerHTML = langSorted.length
  ? langSorted.map(function(e) { return buildLanguageBar(e[0], e[1], langMax); }).join('')
  : '<span style="color:var(--text-muted);font-size:.82rem">Sin datos</span>';

// ── Bases de datos ──
dv.container.createEl('div', { cls: 'di-section-title', text: 'Bases de datos' });
var dbWrap = dv.container.createEl('div', { cls: 'di-bars' });
dbWrap.innerHTML = dbSorted.length
  ? dbSorted.map(function(e) { return buildLanguageBar(e[0], e[1], dbMax); }).join('')
  : '<span style="color:var(--text-muted);font-size:.82rem">Sin datos</span>';

// ── Tipos de aplicación ──
dv.container.createEl('div', { cls: 'di-section-title', text: 'Tipos de aplicación' });
var pillsWrap = dv.container.createEl('div');
pillsWrap.innerHTML = '<div class="di-pills">'
  + Object.entries(typeMap).sort(function(a,b){return b[1]-a[1];}).map(function(e) {
      return '<span class="di-pill">' + e[0] + ' <span class="di-pill-count">' + e[1] + '</span></span>';
    }).join('')
  + '</div>';

// ── Criticidad ──
dv.container.createEl('div', { cls: 'di-section-title', text: 'Criticidad' });
var critWrap = dv.container.createEl('div');
critWrap.innerHTML = '<div class="di-crit-row">'
  + '<div class="di-crit-card critical"><div class="di-crit-value">' + critMap.critical + '</div><div class="di-crit-label">🔴 Critical</div></div>'
  + '<div class="di-crit-card high"><div class="di-crit-value">'     + critMap.high     + '</div><div class="di-crit-label">🟠 High</div></div>'
  + '<div class="di-crit-card medium"><div class="di-crit-value">'   + critMap.medium   + '</div><div class="di-crit-label">🟡 Medium</div></div>'
  + '<div class="di-crit-card low"><div class="di-crit-value">'      + critMap.low      + '</div><div class="di-crit-label">🟢 Low</div></div>'
  + '</div>';

// ── Antigüedad ──
dv.container.createEl('div', { cls: 'di-section-title', text: 'Antigüedad (última actualización — programas activos)' });
var ageWrap = dv.container.createEl('div');
ageWrap.innerHTML = '<div class="di-age-row">'
  + '<div class="di-age-card" style="border-top:3px solid #4caf50"><div class="di-age-value">' + ageThisMonth + '</div><div class="di-age-label">Este mes</div></div>'
  + '<div class="di-age-card" style="border-top:3px solid #8bc34a"><div class="di-age-value">' + age1_3      + '</div><div class="di-age-label">1–3 meses</div></div>'
  + '<div class="di-age-card" style="border-top:3px solid #ff9800"><div class="di-age-value">' + age3_6      + '</div><div class="di-age-label">3–6 meses</div></div>'
  + '<div class="di-age-card" style="border-top:3px solid #ff5722"><div class="di-age-value">' + age6_12     + '</div><div class="di-age-label">6–12 meses</div></div>'
  + '<div class="di-age-card" style="border-top:3px solid #f44336"><div class="di-age-value">' + age1_2      + '</div><div class="di-age-label">1–2 años</div></div>'
  + '<div class="di-age-card" style="border-top:3px solid #9c27b0"><div class="di-age-value">' + age2plus    + '</div><div class="di-age-label">2+ años</div></div>'
  + '</div>';

// ══════════════════════════════════════════════════════
//  TABLA COMPLETA
// ══════════════════════════════════════════════════════
dv.container.createEl('div', { cls: 'di-section-title', text: 'Inventario de programas' });

// Preparar filas (todos: activos + deprecated)
var rows = all.array().map(function(p) {
  var envs = p.environments || {};
  return {
    name:         p.name || '',
    project:      p.project || '',
    app_type:     (p.app_type || '').toLowerCase(),
    languages:    normArray(p.languages).join(', '),
    databases:    normArray(p.databases).join(', '),
    owner:        p.owner || '',
    criticality:  (p.criticality || '').toLowerCase(),
    pro:          envs.pro ? String(envs.pro) : '',
    version:      p.version ? String(p.version) : '',
    last_updated: safeDate(p.last_updated) || '',
    deprecated:   !!p.deprecated,
    cicd:         p.cicd === true,
    repo_url:     p.repo_url || '',
    file:         p.file
  };
});

// Valores únicos para filtros
var uProjects    = Array.from(new Set(rows.map(function(r){return r.project;}))).filter(Boolean).sort();
var uLangs       = Array.from(new Set(rows.flatMap(function(r){return r.languages.split(',').map(function(s){return s.trim();});}))).filter(Boolean).sort();
var uDbs         = Array.from(new Set(rows.flatMap(function(r){return r.databases.split(',').map(function(s){return s.trim();});}))).filter(Boolean).sort();
var uTypes       = Array.from(new Set(rows.map(function(r){return r.app_type;}))).filter(Boolean).sort();
var uOwners      = Array.from(new Set(rows.map(function(r){return r.owner;}))).filter(Boolean).sort();
var uCriticality = ['critical','high','medium','low'];

// Estado de filtros
var fs = {
  search: '', project: '', language: '', database: '',
  app_type: '', criticality: '', owner: '',
  showDepr: false, showCicd: false,
  sortCol: 'name', sortDir: 1
};

var tableContainer = dv.container.createEl('div');

function filtered() {
  var r = rows;
  var s = fs.search.toLowerCase();
  if (s) r = r.filter(function(row) {
    return (row.name+row.project+row.app_type+row.languages+row.databases+row.owner+row.criticality+row.pro+row.version).toLowerCase().indexOf(s) !== -1;
  });
  if (fs.project)    r = r.filter(function(row){ return row.project === fs.project; });
  if (fs.language)   r = r.filter(function(row){ return row.languages.split(',').map(function(x){return x.trim();}).indexOf(fs.language) !== -1; });
  if (fs.database)   r = r.filter(function(row){ return row.databases.split(',').map(function(x){return x.trim();}).indexOf(fs.database) !== -1; });
  if (fs.app_type)   r = r.filter(function(row){ return row.app_type === fs.app_type; });
  if (fs.criticality)r = r.filter(function(row){ return row.criticality === fs.criticality; });
  if (fs.owner)      r = r.filter(function(row){ return row.owner === fs.owner; });
  if (!fs.showDepr)  r = r.filter(function(row){ return !row.deprecated; });
  if (fs.showCicd)   r = r.filter(function(row){ return row.cicd; });

  var col = fs.sortCol, dir = fs.sortDir;
  return r.slice().sort(function(a,b) {
    var av = a[col] == null ? '' : a[col];
    var bv = b[col] == null ? '' : b[col];
    if (typeof av === 'boolean') av = av ? 1 : 0;
    if (typeof bv === 'boolean') bv = bv ? 1 : 0;
    return av < bv ? -dir : av > bv ? dir : 0;
  });
}

function critBadge(c) {
  var cls = { critical:'di-badge-critical', high:'di-badge-high', medium:'di-badge-medium', low:'di-badge-low' };
  return '<span class="di-badge ' + (cls[c]||'') + '">' + (c||'–') + '</span>';
}

var COLS = [
  { key:'name',         label:'Nombre' },
  { key:'project',      label:'Proyecto' },
  { key:'app_type',     label:'Tipo' },
  { key:'languages',    label:'Lenguajes' },
  { key:'databases',    label:'Bases de datos' },
  { key:'owner',        label:'Owner' },
  { key:'criticality',  label:'Criticidad' },
  { key:'pro',          label:'PRO' },
  { key:'version',      label:'Versión' },
  { key:'last_updated', label:'Última act.' },
  { key:'deprecated',   label:'Depr.' },
  { key:'cicd',         label:'CI/CD' },
  { key:'repo_url',     label:'Repo' }
];

function mkSelect(label, options, key) {
  var sel = document.createElement('select');
  sel.className = 'di-filter-select';
  var def = document.createElement('option');
  def.value = ''; def.textContent = label;
  sel.appendChild(def);
  options.forEach(function(o) {
    var opt = document.createElement('option');
    opt.value = o; opt.textContent = o;
    if (fs[key] === o) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', function() { fs[key] = sel.value; render(); });
  return sel;
}

function render() {
  tableContainer.innerHTML = '';

  // Controles
  var ctrl = document.createElement('div');
  ctrl.className = 'di-controls';

  var inp = document.createElement('input');
  inp.className = 'di-search-input';
  inp.placeholder = '🔍 Buscar por nombre, proyecto, lenguaje, owner...';
  inp.value = fs.search;
  inp.addEventListener('input', function() { fs.search = inp.value; render(); });
  ctrl.appendChild(inp);

  ctrl.appendChild(mkSelect('Proyecto',     uProjects,    'project'));
  ctrl.appendChild(mkSelect('Lenguaje',     uLangs,       'language'));
  ctrl.appendChild(mkSelect('Base de datos',uDbs,         'database'));
  ctrl.appendChild(mkSelect('Tipo',         uTypes,       'app_type'));
  ctrl.appendChild(mkSelect('Criticidad',   uCriticality, 'criticality'));
  ctrl.appendChild(mkSelect('Owner',        uOwners,      'owner'));

  function mkToggle(label, key) {
    var btn = document.createElement('button');
    btn.className = 'di-toggle-btn' + (fs[key] ? ' active' : '');
    btn.textContent = label;
    btn.addEventListener('click', function() { fs[key] = !fs[key]; render(); });
    return btn;
  }
  ctrl.appendChild(mkToggle('Deprecated', 'showDepr'));
  ctrl.appendChild(mkToggle('Solo CI/CD', 'showCicd'));

  tableContainer.appendChild(ctrl);

  var data = filtered();
  var countEl = document.createElement('div');
  countEl.className = 'di-result-count';
  countEl.textContent = data.length + ' resultado' + (data.length !== 1 ? 's' : '');
  tableContainer.appendChild(countEl);

  var wrap = document.createElement('div');
  wrap.className = 'di-table-wrap';

  var tbl = document.createElement('table');
  tbl.className = 'di-table';

  // Cabecera
  var thead = tbl.createTHead();
  var headRow = thead.insertRow();
  COLS.forEach(function(col) {
    var th = document.createElement('th');
    th.textContent = col.label;
    if (fs.sortCol === col.key) th.classList.add(fs.sortDir === 1 ? 'sort-asc' : 'sort-desc');
    th.addEventListener('click', function() {
      if (fs.sortCol === col.key) fs.sortDir *= -1;
      else { fs.sortCol = col.key; fs.sortDir = 1; }
      render();
    });
    headRow.appendChild(th);
  });

  // Filas
  var tbody = tbl.createTBody();
  data.forEach(function(row) {
    var tr = tbody.insertRow();

    // Nombre → botón editar + link interno
    var tdName = tr.insertCell();

    var btnEdit = document.createElement('button');
    btnEdit.className = 'di-edit-btn';
    btnEdit.title = 'Editar programa';
    btnEdit.textContent = '✏️';
    btnEdit.addEventListener('click', function(e) {
      e.stopPropagation();
      openEditProgramModal(row);
    });
    tdName.appendChild(btnEdit);

    var a = document.createElement('a');
    a.className = 'di-link';
    a.textContent = row.name;
    a.href = '#';
    a.addEventListener('click', function(e) {
      e.preventDefault();
      if (row.file) {
        var f = app.vault.getAbstractFileByPath(row.file.path);
        if (f) app.workspace.getLeaf(false).openFile(f);
      }
    });
    tdName.appendChild(a);

    tr.insertCell().textContent = row.project;
    tr.insertCell().textContent = row.app_type;
    tr.insertCell().textContent = row.languages;
    tr.insertCell().textContent = row.databases;
    tr.insertCell().textContent = row.owner;

    var tdCrit = tr.insertCell();
    tdCrit.innerHTML = critBadge(row.criticality);

    tr.insertCell().textContent = row.pro;
    tr.insertCell().textContent = row.version;

    var tdAge = tr.insertCell();
    tdAge.innerHTML = ageBadge(row.last_updated);

    var tdDepr = tr.insertCell();
    if (row.deprecated) tdDepr.innerHTML = '<span class="di-badge di-badge-deprecated">DEPRECATED</span>';

    var tdCicd = tr.insertCell();
    if (row.cicd) tdCicd.innerHTML = '<span class="di-badge di-badge-cicd">✓ CI/CD</span>';

    var tdRepo = tr.insertCell();
    if (row.repo_url) {
      var ar = document.createElement('a');
      ar.className = 'di-ext-link';
      ar.href = row.repo_url;
      ar.target = '_blank';
      ar.rel = 'noopener';
      ar.textContent = '🔗 repo';
      tdRepo.appendChild(ar);
    }
  });

  wrap.appendChild(tbl);
  tableContainer.appendChild(wrap);
}

render();
```
