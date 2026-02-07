#!/usr/bin/env node

/**
 * 自定义组件管理脚本
 * 用于快速启用/禁用组件
 *
 * 使用方法：
 *   node manage.js enable <component-name>
 *   node manage.js disable <component-name>
 *   node manage.js status
 *   node manage.js list
 */

const fs = require('fs');
const path = require('path');

// 路径配置
const ROOT_DIR = path.resolve(__dirname, '../..');
const CONFIG_FILE = path.join(__dirname, 'components.config.yml');
const THEME_CONFIG_FILE = path.join(ROOT_DIR, '_config.butterfly.yml');
const INJECT_COMMENT_START = '# inject:start';
const INJECT_COMMENT_END = '# inject:end';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 读取 YAML 配置文件
 */
function readYAML(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // 简单的 YAML 解析器
    const lines = content.split('\n');
    const result = {};
    let currentSection = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      if (trimmed.endsWith(':') && !trimmed.includes('"') && !trimmed.includes("'")) {
        currentSection = trimmed.slice(0, -1);
        result[currentSection] = {};
      } else if (trimmed.startsWith('- ') && currentSection) {
        if (!Array.isArray(result[currentSection])) {
          result[currentSection] = [];
        }
        result[currentSection].push(trimmed.slice(2));
      } else if (trimmed.includes(':') && currentSection) {
        const [key, ...valueParts] = trimmed.split(':');
        result[currentSection][key.trim()] = valueParts.join(':').trim();
      }
    });

    return result;
  } catch (error) {
    log(`读取配置文件失败: ${error.message}`, 'red');
    return null;
  }
}

/**
 * 写入 YAML 配置文件
 */
