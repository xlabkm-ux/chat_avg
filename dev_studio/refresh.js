#!/usr/bin/env node
/**
 * Dev Studio — Project Architect: refresh.js
 * 
 * Сканирует проект agsys и генерирует PROJECT_MAP.md —
 * живую карту архитектуры для человека и ИИ-агента.
 * 
 * Запуск: node dev_studio/refresh.js
 * Зависимости: нет (чистый Node.js)
 */

const fs = require('fs');
const path = require('path');

// ── Конфигурация ────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = [
  { dir: path.join(ROOT, 'cons', 'chatavg'), label: 'chatavg' },
  { dir: path.join(ROOT, 'cons', 'mcp_gateway'), label: 'mcp_gateway' },
];
const OUTPUT = path.join(ROOT, 'PROJECT_MAP.md');
const IGNORE = ['node_modules', '.git', 'data', 'data_test', 'webui_original', 'scratch', 'dist', 'build'];
const EXTENSIONS = ['.js', '.mjs', '.ts'];

// ── Утилиты ─────────────────────────────────────────────

function walkDir(dir, base) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkDir(fullPath, base));
    } else if (EXTENSIONS.includes(path.extname(entry.name)) && !entry.name.endsWith('.d.ts')) {
      results.push({
        absolute: fullPath,
        relative: path.relative(base, fullPath).replace(/\\/g, '/')
      });
    }
  }
  return results;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const result = {
    exports: [],
    imports: [],
    routes: [],
    envVars: [],
    classes: [],
    description: '',
    lineCount: lines.length,
    sizeKB: (Buffer.byteLength(content) / 1024).toFixed(1),
    contentLen: content.length
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;

    // ── Экспорты ──
    // module.exports = new ChatService();
    let m = trimmed.match(/^module\.exports\s*=\s*(.+?);?\s*$/);
    if (m && !result.exports.includes(m[1])) result.exports.push(m[1]);

    // module.exports = { foo, bar }
    m = trimmed.match(/^module\.exports\s*=\s*\{(.+)\}/);
    if (m) {
      const items = m[1].split(',').map(s => s.trim().split(':')[0].trim()).filter(Boolean);
      for (const item of items) {
        if (!result.exports.includes(item)) result.exports.push(item);
      }
    }

    // exports.foo = ...
    m = trimmed.match(/^exports\.(\w+)\s*=/);
    if (m && !result.exports.includes(m[1])) result.exports.push(m[1]);

    // export default / export const / export function
    m = trimmed.match(/^export\s+(default\s+)?(const|let|var|function|class)\s+(\w+)/);
    if (m && !result.exports.includes(m[3])) result.exports.push(m[3]);

    // ── Импорты ──
    // const foo = require('./bar');
    m = trimmed.match(/(?:const|let|var)\s+\{?([^}=]+)\}?\s*=\s*require\(['"]([^'"]+)['"]\)/);
    if (m) {
      result.imports.push({
        symbols: m[1].trim().replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean),
        from: m[2]
      });
    }

    // require('./bar') without assignment (side-effect)
    m = trimmed.match(/^require\(['"]([^'"]+)['"]\)/);
    if (m) {
      result.imports.push({ symbols: ['(side-effect)'], from: m[1] });
    }

    // import ... from '...'
    m = trimmed.match(/import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/);
    if (m) {
      result.imports.push({
        symbols: m[1].replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean),
        from: m[2]
      });
    }

    // ── API роуты ──
    m = trimmed.match(/(?:app|router)\.(get|post|put|delete|patch|use)\s*\(\s*['"]([^'"]+)['"]/);
    if (m) {
      const route = { method: m[1].toUpperCase(), path: m[2] };
      if (!result.routes.some(r => r.method === route.method && r.path === route.path)) {
        result.routes.push(route);
      }
    }

    // ── Переменные окружения ──
    const envMatches = trimmed.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g);
    for (const em of envMatches) {
      if (!result.envVars.includes(em[1])) result.envVars.push(em[1]);
    }

    // ── Классы ──
    m = trimmed.match(/^class\s+(\w+)(\s+extends\s+(\w+))?/);
    if (m) {
      if (!result.classes.some(c => c.name === m[1])) {
        result.classes.push({ name: m[1], extends: m[3] || null });
      }
    }
  }

  // Первый JSDoc-комментарий как описание
  const docMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)(?:\n|\*\/)/);
  if (docMatch) result.description = docMatch[1].trim();

  return result;
}

function parseEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return [];
  const content = fs.readFileSync(envPath, 'utf-8');
  const vars = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const m = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=/);
    if (m) {
      // Маскируем значения ключей и секретов
      const isSensitive = /key|secret|password|token/i.test(m[1]);
      const value = trimmed.split('=').slice(1).join('=').trim();
      vars.push({
        name: m[1],
        value: isSensitive ? '***' : (value.length > 60 ? value.substring(0, 60) + '...' : value)
      });
    }
  }
  return vars;
}

// ── Генерация Mermaid ───────────────────────────────────

function buildHighLevelMermaid(componentMap) {
  const lines = ['```mermaid', 'graph LR'];
  const nodeIds = new Map();
  let counter = 0;

  function nodeId(label) {
    if (!nodeIds.has(label)) {
      nodeIds.set(label, `H${counter++}`);
    }
    return nodeIds.get(label);
  }

  const folderDeps = new Set();

  for (const [component, files] of Object.entries(componentMap)) {
    for (const f of files) {
      const fromFolder = path.dirname(f.relative).replace(/\\/g, '/');
      const fromLabel = `${component}/${fromFolder}`;
      
      for (const imp of f.analysis.imports) {
        if (imp.from.startsWith('.')) {
          const sourceDir = path.dirname(f.absolute);
          const targetAbs = path.resolve(sourceDir, imp.from);
          
          for (const [tComp, tFiles] of Object.entries(componentMap)) {
            for (const tf of tFiles) {
              if (tf.absolute === targetAbs || tf.absolute === (targetAbs + '.js') || tf.absolute === (targetAbs + '.ts')) {
                const toFolder = path.dirname(tf.relative).replace(/\\/g, '/');
                const toLabel = `${tComp}/${toFolder}`;
                
                if (fromLabel !== toLabel) {
                  folderDeps.add(`${fromLabel}|${toLabel}`);
                }
              }
            }
          }
        }
      }
    }
  }

  // Рисуем узлы и связи
  const folders = new Set();
  folderDeps.forEach(dep => {
    const [from, to] = dep.split('|');
    folders.add(from);
    folders.add(to);
  });

  folders.forEach(f => {
    lines.push(`  ${nodeId(f)}["${f}"]`);
  });

  folderDeps.forEach(dep => {
    const [from, to] = dep.split('|');
    lines.push(`  ${nodeId(from)} --> ${nodeId(to)}`);
  });

  lines.push('```');
  return lines.join('\n');
}

function buildMermaid(componentMap) {
  const lines = ['```mermaid', 'graph LR'];
  const nodeIds = new Map();
  let counter = 0;

  function nodeId(label) {
    if (!nodeIds.has(label)) {
      nodeIds.set(label, `N${counter++}`);
    }
    return nodeIds.get(label);
  }

  // Группировка по папкам для наглядности
  for (const [component, files] of Object.entries(componentMap)) {
    const compId = nodeId(component);
    lines.push(`  subgraph ${compId}["${component}"]`);

    // Группируем файлы по директории
    const folders = {};
    files.forEach(f => {
      const folder = path.dirname(f.relative).replace(/\\/g, '/');
      if (!folders[folder]) folders[folder] = [];
      folders[folder].push(f);
    });

    for (const [folder, folderFiles] of Object.entries(folders)) {
      if (folder !== '.') {
        const folderId = nodeId(`${component}/${folder}`);
        lines.push(`    subgraph ${folderId}["${folder}"]`);
        folderFiles.forEach(f => {
          const baseName = path.basename(f.relative);
          const fId = nodeId(`${component}/${f.relative}`);
          lines.push(`      ${fId}["${baseName}"]`);
        });
        lines.push(`    end`);
      } else {
        folderFiles.forEach(f => {
          const baseName = path.basename(f.relative);
          const fId = nodeId(`${component}/${f.relative}`);
          lines.push(`    ${fId}["${baseName}"]`);
        });
      }
    }
    lines.push('  end');
  }

  // Связи между компонентами (inter-component imports)
  const drawn = new Set();
  for (const [component, files] of Object.entries(componentMap)) {
    for (const f of files) {
      const fromId = nodeId(`${component}/${f.relative}`);

      for (const imp of f.analysis.imports) {
        const importPath = imp.from;
        if (importPath.startsWith('.')) {
          // Вычисляем абсолютный путь цели импорта относительно текущего файла
          const sourceDir = path.dirname(f.absolute);
          const targetAbs = path.resolve(sourceDir, importPath);
          
          // Ищем целевой файл в нашей карте
          for (const [tComp, tFiles] of Object.entries(componentMap)) {
            for (const tf of tFiles) {
              // Сравниваем абсолютные пути или относительные
              if (tf.absolute === targetAbs || tf.absolute === (targetAbs + '.js') || tf.absolute === (targetAbs + '.ts')) {
                const toId = nodeId(`${tComp}/${tf.relative}`);
                const edgeKey = `${fromId}-${toId}`;
                if (!drawn.has(edgeKey) && fromId !== toId) {
                  lines.push(`  ${fromId} --> ${toId}`);
                  drawn.add(edgeKey);
                }
              }
            }
          }
        }
      }
    }
  }

  lines.push('```');
  return lines.join('\n');
}

