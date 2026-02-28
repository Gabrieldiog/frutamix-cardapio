self.addEventListener('push', function (event) {
  if (!event.data) return;

  var data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'Novo Pedido!', body: event.data.text() };
  }

  var title = data.title || 'Novo Pedido!';
  var options = {
    body: data.body || 'Um novo pedido chegou na FrutaMix',
    icon: '/favicon.jpg',
    badge: '/favicon.jpg',
    tag: 'new-order',
    renotify: true,
    data: {
      url: data.url || '/admin/orders',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  var url = event.notification.data?.url || '/admin/orders';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          if (clientList[i].url.includes('/admin/orders') && 'focus' in clientList[i]) {
            return clientList[i].focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