function writeYAML(filePath, data) {
  try {
    let content = '';
    for (const [section, value] of Object.entries(data)) {
      content += `${section}:\n`;
      for (const [key, val] of Object.entries(value)) {
        if (Array.isArray(val)) {
          val.forEach(item => {
            content += `  - ${item}\n`;
          });
        } else if (typeof val === 'object' && val !== null) {
          content += `  ${key}:\n`;
          for (const [subKey, subVal] of Object.entries(val)) {
            content += `    ${subKey}: ${subVal}\n`;
          }
        } else {
          content += `  ${key}: ${val}\n`;
        }
      }
      content += '\n';
    }
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    log(`写入配置文件失败: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 读取主题配置文件
 */
function readThemeConfig() {
  try {
    return fs.readFileSync(THEME_CONFIG_FILE, 'utf8');
  } catch (error) {
    log(`读取主题配置文件失败: ${error.message}`, 'red');
    return null;
  }
}

/**
 * 写入主题配置文件
 */
function writeThemeConfig(content) {
  try {
    fs.writeFileSync(THEME_CONFIG_FILE, content, 'utf8');
    return true;
  } catch (error) {
    log(`写入主题配置文件失败: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 更新主题配置的 inject 部分
 */
function updateInjectConfig(componentName, enable) {
  const config = readThemeConfig();
  if (!config) return false;

  const lines = config.split('\n');
  const injectStartIndex = lines.findIndex(line => line.trim() === INJECT_COMMENT_START);
  const injectEndIndex = lines.findIndex(line => line.trim() === INJECT_COMMENT_END);

  if (injectStartIndex === -1 || injectEndIndex === -1) {
    log('未找到 inject 配置区域，请确保配置文件中包含 inject:start 和 inject:end 标记', 'red');
    return false;
  }

  // 查找要操作的行
  const cssLinePattern = new RegExp(`# \\/custom_components\\/${componentName}\\/${componentName}\\.css`);
  const jsLinePattern = new RegExp(`# \\/custom_components\\/${componentName}\\/${componentName}\\.js`);

  let cssLineIndex = -1;
  let jsLineIndex = -1;

  for (let i = injectStartIndex; i < injectEndIndex; i++) {
    if (cssLinePattern.test(lines[i])) {
      cssLineIndex = i;
    }
    if (jsLinePattern.test(lines[i])) {
      jsLineIndex = i;
    }
  }

  if (cssLineIndex === -1 || jsLineIndex === -1) {
    log(`未找到 ${componentName} 组件的 inject 配置`, 'red');
    return false;
  }

  if (enable) {
    // 启用：取消注释
    lines[cssLineIndex] = lines[cssLineIndex].replace(/^# /, '');
    lines[jsLineIndex] = lines[jsLineIndex].replace(/^# /, '');
    log(`✅ 已启用 ${componentName} 组件的 inject 配置`, 'green');
  } else {
    // 禁用：添加注释
    if (!lines[cssLineIndex].startsWith('#')) {
      lines[cssLineIndex] = '# ' + lines[cssLineIndex];
    }
    if (!lines[jsLineIndex].startsWith('#')) {
      lines[jsLineIndex] = '# ' + lines[jsLineIndex];
    }
    log(`❌ 已禁用 ${componentName} 组件的 inject 配置`, 'yellow');
  }

  return writeThemeConfig(lines.join('\n'));
}

/**
 * 启用组件
 */
function enableComponent(componentName) {
  log(`\n🚀 启用组件: ${componentName}\n`, 'cyan');

  // 读取配置
  const config = readYAML(CONFIG_FILE);
  if (!config || !config.components || !config.components[componentName]) {
    log(`❌ 组件 "${componentName}" 不存在`, 'red');
    process.exit(1);
  }

  // 更新组件配置
  config.components[componentName].enable = 'true';
  if (!writeYAML(CONFIG_FILE, config)) {
    process.exit(1);
  }
  log(`✅ 已更新 ${CONFIG_FILE}`, 'green');

  // 更新 inject 配置
  if (!updateInjectConfig(componentName, true)) {
    log('⚠️ inject 配置更新失败，请手动更新', 'yellow');
  }

  log('\n✨ 组件启用完成！', 'green');
  log('\n请执行以下命令重新构建网站：', 'cyan');
  log('  hexo clean && hexo generate\n', 'bright');
}

/**
 * 禁用组件
 */
function disableComponent(componentName) {
  log(`\n🛑 禁用组件: ${componentName}\n`, 'cyan');

  // 读取配置
  const config = readYAML(CONFIG_FILE);
  if (!config || !config.components || !config.components[componentName]) {
    log(`❌ 组件 "${componentName}" 不存在`, 'red');
    process.exit(1);
  }

  // 更新组件配置
  config.components[componentName].enable = 'false';
  if (!writeYAML(CONFIG_FILE, config)) {
    process.exit(1);
  }
  log(`✅ 已更新 ${CONFIG_FILE}`, 'green');

  // 更新 inject 配置
  if (!updateInjectConfig(componentName, false)) {
    log('⚠️ inject 配置更新失败，请手动更新', 'yellow');
  }

  log('\n✨ 组件禁用完成！', 'green');
  log('\n请执行以下命令重新构建网站：', 'cyan');
  log('  hexo clean && hexo generate\n', 'bright');
}

/**
 * 查看组件状态
 */
function showStatus() {
  log('\n📊 组件状态列表\n', 'cyan');

  const config = readYAML(CONFIG_FILE);
  if (!config || !config.components) {
    log('❌ 配置文件读取失败', 'red');
    process.exit(1);
  }

  for (const [name, info] of Object.entries(config.components)) {
    const status = info.enable === 'true' ? '✅ 已启用' : '❌ 未启用';
    const priority = info.priority || '-';
    log(`${name}:`, 'bright');
    log(`  状态: ${status}`);
    log(`  名称: ${info.name || '-'}`);
    log(`  描述: ${info.description || '-'}`);
    log(`  优先级: ${priority}`);
    log('');
  }
}

/**
 * 列出所有组件
 */
function listComponents() {
  log('\n📦 可用组件列表\n', 'cyan');

  const config = readYAML(CONFIG_FILE);
  if (!config || !config.components) {
    log('❌ 配置文件读取失败', 'red');
    process.exit(1);
  }

  Object.keys(config.components).forEach(name => {
    log(`  • ${name}`, 'bright');
  });

  log('\n使用说明:', 'cyan');
  log(`  启用组件: node ${path.basename(__filename)} enable <component-name>`);
  log(`  禁用组件: node ${path.basename(__filename)} disable <component-name>`);
  log(`  查看状态: node ${path.basename(__filename)} status\n`);
}

// 主程序
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const componentName = args[1];

  if (!command) {
    log('\n⚡ 自定义组件管理脚本', 'cyan');
    log('使用方法:', 'bright');
    log(`  node ${path.basename(__filename)} enable <component-name>`);
    log(`  node ${path.basename(__filename)} disable <component-name>`);
    log(`  node ${path.basename(__filename)} status`);
    log(`  node ${path.basename(__filename)} list\n`);
    process.exit(1);
  }

  switch (command) {
    case 'enable':
      if (!componentName) {
        log('❌ 请指定要启用的组件名称', 'red');
        process.exit(1);
      }
      enableComponent(componentName);
      break;

    case 'disable':
      if (!componentName) {
        log('❌ 请指定要禁用的组件名称', 'red');
        process.exit(1);
      }
      disableComponent(componentName);
      break;

    case 'status':
      showStatus();
      break;

    case 'list':
      listComponents();
      break;

    default:
      log(`❌ 未知命令: ${command}`, 'red');
      process.exit(1);
  }
}

// 运行主程序
main();