// ── Генерация PROJECT_MAP.md ────────────────────────────

function generateMap() {
  console.log('[DevStudio] Сканирование проекта...');
  
  const componentMap = {};
  const allEnvVars = new Set();

  for (const scanDef of SCAN_DIRS) {
    const files = walkDir(scanDef.dir, scanDef.dir);
    console.log(`  [${scanDef.label}] Найдено ${files.length} файлов`);
    
    componentMap[scanDef.label] = files.map(f => {
      const analysis = analyzeFile(f.absolute);
      analysis.envVars.forEach(v => allEnvVars.add(v));
      return { ...f, analysis };
    });
  }

  // Собираем .env
  const envVars = parseEnvFile(path.join(ROOT, 'cons', 'chatavg', '.env.example'));
  const envFromCode = parseEnvFile(path.join(ROOT, 'cons', 'chatavg', '.env'));

  // ── Формируем документ ──
  // Сбор статистики
  let totalFiles = 0;
  let totalLines = 0;
  let totalChars = 0;
  for (const files of Object.values(componentMap)) {
    totalFiles += files.length;
    files.forEach(f => {
      totalLines += f.analysis.lineCount;
      totalChars += f.analysis.contentLen;
    });
  }
  const estTokens = Math.ceil(totalChars / 4);
  const contextPressure = ((estTokens / 128000) * 100).toFixed(1);
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const sections = [];

  sections.push(`# 🗺️ PROJECT MAP — agsys`);
  sections.push(`> Автоматически сгенерировано: \`${now}\``);
  sections.push(`> Скрипт: \`node dev_studio/refresh.js\``);
  sections.push('');
  sections.push('## 📊 Telemetry / Context Health');
  sections.push(`| Metric | Value | Note |`);
  sections.push(`|---|---|---|`);
  sections.push(`| **Total Files** | \`${totalFiles}\` | Только JS/TS исходники |`);
  sections.push(`| **Total Lines** | \`${totalLines}\` | Суммарно по проекту |`);
  sections.push(`| **Project Weight** | \`~${estTokens.toLocaleString()} tokens\` | Оценка (4 символа/токен) |`);
  sections.push(`| **Context Pressure** | \`${contextPressure}%\` | Нагрузка на окно 128k (Full Scan) |`);
  sections.push(`| **Map Efficiency** | \`~${(100 - (Buffer.byteLength(JSON.stringify(componentMap)) / totalChars) * 100).toFixed(0)}%\` | Экономия контекста через карту |`);
  sections.push('');
  sections.push('---');
  sections.push('');

  // ── Обзор компонентов ──
  sections.push('## Высокоуровневая архитектура');
  sections.push('> Связи между основными модулями и папками');
  sections.push('');
  sections.push(buildHighLevelMermaid(componentMap));
  sections.push('');

  sections.push('## Детальная карта компонентов');
  sections.push('> Полный граф зависимостей всех файлов проекта');
  sections.push('');
  sections.push(buildMermaid(componentMap));
  sections.push('');

  // ── Детали по каждому компоненту ──
  for (const [component, files] of Object.entries(componentMap)) {
    sections.push(`## Компонент: \`${component}\``);
    sections.push('');

    // Таблица файлов
    sections.push('| Файл | Строк | Размер | Описание |');
    sections.push('|---|---|---|---|');
    for (const f of files) {
      const a = f.analysis;
      const desc = a.description || (a.classes.length > 0 ? `Класс: ${a.classes.map(c => c.name).join(', ')}` : '—');
      sections.push(`| \`${f.relative}\` | ${a.lineCount} | ${a.sizeKB} KB | ${desc} |`);
    }
    sections.push('');

    // Подробности по каждому файлу
    for (const f of files) {
      const a = f.analysis;
      
      // Пропускаем файлы без интересного содержимого
      if (a.exports.length === 0 && a.routes.length === 0 && a.classes.length === 0) continue;

      sections.push(`### \`${f.relative}\``);

      if (a.classes.length > 0) {
        for (const cls of a.classes) {
          sections.push(`- **Класс**: \`${cls.name}\`${cls.extends ? ` extends \`${cls.extends}\`` : ''}`);
        }
      }

      if (a.exports.length > 0) {
        sections.push(`- **Экспорт**: ${a.exports.map(e => '`' + e + '`').join(', ')}`);
      }

      if (a.routes.length > 0) {
        sections.push('- **Роуты**:');
        for (const r of a.routes) {
          sections.push(`  - \`${r.method} ${r.path}\``);
        }
      }

      if (a.imports.length > 0) {
        sections.push('- **Зависимости**:');
        for (const imp of a.imports) {
          if (imp.from.startsWith('.')) {
            sections.push(`  - \`${imp.from}\` → ${imp.symbols.join(', ')}`);
          }
        }
      }

      sections.push('');
    }
  }

  // ── Переменные окружения ──
  sections.push('## Переменные окружения');
  sections.push('');
  sections.push('Переменные, используемые в коде:');
  sections.push('');
  sections.push('| Переменная | Используется в |');
  sections.push('|---|---|');

  const envUsage = {};
  for (const [component, files] of Object.entries(componentMap)) {
    for (const f of files) {
      for (const v of f.analysis.envVars) {
        if (!envUsage[v]) envUsage[v] = [];
        envUsage[v].push(`${component}/${path.basename(f.relative)}`);
      }
    }
  }

  for (const [varName, usedIn] of Object.entries(envUsage).sort()) {
    sections.push(`| \`${varName}\` | ${usedIn.join(', ')} |`);
  }
  sections.push('');

  // ── API Реестр ──
  sections.push('## API Реестр');
  sections.push('');
  sections.push('Все обнаруженные HTTP-эндпоинты:');
  sections.push('');
  sections.push('| Метод | Путь | Файл |');
  sections.push('|---|---|---|');

  for (const [component, files] of Object.entries(componentMap)) {
    for (const f of files) {
      for (const r of f.analysis.routes) {
        sections.push(`| \`${r.method}\` | \`${r.path}\` | \`${component}/${f.relative}\` |`);
      }
    }
  }
  sections.push('');

  // ── Граф зависимостей (текстовый) ──
  sections.push('## Граф зависимостей (внутренние модули)');
  sections.push('');

  for (const [component, files] of Object.entries(componentMap)) {
    sections.push(`### ${component}`);
    sections.push('```');
    for (const f of files) {
      const internalDeps = f.analysis.imports
        .filter(i => i.from.startsWith('.'))
        .map(i => path.basename(i.from, '.js'));
      
      if (internalDeps.length > 0) {
        sections.push(`${path.basename(f.relative)} → ${internalDeps.join(', ')}`);
      }
    }
    sections.push('```');
    sections.push('');
  }

  // Записываем файл
  const content = sections.join('\n');
  fs.writeFileSync(OUTPUT, content, 'utf-8');
  console.log(`[DevStudio] ✅ PROJECT_MAP.md сгенерирован (${(content.length / 1024).toFixed(1)} KB)`);

  // Обновляем визуализатор (viewer.html) путём инъекции данных в шаблон
  const TEMPLATE_PATH = path.join(ROOT, 'dev_studio', 'viewer_template.html');
  const VIEWER_PATH = path.join(ROOT, 'dev_studio', 'viewer.html');
  
  if (fs.existsSync(TEMPLATE_PATH)) {
      let template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
      // Кодируем контент в Base64 для безопасной передачи в HTML
      const b64Content = Buffer.from(content).toString('base64');
      const hydrated = template.replace('{{PROJECT_MAP_CONTENT_B64}}', b64Content);
      fs.writeFileSync(VIEWER_PATH, hydrated, 'utf-8');
      console.log(`[DevStudio] ✅ viewer.html обновлен (автономный режим B64)`);
  }
}

// ── Запуск ───────────────────────────────────────────────
generateMap();
