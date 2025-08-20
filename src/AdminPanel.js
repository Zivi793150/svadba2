import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

const ADMIN_PASSWORD = 'Feyero2024!@#$Secure';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('chats');
  const [chats, setChats] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [digestLoading, setDigestLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, year, all
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatCounts, setChatCounts] = useState({});
  const [visitorMetric, setVisitorMetric] = useState('ip'); // ip | session | hybrid

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchChats();
      fetchAnalytics();
      fetchOrders();
    } else {
      alert('Неверный пароль!');
    }
  };

  const fetchChats = async () => {
    try {
      const response = await fetch('https://svadba2.onrender.com/api/chats');
      const data = await response.json();
      setChats(data);
      
      // Получаем количество сообщений для каждого чата
      const counts = {};
      for (const chat of data) {
        try {
          const countResponse = await fetch(`https://svadba2.onrender.com/api/messages/${chat._id}/count`);
          const countData = await countResponse.json();
          counts[chat._id] = countData.total;
        } catch (error) {
          console.error('Error fetching chat count:', error);
          counts[chat._id] = 0;
        }
      }
      setChatCounts(counts);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('https://svadba2.onrender.com/api/orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://svadba2.onrender.com/api/analytics?period=${selectedPeriod}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTelegramDigest = async () => {
    try {
      setDigestLoading(true);
      const resp = await fetch('https://svadba2.onrender.com/internal/daily-digest', { method: 'POST' });
      if (!resp.ok) throw new Error('Request failed');
      alert('Отчёт отправлен в Telegram администратору.');
    } catch (e) {
      console.error('Digest send error:', e);
      alert('Не удалось отправить отчёт. Проверьте настройки ADMIN_TELEGRAM_ID на бэкенде.');
    } finally {
      setDigestLoading(false);
    }
  };

  const fetchChatMessages = async (chatId) => {
    try {
      const response = await fetch(`https://svadba2.onrender.com/api/messages/${chatId}`);
      const data = await response.json();
      setChatMessages(data);
      setSelectedChat(chatId);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await fetch(`https://svadba2.onrender.com/api/messages/${messageId}`, {
        method: 'DELETE'
      });
      fetchChats();
      if (selectedChat) {
        fetchChatMessages(selectedChat);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}д ${hours % 24}ч`;
    if (hours > 0) return `${hours}ч ${minutes % 60}м`;
    if (minutes > 0) return `${minutes}м ${seconds % 60}с`;
    return `${seconds}с`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      case 'desktop': return '💻';
      default: return '🖥️';
    }
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week': return 'последняя неделя';
      case 'month': return 'последний месяц';
      case 'year': return 'последний год';
      case 'all': return 'все время';
      default: return 'последняя неделя';
    }
  };

  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const renderAnalytics = () => {
    if (!analytics) return <div className="loading">Загрузка аналитики...</div>;

    const {
      overview,
      pageViews,
      devices,
      popularPages,
      buttonClicks,
      conversions,
      productViews,
      chatEngagement,
      userSessions,
      trends,
      topReferrers,
      browserStats,
      osStats,
      hourlyActivity,
      weeklyActivity,
      detailsPage
    } = analytics;

  return (
      <div className="analytics-container">
        {/* Период и обновление */}
        <div className="analytics-header">
          <div className="period-selector">
            <label>Период:</label>
            <select value={selectedPeriod} onChange={(e) => {
              setSelectedPeriod(e.target.value);
              setTimeout(fetchAnalytics, 100);
            }}>
              <option value="week">Последняя неделя</option>
              <option value="month">Последний месяц</option>
              <option value="year">Последний год</option>
              <option value="all">Все время</option>
            </select>
          </div>
          <div className="period-selector">
            <label>Метрика посетителей:</label>
            <select value={visitorMetric} onChange={(e) => setVisitorMetric(e.target.value)}>
              <option value="ip">По IP</option>
              <option value="session">По sessionId</option>
              <option value="hybrid">Гибрид</option>
            </select>
          </div>
          <button onClick={fetchAnalytics} className="refresh-btn" disabled={loading}>
            {loading ? '🔄' : '🔄'} Обновить
          </button>
          <button onClick={sendTelegramDigest} className="refresh-btn" disabled={digestLoading} title="Отправить суточный отчёт администратору в Telegram">
            {digestLoading ? '📨' : '📨'} Отправить отчёт в TG
          </button>
        </div>

        {/* Основные метрики */}
        <div className="metrics-grid">
          <div className="metric-card primary">
            <div className="metric-icon">👥</div>
            <div className="metric-content">
              <h3>Посетители</h3>
              <div className="metric-value">
                {formatNumber(
                  visitorMetric === 'ip' ? (overview.visitorsBreakdown?.byIp || overview.totalVisitors) :
                  visitorMetric === 'session' ? (overview.visitorsBreakdown?.bySession || overview.totalVisitors) :
                  (overview.visitorsBreakdown?.hybrid || overview.totalVisitors)
                )}
              </div>
              <div className="metric-change positive">
                +{calculateGrowth(overview.totalVisitors, overview.previousVisitors)}% vs предыдущий период
              </div>
            </div>
          </div>

          <div className="metric-card primary">
            <div className="metric-icon">📄</div>
            <div className="metric-content">
              <h3>Просмотры</h3>
              <div className="metric-value">{formatNumber(overview.totalPageViews)}</div>
              <div className="metric-change positive">
                +{calculateGrowth(overview.totalPageViews, overview.previousPageViews)}% vs предыдущий период
              </div>
            </div>
          </div>

          <div className="metric-card primary">
            <div className="metric-icon">💬</div>
            <div className="metric-content">
              <h3>Чаты</h3>
              <div className="metric-value">{formatNumber(overview.totalChats)}</div>
              <div className="metric-change positive">
                +{calculateGrowth(overview.totalChats, overview.previousChats)}% vs предыдущий период
              </div>
            </div>
          </div>

          <div className="metric-card primary">
            <div className="metric-icon">🎯</div>
            <div className="metric-content">
              <h3>Конверсии</h3>
              <div className="metric-value">{formatNumber(overview.totalConversions)}</div>
              <div className="metric-change positive">
                +{calculateGrowth(overview.totalConversions, overview.previousConversions)}% vs предыдущий период
              </div>
            </div>
          </div>
        </div>

        {/* Дополнительные метрики */}
        <div className="metrics-grid secondary">
          <div className="metric-card">
            <div className="metric-icon">⏱️</div>
            <div className="metric-content">
              <h3>Время на сайте</h3>
              <div className="metric-value">{formatDuration(overview.avgSessionDuration)}</div>
              <div className="metric-subtitle">в среднем</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📱</div>
            <div className="metric-content">
              <h3>Мобильные</h3>
              <div className="metric-value">{overview.mobilePercentage}%</div>
              <div className="metric-subtitle">от всех посетителей</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🔄</div>
            <div className="metric-content">
              <h3>Возвраты</h3>
              <div className="metric-value">{overview.bounceRate}%</div>
              <div className="metric-subtitle">процент отказов</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📈</div>
            <div className="metric-content">
              <h3>Страниц/сессия</h3>
              <div className="metric-value">{overview.pagesPerSession}</div>
              <div className="metric-subtitle">в среднем</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🔄</div>
            <div className="metric-content">
              <h3>Сессий/посетитель</h3>
              <div className="metric-value">
                {userSessions.total > 0 ? (userSessions.totalSessions / userSessions.total).toFixed(1) : 0}
              </div>
              <div className="metric-subtitle">в среднем</div>
            </div>
          </div>
        </div>

        {/* Детали страницы "Подробнее" */}
        <div className="analytics-section">
          <h2>🧩 Детальная страница ("Подробнее") — за период</h2>
          {detailsPage ? (
            <div className="metrics-grid secondary">
              <div className="metric-card">
                <div className="metric-icon">👁️</div>
                <div className="metric-content">
                  <h3>Просмотры</h3>
                  <div className="metric-value">{formatNumber(detailsPage.views || 0)}</div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">⭐</div>
                <div className="metric-content">
                  <h3>Рейтинг</h3>
                  <div className="metric-value">{detailsPage.ratings?.avg || 0} / 5</div>
                  <div className="metric-subtitle">оценок: {formatNumber(detailsPage.ratings?.count || 0)}</div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">📩</div>
                <div className="metric-content">
                  <h3>Клики мессенджеров</h3>
                  <div className="metric-value">TG {formatNumber(detailsPage.clicks?.telegram || 0)} | WA {formatNumber(detailsPage.clicks?.whatsapp || 0)}</div>
                  {typeof detailsPage.clicks?.ctr === 'number' && (
                    <div className="metric-subtitle">CTR по мессенджерам: {detailsPage.clicks.ctr}%</div>
                  )}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">🛒</div>
                <div className="metric-content">
                  <h3>Переходов к оформлению</h3>
                  <div className="metric-value">{formatNumber(detailsPage.orderStarts || 0)}</div>
                  {typeof detailsPage.ctr === 'number' && (
                    <div className="metric-subtitle">CTR в оформление: {detailsPage.ctr}%</div>
                  )}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">⏱️</div>
                <div className="metric-content">
                  <h3>Время на странице</h3>
                  <div className="metric-value">{detailsPage.avgTimeSec || 0}s</div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">🧪</div>
                <div className="metric-content">
                  <h3>Опросник (модал)</h3>
                  <div className="metric-value">Закрыли: {formatNumber(detailsPage.survey?.closed || 0)}</div>
                  <div className="metric-subtitle">Причины:</div>
                  <div className="metric-subtitle">
                    {(detailsPage.survey?.reasons && Object.keys(detailsPage.survey.reasons).length > 0)
                      ? Object.entries(detailsPage.survey.reasons).map(([k,v]) => (
                          <span key={k} style={{marginRight:8}}>{k}: {formatNumber(v)}</span>
                        ))
                      : 'нет данных'}
                  </div>
                  <div className="metric-subtitle">Обратная связь:</div>
                  <div className="metric-subtitle">
                    {(detailsPage.survey?.feedback && Object.keys(detailsPage.survey.feedback).length > 0)
                      ? Object.entries(detailsPage.survey.feedback).map(([k,v]) => (
                          <span key={k} style={{marginRight:8}}>{k}: {formatNumber(v)}</span>
                        ))
                      : 'нет данных'}
                  </div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">❓</div>
                <div className="metric-content">
                  <h3>Мини-опросы</h3>
                  <div className="metric-subtitle">Понравилась презентация:</div>
                  <div className="metric-value">Да {formatNumber(detailsPage.polls?.wouldOrder?.yes || 0)} | Нет {formatNumber(detailsPage.polls?.wouldOrder?.no || 0)}</div>
                  <div className="metric-subtitle">Хотели бы на свадьбе:</div>
                  <div className="metric-value">Да {formatNumber(detailsPage.polls?.wouldHave?.yes || 0)} | Подумаю {formatNumber(detailsPage.polls?.wouldHave?.no || 0)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-data">Нет данных</div>
          )}
        </div>

        {/* Устройства */}
        <div className="analytics-section">
          <h2>📱 Устройства ({getPeriodLabel()})</h2>
          <div className="devices-grid">
            {devices.map((device, index) => (
              <div key={index} className="device-card">
                <div className="device-icon">{getDeviceIcon(device.type)}</div>
                <div className="device-info">
                  <h3>{device.type === 'mobile' ? 'Мобильные' : device.type === 'tablet' ? 'Планшеты' : 'Десктопы'}</h3>
                  <div className="device-stats">
                    <div className="device-percentage">{device.percentage}%</div>
                    <div className="device-count">{formatNumber(device.count)} посетителей</div>
                  </div>
                </div>
                <div className="device-bar">
                  <div className="device-bar-fill" style={{ width: `${device.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Популярные страницы */}
        <div className="analytics-section">
          <h2>📄 Популярные страницы ({getPeriodLabel()})</h2>
          <div className="pages-list">
            {popularPages.map((page, index) => (
              <div key={index} className="page-item">
                <div className="page-rank">#{index + 1}</div>
                <div className="page-info">
                  <div className="page-name">{page.name}</div>
                  <div className="page-path">{page.path}</div>
                </div>
                <div className="page-stats">
                  <div className="page-views">{formatNumber(page.views)} просмотров</div>
                  <div className="page-percentage">{page.percentage}%</div>
                </div>
                <div className="page-bar">
                  <div className="page-bar-fill" style={{ width: `${page.percentage}%` }}></div>
                </div>
            </div>
          ))}
        </div>
      </div>

        {/* Маркетинг и реклама */}
        <div className="analytics-section">
          <h2>📢 Маркетинг и реклама ({getPeriodLabel()})</h2>
          <div className="marketing-grid">
            {/* Источники трафика */}
            <div className="marketing-card">
              <h3>🌐 Источники трафика</h3>
              <div className="traffic-sources">
                {topReferrers.map((ref, idx) => (
                  <div key={idx} className="traffic-source-item">
                    <div className="source-info">
                      <span className="source-name">{ref.source}</span>
                      <span className="source-url">{ref.url !== '-' ? ref.url : 'Прямые переходы'}</span>
                    </div>
                    <div className="source-stats">
                      <span className="source-visits">{formatNumber(ref.visits)}</span>
                      <span className="source-percentage">{ref.percentage}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: `${ref.percentage}%`}}></div>
                    </div>
                  </div>
                ))}
                
                {/* UTM-метки */}
                {analytics.utmStats && Object.keys(analytics.utmStats).length > 0 && (
                  <div className="utm-section">
                    <h4>📊 UTM-метки</h4>
                    {Object.entries(analytics.utmStats)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([key, count], idx) => {
                        const [source, medium, campaign] = key.split(':');
                        return (
                          <div key={idx} className="utm-item">
                            <div className="utm-info">
                              <span className="utm-source">{source}</span>
                              <span className="utm-medium">{medium}</span>
                              <span className="utm-campaign">{campaign}</span>
                            </div>
                            <span className="utm-count">{count}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Рекламные платформы */}
            <div className="marketing-card">
              <h3>📱 Рекламные платформы</h3>
              <div className="platform-stats">
                {analytics.adPlatforms && Object.values(analytics.adPlatforms).some(platform => platform.count > 0) ? (
                  Object.entries(analytics.adPlatforms)
                    .filter(([, platform]) => platform.count > 0)
                    .map(([key, platform]) => (
                      <div key={key} className="platform-item">
                        <div className="platform-icon">
                          {key === 'vk' ? '📘' : 
                           key === 'yandex' ? '🔍' : 
                           key === 'google' ? '🔎' : 
                           key === 'instagram' ? '📷' : 
                           key === 'facebook' ? '📘' : '📱'}
                        </div>
                        <div className="platform-info">
                          <span className="platform-name">{platform.name}</span>
                          <span className="platform-metric">
                            {platform.campaigns.length > 0 
                              ? `${platform.campaigns.length} кампаний` 
                              : 'Рекламные переходы'}
                          </span>
                  </div>
                        <div className="platform-data">
                          <span className="platform-value">{platform.count}</span>
                          <span className="platform-label">кликов</span>
                  </div>
                </div>
              ))
            ) : (
                  <div className="no-data">
                    Нет данных о рекламных кампаниях
                    <br />
                    <small>Данные появятся после настройки UTM-меток</small>
                  </div>
                )}
                
                {/* Инструкция по настройке */}
                <div className="setup-instructions">
                  <h4>🔧 Как настроить отслеживание:</h4>
                  <div className="instruction-item">
                    <strong>VK:</strong> Добавьте в ссылки: <code>?utm_source=vk&utm_medium=banner&utm_campaign=название</code>
                  </div>
                  <div className="instruction-item">
                    <strong>Яндекс.Директ:</strong> <code>?utm_source=yandex&utm_medium=cpc&utm_campaign=название</code>
                  </div>
                  <div className="instruction-item">
                    <strong>Google Ads:</strong> <code>?utm_source=google&utm_medium=cpc&utm_campaign=название</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO аналитика */}
        <div className="analytics-section">
          <h2>🔍 SEO аналитика ({getPeriodLabel()})</h2>
          <div className="seo-grid">
            {/* Поисковые запросы */}
            <div className="seo-card">
              <h3>🔎 Поисковые запросы</h3>
              <div className="search-queries">
                {analytics.searchQueriesList && analytics.searchQueriesList.length > 0 ? (
                  analytics.searchQueriesList.map((query, idx) => (
                    <div key={idx} className="query-item">
                      <span className="query-text">{query.query}</span>
                      <span className="query-count">{query.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    Нет данных о поисковых запросах
                    <br />
                    <small>Данные появятся после настройки отслеживания</small>
                  </div>
                )}
                
                {/* Инструкция по улучшению SEO */}
                <div className="setup-instructions">
                  <h4>🔧 Как улучшить SEO:</h4>
                  <div className="instruction-item">
                    <strong>Поисковые запросы:</strong> Добавьте мета-теги и оптимизируйте контент
                  </div>
                  <div className="instruction-item">
                    <strong>Технические метрики:</strong> Используйте PageSpeed Insights и Lighthouse
                  </div>
                </div>
              </div>
            </div>

            {/* Внешние ссылки */}
            <div className="seo-card">
              <h3>🔗 Внешние ссылки</h3>
              <div className="backlinks">
                {analytics.backlinks && analytics.backlinks.length > 0 ? (
                  analytics.backlinks.map((link, idx) => (
                    <div key={idx} className="backlink-item">
                      <span className="backlink-domain">{link.domain}</span>
                      <span className="backlink-count">{link.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    Нет данных о внешних ссылках
                    <br />
                    <small>Данные появятся после настройки отслеживания</small>
                  </div>
                )}
                
                {/* Инструкция по внешним ссылкам */}
                <div className="setup-instructions">
                  <h4>🔧 Как получить внешние ссылки:</h4>
                  <div className="instruction-item">
                    <strong>Гостевые посты:</strong> Публикуйтесь на свадебных блогах
                  </div>
                  <div className="instruction-item">
                    <strong>Партнерства:</strong> Сотрудничайте с фотографами и организаторами
                  </div>
                </div>
              </div>
            </div>

            {/* Технические метрики */}
            <div className="seo-card">
              <h3>⚙️ Технические метрики</h3>
              <div className="tech-metrics">
                {analytics.pageSpeed || analytics.coreWebVitals || analytics.performanceIndex ? (
                  <>
                    {analytics.pageSpeed && (
                      <div className="metric-row">
                        <span className="metric-label">Скорость загрузки</span>
                        <span className="metric-value">
                          Быстро: {analytics.pageSpeed.fast || 0} | 
                          Средне: {analytics.pageSpeed.medium || 0} | 
                          Медленно: {analytics.pageSpeed.slow || 0}
                        </span>
                      </div>
                    )}
                    {analytics.coreWebVitals && (
                      <div className="metric-row">
                        <span className="metric-label">Core Web Vitals</span>
                        <span className="metric-value">
                          {Object.values(analytics.coreWebVitals).some(v => v.good > 0) ? '✅ Данные доступны' : '❌ Нет данных'}
                        </span>
                      </div>
                    )}
                    {analytics.performanceIndex && (
                      <div className="metric-row">
                        <span className="metric-label">Индекс производительности</span>
                        <span className="metric-value">{analytics.performanceIndex}/100</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-data">
                    Нет данных о технических метриках
                    <br />
                    <small>Данные появятся после настройки отслеживания</small>
                  </div>
                )}
                
                {/* Инструкция по техническим метрикам */}
                <div className="setup-instructions">
                  <h4>🔧 Как улучшить технические метрики:</h4>
                  <div className="instruction-item">
                    <strong>Page Speed:</strong> Оптимизируйте изображения и используйте CDN
                  </div>
                  <div className="instruction-item">
                    <strong>Core Web Vitals:</strong> Минимизируйте JavaScript и CSS
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Клики по кнопкам */}
        <div className="analytics-section">
          <h2>🖱️ Популярные кнопки ({getPeriodLabel()})</h2>
          <div className="buttons-grid">
            {buttonClicks.map((button, index) => (
              <div key={index} className="button-card">
                <div className="button-rank">#{index + 1}</div>
                <div className="button-info">
                  <h3>{button.text}</h3>
                  <div className="button-id">{button.id}</div>
                </div>
                <div className="button-stats">
                  <div className="button-clicks">{formatNumber(button.clicks)} кликов</div>
                  <div className="button-percentage">{button.percentage}%</div>
                </div>
                <div className="button-bar">
                  <div className="button-bar-fill" style={{ width: `${button.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Конверсии */}
        <div className="analytics-section">
          <h2>🎯 Конверсии ({getPeriodLabel()})</h2>
          <div className="conversions-grid">
            {conversions.map((conversion, index) => (
              <div key={index} className="conversion-card">
                <div className="conversion-icon">
                  {conversion.action === 'chat_opened' ? '💬' :
                   conversion.action === 'telegram_clicked' ? '📱' :
                   conversion.action === 'whatsapp_clicked' ? '📞' :
                   conversion.action === 'order_page_visited' ? '🛒' :
                   conversion.action === 'lead_submit_whatsapp' ? '📝' :
                   conversion.action === 'lead_submit_telegram' ? '📝' :
                   conversion.action === 'lead_modal_open' ? '📋' :
                   conversion.action === 'lead_backend_success' ? '✅' :
                   conversion.action === 'lead_backend_error' ? '❌' :
                   conversion.action === 'bot_start' ? '🤖' :
                   conversion.action === 'lead_processed' ? '🔗' :
                   conversion.action === 'admin_leads_request' ? '👨‍💼' :
                   conversion.action === 'bot_interaction' ? '🔄' :
                   conversion.action === 'bot_text_message' ? '💬' :
                   '🎯'}
                </div>
                <div className="conversion-info">
                  <h3>
                    {conversion.action === 'chat_opened' ? 'Открытие чата' :
                     conversion.action === 'telegram_clicked' ? 'Клик Telegram' :
                     conversion.action === 'whatsapp_clicked' ? 'Клик WhatsApp' :
                     conversion.action === 'order_page_visited' ? 'Страница заказа' :
                     conversion.action === 'lead_submit_whatsapp' ? 'Заявка WhatsApp' :
                     conversion.action === 'lead_submit_telegram' ? 'Заявка Telegram' :
                     conversion.action === 'lead_modal_open' ? 'Открытие формы заявки' :
                     conversion.action === 'lead_backend_success' ? 'Заявка отправлена успешно' :
                     conversion.action === 'lead_backend_error' ? 'Ошибка отправки заявки' :
                     conversion.action === 'bot_start' ? 'Начало работы с ботом' :
                     conversion.action === 'lead_processed' ? 'Заявка обработана в боте' :
                     conversion.action === 'admin_leads_request' ? 'Запрос списка заявок' :
                     conversion.action === 'bot_interaction' ? 'Взаимодействие с ботом' :
                     conversion.action === 'bot_text_message' ? 'Текстовое сообщение в боте' :
                     conversion.action}
                  </h3>
                  <div className="conversion-page">{conversion.page}</div>
                  {conversion.metadata && Object.keys(conversion.metadata).length > 0 && (
                    <div className="conversion-metadata">
                      {Object.entries(conversion.metadata).map(([key, value]) => (
                        <span key={key} className="metadata-item">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="conversion-stats">
                  <div className="conversion-count">{formatNumber(conversion.count)}</div>
                  <div className="conversion-rate">{conversion.rate}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Заявки */}
        <div className="analytics-section">
          <h2>📝 Заявки ({getPeriodLabel()})</h2>
          <div className="leads-grid">
            {conversions.filter(c => 
              c.action.includes('lead') || 
              c.action.includes('bot') || 
              c.action === 'admin_leads_request'
            ).map((conversion, index) => (
              <div key={`lead-${index}`} className="lead-card">
                <div className="lead-icon">
                  {conversion.action === 'lead_submit_whatsapp' ? '📱' :
                   conversion.action === 'lead_submit_telegram' ? '📱' :
                   conversion.action === 'lead_modal_open' ? '📋' :
                   conversion.action === 'lead_backend_success' ? '✅' :
                   conversion.action === 'lead_backend_error' ? '❌' :
                   conversion.action === 'lead_processed' ? '🔗' :
                   conversion.action === 'bot_start' ? '🤖' :
                   conversion.action === 'admin_leads_request' ? '👨‍💼' :
                   conversion.action === 'bot_interaction' ? '🔄' :
                   conversion.action === 'bot_text_message' ? '💬' :
                   '📝'}
                </div>
                <div className="lead-info">
                  <h3>
                    {conversion.action === 'lead_submit_whatsapp' ? 'Заявка WhatsApp' :
                     conversion.action === 'lead_submit_telegram' ? 'Заявка Telegram' :
                     conversion.action === 'lead_modal_open' ? 'Открытие формы заявки' :
                     conversion.action === 'lead_backend_success' ? 'Заявка отправлена успешно' :
                     conversion.action === 'lead_backend_error' ? 'Ошибка отправки заявки' :
                     conversion.action === 'lead_processed' ? 'Заявка обработана в боте' :
                     conversion.action === 'bot_start' ? 'Начало работы с ботом' :
                     conversion.action === 'admin_leads_request' ? 'Запрос списка заявок' :
                     conversion.action === 'bot_interaction' ? 'Взаимодействие с ботом' :
                     conversion.action === 'bot_text_message' ? 'Текстовое сообщение в боте' :
                     conversion.action}
                  </h3>
                  <div className="lead-page">{conversion.page}</div>
                  {conversion.metadata && Object.keys(conversion.metadata).length > 0 && (
                    <div className="lead-metadata">
                      {Object.entries(conversion.metadata).map(([key, value]) => (
                        <span key={key} className="metadata-item">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="lead-stats">
                  <div className="lead-count">{formatNumber(conversion.count)}</div>
                  <div className="lead-rate">{conversion.rate}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Просмотры товаров/карточек */}
        <div className="analytics-section">
          <h2>🧩 Просмотры карточек ({getPeriodLabel()})</h2>
          {productViews && productViews.length > 0 ? (
            <div className="products-grid">
              {productViews.map((group, idx) => (
                <div key={idx} className="product-group-card">
                  <div className="product-group-header">
                    <h3>{group.type === 'presentation' ? 'Свадебные презентации' : group.type === 'invitation' ? 'Видео‑приглашения' : 'Другое'}</h3>
                    <div className="product-group-total">{formatNumber(group.total)} просмотров</div>
                  </div>
                  <div className="product-titles-list">
                    {group.titles.map((t, i) => (
                      <div key={i} className="product-title-item">
                        <div className="product-title-name">{t.title}</div>
                        <div className="product-title-count">{formatNumber(t.count)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">
              Нет данных о просмотрах карточек за выбранный период
            </div>
          )}
        </div>

        {/* Вовлеченность в чат */}
        <div className="analytics-section">
          <h2>💬 Вовлеченность в чат ({getPeriodLabel()})</h2>
          <div className="chat-stats-grid">
            <div className="chat-stat-card">
              <div className="chat-stat-icon">💬</div>
              <div className="chat-stat-info">
                <h3>Сообщений отправлено</h3>
                <div className="chat-stat-value">{formatNumber(chatEngagement.messagesSent)}</div>
              </div>
            </div>
            <div className="chat-stat-card">
              <div className="chat-stat-icon">📤</div>
              <div className="chat-stat-info">
                <h3>Файлов отправлено</h3>
                <div className="chat-stat-value">{formatNumber(chatEngagement.filesSent)}</div>
              </div>
            </div>
            <div className="chat-stat-card">
              <div className="chat-stat-icon">⏱️</div>
              <div className="chat-stat-info">
                <h3>Время в чате</h3>
                <div className="chat-stat-value">{formatDuration(chatEngagement.avgTimeInChat)}</div>
              </div>
            </div>
            <div className="chat-stat-card">
              <div className="chat-stat-icon">👥</div>
              <div className="chat-stat-info">
                <h3>Активных чатов</h3>
                <div className="chat-stat-value">{formatNumber(chatEngagement.activeChats)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Посетители и сессии */}
        <div className="analytics-section">
          <h2>👥 Посетители и сессии ({getPeriodLabel()})</h2>
          <div className="sessions-stats">
            <div className="session-stat">
              <h3>Уникальные посетители</h3>
              <div className="session-value">
                {formatNumber(
                  visitorMetric === 'ip' ? (analytics.visitors?.byIp?.total || userSessions.total) :
                  visitorMetric === 'session' ? (analytics.visitors?.bySession?.total || userSessions.total) :
                  (analytics.visitors?.hybrid?.total || userSessions.total)
                )}
              </div>
            </div>
            <div className="session-stat">
              <h3>Всего сессий</h3>
              <div className="session-value">{formatNumber(userSessions.totalSessions)}</div>
            </div>
            <div className="session-stat">
              <h3>Новые посетители</h3>
              <div className="session-value">
                {formatNumber(
                  visitorMetric === 'ip' ? (analytics.visitors?.byIp?.new ?? userSessions.newVisitors) :
                  visitorMetric === 'session' ? (analytics.visitors?.bySession?.new ?? userSessions.newVisitors) :
                  (analytics.visitors?.hybrid?.new ?? userSessions.newVisitors)
                )}
              </div>
            </div>
            <div className="session-stat">
              <h3>Возвращающиеся</h3>
              <div className="session-value">
                {formatNumber(
                  visitorMetric === 'ip' ? (analytics.visitors?.byIp?.returning ?? userSessions.returningVisitors) :
                  visitorMetric === 'session' ? (analytics.visitors?.bySession?.returning ?? userSessions.returningVisitors) :
                  (analytics.visitors?.hybrid?.returning ?? userSessions.returningVisitors)
                )}
              </div>
            </div>
            <div className="session-stat">
              <h3>Средняя длительность</h3>
              <div className="session-value">{formatDuration(userSessions.avgDuration)}</div>
            </div>
          </div>
        </div>

        {/* Тренды */}
        {trends && (
          <div className="analytics-section">
            <h2>📈 Тренды ({getPeriodLabel()})</h2>
            <div className="trends-grid">
              {trends.map((trend, index) => (
                <div key={index} className="trend-card">
                  <div className="trend-header">
                    <h3>{trend.metric}</h3>
                    <div className={`trend-change ${trend.change >= 0 ? 'positive' : 'negative'}`}>
                      {trend.change >= 0 ? '+' : ''}{trend.change}%
                    </div>
                  </div>
                  <div className="trend-chart">
                    {trend.data.map((point, i) => (
                      <div key={i} className="trend-point" style={{ height: `${point}%` }}></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Источники трафика */}
        {topReferrers && (
          <div className="analytics-section">
            <h2>🔗 Источники трафика ({getPeriodLabel()})</h2>
            <div className="referrers-list">
              {topReferrers.map((referrer, index) => (
                <div key={index} className="referrer-item">
                  <div className="referrer-rank">#{index + 1}</div>
                  <div className="referrer-info">
                    <div className="referrer-name">{referrer.source}</div>
                    <div className="referrer-url">{referrer.url}</div>
                  </div>
                  <div className="referrer-stats">
                    <div className="referrer-visits">{formatNumber(referrer.visits)} визитов</div>
                    <div className="referrer-percentage">{referrer.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Браузеры и ОС */}
        <div className="analytics-section">
          <h2>🌐 Браузеры и ОС ({getPeriodLabel()})</h2>
          <div className="tech-stats-grid">
            <div className="tech-section">
              <h3>Браузеры</h3>
              {browserStats.map((browser, index) => (
                <div key={index} className="tech-item">
                  <div className="tech-name">{browser.name}</div>
                  <div className="tech-bar">
                    <div className="tech-bar-fill" style={{ width: `${browser.percentage}%` }}></div>
                  </div>
                  <div className="tech-percentage">{browser.percentage}%</div>
                </div>
              ))}
            </div>
            <div className="tech-section">
              <h3>Операционные системы</h3>
              {osStats.map((os, index) => (
                <div key={index} className="tech-item">
                  <div className="tech-name">{os.name}</div>
                  <div className="tech-bar">
                    <div className="tech-bar-fill" style={{ width: `${os.percentage}%` }}></div>
                  </div>
                  <div className="tech-percentage">{os.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Почасовая активность */}
        {hourlyActivity && (
          <div className="analytics-section">
            <h2>🕐 Почасовая активность ({getPeriodLabel()})</h2>
            <div className="hourly-chart">
              {hourlyActivity.map((hour, index) => (
                <div key={index} className="hour-bar">
                  <div className="hour-label">{hour.hour}:00</div>
                  <div className="hour-value" style={{ height: `${hour.percentage}%` }}>
                    <span className="hour-count">{formatNumber(hour.count)}</span>
                  </div>
            </div>
          ))}
        </div>
      </div>
        )}

        {/* Недельная активность */}
        {weeklyActivity && (
          <div className="analytics-section">
            <h2>📅 Недельная активность ({getPeriodLabel()})</h2>
            <div className="weekly-chart">
              {weeklyActivity.map((day, index) => (
                <div key={index} className="day-bar">
                  <div className="day-label">{day.day}</div>
                  <div className="day-value" style={{ height: `${day.percentage}%` }}>
                    <span className="day-count">{formatNumber(day.count)}</span>
                  </div>
                  </div>
              ))}
                  </div>
                </div>
        )}
      </div>
    );
  };

  const renderOrders = () => (
    <div className="orders-container">
      <div className="orders-header">
        <h2>🛒 Заказы ({orders.length})</h2>
        <button onClick={fetchOrders} className="refresh-btn">🔄 Обновить</button>
      </div>
      
      <div className="orders-grid">
        {orders.map((order) => (
          <div key={order._id} className="order-item">
            <div className="order-header">
              <div className="order-id">#{order.orderId}</div>
              <div className="order-status">
                <span className={`status-badge ${order.paymentStatus}`}>
                  {order.paymentStatus === 'paid' ? '✅ Оплачен' :
                   order.paymentStatus === 'pending' ? '⏳ Ожидает оплаты' :
                   order.paymentStatus === 'cancelled' ? '❌ Отменен' :
                   order.paymentStatus === 'failed' ? '💥 Ошибка' : '❓ Неизвестно'}
                </span>
              </div>
            </div>
            <div className="order-details">
              <div className="order-product">{order.productTitle}</div>
              <div className="order-variant">
                {order.variant === 'anim' ? 'С оживлением' : 'Без оживления'}
                {order.selection && ` - ${order.selection}`}
              </div>
              <div className="order-prices">
                <div className="total-price">Общая стоимость: {order.totalPrice.toLocaleString('ru-RU')} ₽</div>
                <div className="prepay-price">Предоплата: {order.prepayAmount.toLocaleString('ru-RU')} ₽</div>
                <div className="remaining-price">Осталось: {(order.totalPrice - order.prepayAmount).toLocaleString('ru-RU')} ₽</div>
              </div>
            </div>
            <div className="order-customer">
              <div className="customer-name">{order.customerInfo?.name || 'Имя не указано'}</div>
              <div className="customer-email">{order.customerInfo?.email || 'Email не указан'}</div>
              <div className="customer-phone">{order.customerInfo?.phone || 'Телефон не указан'}</div>
            </div>
            <div className="order-footer">
              <div className="order-date">{formatDate(order.createdAt)}</div>
              {order.yookassaPaymentId && (
                <div className="payment-id">ID: {order.yookassaPaymentId}</div>
              )}
            </div>
            </div>
          ))}
        </div>
      </div>
  );

  const renderChats = () => (
    <div className="chats-container">
      <div className="chats-header">
        <h2>💬 Чаты ({chats.length})</h2>
        <button onClick={fetchChats} className="refresh-btn">🔄 Обновить</button>
      </div>
      
      <div className="chats-grid">
        <div className="chats-list">
          {chats.map((chat) => (
            <div 
              key={chat._id} 
              className={`chat-item ${selectedChat === chat._id ? 'active' : ''}`}
              onClick={() => fetchChatMessages(chat._id)}
            >
              <div className="chat-header">
                <div className="chat-id">#{chat._id.slice(-6)}</div>
                <div className="chat-date">{formatDate(chat.lastMessage?.createdAt || chat.lastMessage?.timestamp)}</div>
              </div>
              <div className="chat-preview">
                {chat.lastMessage?.text 
                  ? chat.lastMessage.text.substring(0, 50) + (chat.lastMessage.text.length > 50 ? '...' : '')
                  : 'Нет сообщений'
                }
              </div>
              <div className="chat-stats">
                <span className="chat-messages">
                  {chat.lastMessage?.sender === 'user' ? '👤' : '🤖'} 
                  {chat.lastMessage?.sender === 'user' ? 'Пользователь' : 'Админ'}
                </span>
                <span className="chat-count">
                  {chatCounts[chat._id] || 0} сообщений
                </span>
                {chat.lastMessage?.fileUrl && (
                  <span className="chat-files">📎</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedChat && (
          <div className="chat-messages-container">
            <div className="messages-header">
              <h3>Чат #{selectedChat.slice(-6)}</h3>
              <button onClick={() => setSelectedChat(null)} className="close-btn">✕</button>
            </div>
            <div className="messages-list">
              {chatMessages.map((message) => (
                <div key={message._id} className={`message ${message.sender === 'user' ? 'user' : 'admin'}`}>
                  <div className="message-header">
                    <span className="message-sender">
                      {message.sender === 'user' ? '👤 Пользователь' : '🤖 Админ'}
                    </span>
                    <span className="message-time">{formatDate(message.createdAt || message.timestamp)}</span>
                    <button 
                      onClick={() => deleteMessage(message._id)}
                      className="delete-btn"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="message-content">
                    {message.text && <div className="message-text">{message.text}</div>}
                    {message.fileUrl && (
                      <div className="message-file">
                        <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                          📎 {message.fileName || 'Файл'}
                        </a>
                  </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
        </div>
        )}
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-form">
          <h1>🔐 Админ-панель</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Войти</button>
          </form>
      </div>
    </div>
  );
} 

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🎛️ Админ-панель Фейеро</h1>
        <div className="admin-tabs">
          <button 
            className={activeTab === 'chats' ? 'active' : ''} 
            onClick={() => setActiveTab('chats')}
          >
            💬 Чаты
          </button>
          <button 
            className={activeTab === 'orders' ? 'active' : ''} 
            onClick={() => setActiveTab('orders')}
          >
            🛒 Заказы
          </button>
          <button 
            className={activeTab === 'analytics' ? 'active' : ''} 
            onClick={() => setActiveTab('analytics')}
          >
            📊 Аналитика
          </button>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="logout-btn">
          🚪 Выйти
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'chats' ? renderChats() : 
         activeTab === 'orders' ? renderOrders() : 
         renderAnalytics()}
      </div>
    </div>
  );
};

export default AdminPanel; 