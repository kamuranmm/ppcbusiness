// PPC Bildiriş Sistemi — Firebase Cloud Functions
// Layihə: business-iddare-etme-sistemi

const { onValueCreated, onValueUpdated } = require('firebase-functions/v2/database');
const { initializeApp }                  = require('firebase-admin/app');
const { getMessaging }                   = require('firebase-admin/messaging');
const { getDatabase }                    = require('firebase-admin/database');

initializeApp();

// ─────────────────────────────────────────────────────────────────────────────
// 1. YENİ TAPŞIRIQ YARANDIQDA → İşçiyə push bildirişi göndər
// ─────────────────────────────────────────────────────────────────────────────
exports.yeniTapshiriqBildiris = onValueCreated(
  {
    ref:      '/ppcdata/tasks/{taskId}',
    region:   'us-central1',
    database: 'https://business-iddare-etme-sistemi-default-rtdb.firebaseio.com',
  },
  async (event) => {
    const task = event.data.val();
    if (!task || !task.wid || !task.name) return;

    const db = getDatabase();

    // İşçinin FCM token-ini al
    const tokenSnap = await db.ref('fcm_tokens/' + task.wid).once('value');
    const tokenData = tokenSnap.val();
    if (!tokenData?.token) {
      console.log('[FCM] Token tapılmadı. Worker:', task.wid);
      return;
    }

    const priorityLabel =
      task.priority === 'high' ? '🔴 Yüksək' :
      task.priority === 'med'  ? '🟡 Orta'   : '🟢 Aşağı';

    const message = {
      token: tokenData.token,
      notification: {
        title: '📋 Yeni Tapşırıq',
        body:  `${task.name} · ${priorityLabel} · +${task.pts || 0} xal`,
      },
      data: {
        taskId: event.params.taskId,
        url:    'ppc-isci-portal.html',
      },
      android: {
        priority: 'high',
        notification: {
          sound:       'default',
          channelId:   'ppc_tasks',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      webpush: {
        headers:      { Urgency: 'high' },
        notification: {
          icon:    'ppc-icon-192.png',
          badge:   'ppc-badge-72.png',
          vibrate: [200, 100, 200],
          requireInteraction: false,
        },
        fcmOptions: { link: 'ppc-isci-portal.html' },
      },
    };

    try {
      const resp = await getMessaging().send(message);
      console.log('[FCM] Göndərildi. Worker:', task.wid, '| Response:', resp);
    } catch (err) {
      console.error('[FCM] Göndərmə xətası:', err.code, err.message);
      // Token köhnəlibsə — sil
      if (
        err.code === 'messaging/registration-token-not-registered' ||
        err.code === 'messaging/invalid-registration-token'
      ) {
        await db.ref('fcm_tokens/' + task.wid).remove();
        console.log('[FCM] Köhnə token silindi. Worker:', task.wid);
      }
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. TAPŞIRIQ TAMAMLANDIQDA → Adminə push bildirişi göndər
// ─────────────────────────────────────────────────────────────────────────────
exports.tapshiriqTamamlandiBildiris = onValueUpdated(
  {
    ref:      '/ppcdata/tasks/{taskId}',
    region:   'us-central1',
    database: 'https://business-iddare-etme-sistemi-default-rtdb.firebaseio.com',
  },
  async (event) => {
    const before = event.data.before.val();
    const after  = event.data.after.val();

    // Yalnız done false→true olan halda işlə
    if (before?.done === after?.done) return;
    if (!after?.done) return;

    const db = getDatabase();

    // İşçinin adını al
    const workerSnap = await db.ref('ppcdata/workers/' + after.wid).once('value');
    const worker     = workerSnap.val();
    const workerName = worker?.name || after.wid;

    // Admin FCM token-ini al
    const adminTokenSnap = await db.ref('fcm_tokens/admin').once('value');
    const adminToken     = adminTokenSnap.val()?.token;
    if (!adminToken) {
      console.log('[FCM] Admin token tapılmadı');
      return;
    }

    const message = {
      token: adminToken,
      notification: {
        title: '✅ Tapşırıq Tamamlandı',
        body:  `${workerName}: "${after.name}"`,
      },
      data: {
        taskId: event.params.taskId,
        url:    'ppc-idare-sistemi.html',
      },
      android: {
        priority: 'high',
        notification: { sound: 'default' },
      },
      webpush: {
        headers: { Urgency: 'high' },
        notification: {
          icon:  'ppc-icon-192.png',
          badge: 'ppc-badge-72.png',
        },
        fcmOptions: { link: 'ppc-idare-sistemi.html' },
      },
    };

    try {
      const resp = await getMessaging().send(message);
      console.log('[FCM] Admin bildirişi göndərildi:', resp);
    } catch (err) {
      console.error('[FCM] Admin bildiriş xətası:', err.code, err.message);
      if (
        err.code === 'messaging/registration-token-not-registered' ||
        err.code === 'messaging/invalid-registration-token'
      ) {
        await db.ref('fcm_tokens/admin').remove();
      }
    }
  }
);
