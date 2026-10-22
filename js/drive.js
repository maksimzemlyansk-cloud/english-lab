(function () {
  const EL = window.EL;
  let driveToken = null;
  let driveFileId = null;
  try { driveFileId = localStorage.getItem(EL.DRIVE_FILE_KEY) || null; } catch (err) { driveFileId = null; }
  let driveTimer = null;
  let driveBusy = false;

  function setStatus(message) {
    const node = document.querySelector('#drive-status');
    if (node) node.textContent = message;
  }

  function showError(error) {
    console.error(error);
    setStatus('Синхронизация не удалась. Проверь интернет и нажми «Подключить» ещё раз.');
  }

  function requestDriveToken(silent) {
    return new Promise(function (resolve, reject) {
      const start = function () {
        if (!window.google || !google.accounts || !google.accounts.oauth2) {
          reject(new Error('google'));
          return;
        }
        const client = google.accounts.oauth2.initTokenClient({
          client_id: EL.GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.file',
          callback: function (response) {
            if (response.error) { reject(new Error(response.error)); return; }
            driveToken = response.access_token;
            resolve(driveToken);
          }
        });
        client.requestAccessToken(silent ? { prompt: '' } : {});
      };
      if (window.google && google.accounts) { start(); return; }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = start;
      script.onerror = function () { reject(new Error('script')); };
      document.head.appendChild(script);
    });
  }

  async function driveRequest(url, options) {
    const opts = options || {};
    const response = await fetch(url, Object.assign({}, opts, { headers: Object.assign({ Authorization: 'Bearer ' + driveToken }, opts.headers || {}) }));
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail.slice(0, 160));
    }
    return response;
  }

  async function findDriveFile() {
    const q = encodeURIComponent("name='" + EL.DRIVE_FILE_NAME + "' and trashed=false");
    const response = await driveRequest('https://www.googleapis.com/drive/v3/files?q=' + q + '&spaces=drive&fields=files(id,name,modifiedTime)');
    const result = await response.json();
    driveFileId = result.files && result.files[0] ? result.files[0].id : null;
    if (driveFileId) localStorage.setItem(EL.DRIVE_FILE_KEY, driveFileId);
    return driveFileId;
  }

  async function readDriveData() {
    if (!driveFileId) return null;
    const response = await driveRequest('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(driveFileId) + '?alt=media');
    return response.json();
  }

  async function uploadDriveData() {
    if (driveBusy || localStorage.getItem(EL.DRIVE_ENABLED_KEY) !== 'true') return;
    driveBusy = true;
    try {
      if (!driveToken) await requestDriveToken(true);
      if (!driveFileId) await findDriveFile();
      const payload = JSON.stringify({ version: 2, updatedAt: EL.state.data.lastUpdatedAt || new Date().toISOString(), data: EL.forSync(EL.state.data) });
      if (driveFileId) {
        await driveRequest('https://www.googleapis.com/upload/drive/v3/files/' + encodeURIComponent(driveFileId) + '?uploadType=media', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        });
      } else {
        const metadata = { name: EL.DRIVE_FILE_NAME, mimeType: 'application/json' };
        const boundary = 'englishlab_' + Date.now();
        const body = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) + '\r\n--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + payload + '\r\n--' + boundary + '--';
        const response = await driveRequest('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
          method: 'POST',
          headers: { 'Content-Type': 'multipart/related; boundary=' + boundary },
          body: body
        });
        const created = await response.json();
        driveFileId = created.id;
        localStorage.setItem(EL.DRIVE_FILE_KEY, driveFileId);
      }
      setStatus('Синхронизировано · ' + new Date().toLocaleTimeString());
    } finally {
      driveBusy = false;
    }
  }

  function scheduleDrive() {
    if (localStorage.getItem(EL.DRIVE_ENABLED_KEY) !== 'true' || !driveToken && localStorage.getItem(EL.DRIVE_ENABLED_KEY) !== 'true') return;
    clearTimeout(driveTimer);
    driveTimer = setTimeout(function () { uploadDriveData().catch(showError); }, 900);
  }

  async function connectDrive() {
    try {
      setStatus('Подключаю Google Диск…');
      await requestDriveToken(false);
      if (!driveFileId) await findDriveFile();
      if (driveFileId) {
        const remote = await readDriveData();
        const useCloud = window.confirm('На Google Диске уже есть файл English Lab. OK — загрузить его на это устройство. Отмена — записать данные этого устройства в облако.');
        if (useCloud && remote && remote.data) {
          EL.replaceData(remote.data);
          localStorage.setItem(EL.DRIVE_ENABLED_KEY, 'true');
          EL.render();
          setStatus('Данные восстановлены из Google Диска.');
          return;
        }
      }
      localStorage.setItem(EL.DRIVE_ENABLED_KEY, 'true');
      await uploadDriveData();
      EL.render();
      setStatus('Синхронизация включена. Изменения будут сохраняться в один файл на Диске.');
    } catch (error) {
      showError(error);
    }
  }

  async function syncFromDrive() {
    if (localStorage.getItem(EL.DRIVE_ENABLED_KEY) !== 'true') return;
    try {
      await requestDriveToken(true);
      if (!driveFileId) await findDriveFile();
      if (!driveFileId) { await uploadDriveData(); return; }
      const remote = await readDriveData();
      if (!remote || !remote.data) return;
      const remoteTime = Date.parse(remote.updatedAt || '') || 0;
      const localTime = Date.parse(EL.state.data.lastUpdatedAt || '') || 0;
      if (remoteTime > localTime) {
        EL.replaceData(remote.data);
        EL.render();
        setStatus('Облачный прогресс загружен.');
      } else if (localTime > remoteTime) {
        await uploadDriveData();
      } else setStatus('Google Диск синхронизирован.');
    } catch (error) {
      setStatus('Для синхронизации нажми «Подключить Google Диск».');
    }
  }

  window.ELDriveSync = function () {
    if (localStorage.getItem(EL.DRIVE_ENABLED_KEY) === 'true') scheduleDrive();
  };
  EL.connectDrive = connectDrive;
  EL.syncFromDrive = syncFromDrive;
})();
