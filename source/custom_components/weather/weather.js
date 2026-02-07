/*!
 * 天气组件脚本
 * Weather Component JavaScript
 * 支持高德天气API和模拟数据
 * 版本: v1.0
 */

(function() {
  'use strict';

  // 组件配置
  const WEATHER_CONFIG = {
    // 高德天气API配置
    apiKey: '', // 高德API Key，可在 https://lbs.amap.com/ 申请
    apiUrl: 'https://restapi.amap.com/v3/weather/weatherInfo',
    defaultCity: '北京',
    useMockData: true, // 是否使用模拟数据（默认true，无需API Key）
    updateInterval: 600000, // 10分钟更新一次
    units: 'metric' // metric: 摄氏度
  };

  // 天气图标映射
  const WEATHER_ICONS = {
    '晴': '☀️',
    '多云': '⛅',
    '阴': '☁️',
    '小雨': '🌦️',
    '中雨': '🌧️',
    '大雨': '🌧️',
    '暴雨': '⛈️',
    '雾': '🌫️',
    '霾': '🌫️',
    '雪': '❄️',
    'default': '🌤️'
  };

  // 模拟天气数据
  const MOCK_WEATHER_DATA = {
    '北京': {
      city: '北京',
      temp: 22,
      desc: '晴',
      humidity: 45,
      windSpeed: 3.5
    },
    '上海': {
      city: '上海',
      temp: 20,
      desc: '多云',
      humidity: 60,
      windSpeed: 2.8
    },
    '广州': {
      city: '广州',
      temp: 26,
      desc: '小雨',
      humidity: 75,
      windSpeed: 1.5
    },
    '深圳': {
      city: '深圳',
      temp: 25,
      desc: '多云',
      humidity: 70,
      windSpeed: 2.0
    }
  };

  /**
   * 初始化天气组件
   */
  function initWeather() {
    const weatherContainer = document.querySelector('.cc-weather');
    if (!weatherContainer) {
      console.warn('[Weather Component] 容器元素未找到');
      return;
    }

    console.log('[Weather Component] 初始化中...');

    // 添加加载状态
    weatherContainer.classList.add('loading');

    // 获取天气数据
    fetchWeatherData()
      .then(data => {
        renderWeather(weatherContainer, data);
        weatherContainer.classList.remove('loading');
        weatherContainer.classList.add('cc-weather--animated');
      })
      .catch(error => {
        console.error('[Weather Component] 获取天气数据失败:', error);
        weatherContainer.classList.remove('loading');
        weatherContainer.classList.add('error');
        showError(weatherContainer, '获取天气数据失败');
      });

    // 设置自动更新
    setInterval(() => {
      fetchWeatherData()
        .then(data => renderWeather(weatherContainer, data))
        .catch(error => console.error('[Weather Component] 自动更新失败:', error));
    }, WEATHER_CONFIG.updateInterval);
  }

  /**
   * 获取天气数据
   * @returns {Promise<Object>} 天气数据
   */
  function fetchWeatherData() {
    if (WEATHER_CONFIG.useMockData || !WEATHER_CONFIG.apiKey) {
      console.log('[Weather Component] 使用模拟数据');
      return new Promise(resolve => {
        setTimeout(() => {
          // 获取随机城市数据
          const cities = Object.keys(MOCK_WEATHER_DATA);
          const randomCity = cities[Math.floor(Math.random() * cities.length)];
          resolve(MOCK_WEATHER_DATA[randomCity]);
        }, 500);
      });
    }

    // 真实API调用（高德天气）
    const url = `${WEATHER_CONFIG.apiUrl}?key=${WEATHER_CONFIG.apiKey}&city=${encodeURIComponent(WEATHER_CONFIG.defaultCity)}&extensions=base&output=json`;

    return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.status === '1' && data.lives && data.lives.length > 0) {
          const live = data.lives[0];
          return {
            city: live.city,
            temp: parseInt(live.temperature),
            desc: live.weather,
            humidity: parseInt(live.humidity),
            windSpeed: parseFloat(live.windpower)
          };
        } else {
          throw new Error('API返回数据格式错误');
        }
      });
  }

  /**
   * 渲染天气信息
   * @param {Element} container 容器元素
   * @param {Object} data 天气数据
   */
  function renderWeather(container, data) {
    const icon = WEATHER_ICONS[data.desc] || WEATHER_ICONS.default;
    const temp = data.temp;
    const desc = data.desc;
    const humidity = data.humidity;
    const windSpeed = data.windSpeed;

    container.innerHTML = `
      <div class="cc-weather__header">
        <h3 class="cc-weather__title">
          <span>🌤️</span>
          <span>实时天气</span>
        </h3>
        <div class="cc-weather__location">
          <span>📍</span>
          <span>${data.city}</span>
        </div>
      </div>

      <div class="cc-weather__temp">
        ${temp}°C
      </div>

      <div class="cc-weather__desc">
        ${icon} ${desc}
      </div>

      <div class="cc-weather__details">
        <div class="cc-weather__detail">
          <div class="cc-weather__detail-label">湿度</div>
          <div class="cc-weather__detail-value">${humidity}%</div>
        </div>
        <div class="cc-weather__detail">
          <div class="cc-weather__detail-label">风速</div>
          <div class="cc-weather__detail-value">${windSpeed}m/s</div>
        </div>
      </div>

      <div class="cc-weather__updated">
        ${new Date().toLocaleTimeString()} 更新
      </div>
    `;
  }

  /**
   * 显示错误信息
   * @param {Element} container 容器元素
   * @param {string} message 错误消息
   */
  function showError(container, message) {
    container.innerHTML = `
      <div class="cc-weather__header">
        <h3 class="cc-weather__title">🌤️ 天气</h3>
      </div>
      <div class="cc-weather__error">
        ⚠️ ${message}
      </div>
    `;
  }

  /**
   * 检测深色模式
   */
  function checkDarkMode() {
    const weatherContainer = document.querySelector('.cc-weather');
    if (!weatherContainer) return;

    const isDark = document.body.classList.contains('dark') ||
                   window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (isDark) {
      weatherContainer.classList.add('cc-weather--dark');
    } else {
      weatherContainer.classList.remove('cc-weather--dark');
    }
  }

  // 监听主题变化
  const themeObserver = new MutationObserver(checkDarkMode);

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initWeather();
      checkDarkMode();

      // 监听主题变化
      themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
      });
    });
  } else {
    initWeather();
    checkDarkMode();

    themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', checkDarkMode);

})();