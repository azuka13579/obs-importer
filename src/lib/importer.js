import { FILTERS, MONITOR, isAbs, stripExt } from './rundown.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

function uniqueName(base, used) {
  base = base || 'Tanpa nama';
  let name = base, k = 2;
  while (used.has(name)) name = `${base} (${k++})`;
  used.add(name);
  return name;
}

function joinPath(folder, file) {
  if (isAbs(file)) return file;
  folder = folder.trim().replace(/^"|"$/g, '');
  const sep = folder.includes('\\') ? '\\' : '/';
  return folder.replace(/[\\/]+$/, '') + sep + file.replace(/^[\\/]+/, '');
}

/**
 * Membuat semua scene di OBS sesuai daftar.
 * log(msg, level) dan onProgress(text) dipakai untuk memberi kabar ke tampilan.
 */
export async function runImport({ obs, scenes, folder, options, transitions, log, onProgress }) {
  const { newCollection, collectionName, fit, loop, switchFirst } = options;
  const step = async (promise, failMsg) => {
    try { await promise; return true; } catch (e) { log(`${failMsg}: ${e.message}`, 'warn'); return false; }
  };
  let made = 0, failed = 0, firstScene = null, placeholders = [];

  try {
    if (newCollection) {
      const existing = new Set((await obs.call('GetSceneCollectionList')).sceneCollections);
      const colName = uniqueName(collectionName.trim() || 'Import scene', existing);
      onProgress('Membuat scene collection baru…');
      await obs.call('CreateSceneCollection', { sceneCollectionName: colName });
      await sleep(1200);
      placeholders = (await obs.call('GetSceneList')).scenes.map(s => s.sceneName);
      log(`Scene collection "${colName}" dibuat dan dipakai.`, 'ok');
    }

    const used = new Set();
    (await obs.call('GetSceneList')).scenes.forEach(s => used.add(s.sceneName));
    (await obs.call('GetInputList')).inputs.forEach(i => used.add(i.inputName));

    // Scene bawaan di collection baru diberi nama sementara agar tidak bentrok, lalu dihapus di akhir.
    const planned = new Set(scenes.map(s => s.name.trim()));
    for (let p = 0; p < placeholders.length; p++) {
      if (planned.has(placeholders[p])) {
        const tmp = uniqueName('_hapus_', used);
        if (await step(obs.call('SetSceneName', { sceneName: placeholders[p], newSceneName: tmp }), 'Gagal mengganti nama scene bawaan')) {
          used.delete(placeholders[p]); placeholders[p] = tmp;
        }
      }
    }

    const kinds = (await obs.call('GetInputKindList', { unversioned: false })).inputKinds;
    const textKind = kinds.find(k => k.startsWith('text_gdiplus')) || kinds.find(k => k.startsWith('text_ft2_source'));
    const filterKinds = {};
    try {
      const list = (await obs.call('GetSourceFilterKindList')).sourceFilterKinds || [];
      FILTERS.forEach(f => {
        const m = list.filter(k => k.startsWith(f.prefix)).sort();
        filterKinds[f.id] = m.length ? m[m.length - 1] : f.fallback;
      });
    } catch { FILTERS.forEach(f => { filterKinds[f.id] = f.fallback; }); }
    let canvas = null;
    if (fit) { const v = await obs.call('GetVideoSettings'); canvas = { w: v.baseWidth, h: v.baseHeight }; }

    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      onProgress(`Membuat scene ${i + 1} dari ${scenes.length}…`);
      const sceneName = uniqueName(s.name.trim() || `Scene ${i + 1}`, used);
      try {
        await obs.call('CreateScene', { sceneName });
      } catch (e) { failed++; log(`Gagal membuat scene "${sceneName}": ${e.message}`, 'err'); continue; }
      if (!firstScene) firstScene = sceneName;
      made++;
      if (sceneName !== s.name.trim()) log(`Nama "${s.name}" sudah dipakai, dibuat sebagai "${sceneName}".`, 'warn');

      if (s.transition || s.duration) {
        const data = { sceneName };
        if (s.transition) data.transitionName = s.transition;
        if (s.duration) data.transitionDuration = Math.max(50, Math.min(20000, s.duration));
        if (s.transition && transitions.length && !transitions.includes(s.transition)) {
          log(`Transisi "${s.transition}" untuk "${sceneName}" tidak ada di OBS, dilewati.`, 'warn');
          delete data.transitionName;
        }
        if (data.transitionName || data.transitionDuration) {
          await step(obs.call('SetSceneSceneTransitionOverride', data), `Gagal mengatur transisi "${sceneName}"`);
        }
      }

      for (const src of s.sources) {
        let inputKind, inputSettings, label;
        if (src.type === 'text') {
          if (!textKind) { log(`Source teks di "${sceneName}" dilewati: jenis source teks tidak ditemukan di OBS.`, 'warn'); continue; }
          inputKind = textKind; inputSettings = { text: src.text };
          label = 'Teks - ' + (src.text.length > 24 ? src.text.slice(0, 24) + '…' : src.text);
        } else {
          const path = joinPath(folder, src.file);
          if (src.type === 'image') {
            inputKind = 'image_source'; inputSettings = { file: path }; label = stripExt(src.file) + ' (gambar)';
          } else {
            inputKind = 'ffmpeg_source';
            inputSettings = { local_file: path, is_local_file: true, restart_on_activate: true, looping: src.type === 'video' ? loop : false };
            label = stripExt(src.file) + (src.type === 'audio' ? ' (audio)' : ' (video)');
          }
        }
        const inputName = uniqueName(label, used);
        let r;
        try {
          r = await obs.call('CreateInput', { sceneName, inputName, inputKind, inputSettings, sceneItemEnabled: !src.hidden });
        } catch (e) { failed++; log(`Gagal menambah "${inputName}" ke "${sceneName}": ${e.message}`, 'err'); continue; }

        if (fit && canvas && (src.type === 'video' || src.type === 'image')) {
          await step(obs.call('SetSceneItemTransform', {
            sceneName, sceneItemId: r.sceneItemId,
            sceneItemTransform: {
              positionX: 0, positionY: 0, alignment: 5, boundsType: 'OBS_BOUNDS_SCALE_INNER',
              boundsAlignment: 0, boundsWidth: canvas.w, boundsHeight: canvas.h,
            },
          }), `Gagal menyesuaikan ukuran "${inputName}"`);
        }
        if (src.audio) {
          const a = src.audio;
          if (a.volume !== 0) await step(obs.call('SetInputVolume', { inputName, inputVolumeDb: a.volume }), `Gagal mengatur volume "${inputName}"`);
          if (a.muted) await step(obs.call('SetInputMute', { inputName, inputMuted: true }), `Gagal mute "${inputName}"`);
          if (a.monitor !== 'none') await step(obs.call('SetInputAudioMonitorType', { inputName, monitorType: MONITOR[a.monitor] }), `Gagal mengatur monitoring "${inputName}"`);
          for (const fid of a.filters) {
            const f = FILTERS.find(x => x.id === fid);
            await step(obs.call('CreateSourceFilter', { sourceName: inputName, filterName: f.label, filterKind: filterKinds[fid] }), `Gagal menambah filter ${f.label} ke "${inputName}"`);
          }
        }
      }
      log(`Scene ${i + 1}: "${sceneName}" dibuat${s.sources.length ? ` dengan ${s.sources.length} source` : ''}.`, 'ok');
    }

    if (made && placeholders.length) {
      for (const p of placeholders) {
        try {
          const items = (await obs.call('GetSceneItemList', { sceneName: p })).sceneItems;
          if (!items.length) await obs.call('RemoveScene', { sceneName: p });
        } catch { /* biarkan scene bawaan jika gagal dihapus */ }
      }
    }
    if (switchFirst && firstScene) await step(obs.call('SetCurrentProgramScene', { sceneName: firstScene }), 'Gagal pindah ke scene pertama');
    const done = `Selesai: ${made} scene dibuat${failed ? `, ${failed} gagal` : ''}.`;
    onProgress(done);
    log(done, failed ? 'warn' : 'ok');
  } catch (e) {
    onProgress('Import berhenti.');
    log('Import berhenti: ' + e.message, 'err');
  }
}
