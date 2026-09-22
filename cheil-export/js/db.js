/**
 * Firebase Realtime Database 헬퍼
 * - CDN compat SDK 사용 (실시간 구독 → 300ms 폴링 제거)
 * - rootPath 로 교회별 네임스페이스 분리
 */
window.JIFC = window.JIFC || {};

JIFC.db = (() => {
  let ready = false;
  let database = null;
  const waiters = [];

  function root() {
    const path = (JIFC.config.firebase.rootPath || "").replace(/^\/|\/$/g, "");
    return path ? database.ref(path) : database.ref();
  }

  function ref(subPath) {
    const clean = String(subPath || "").replace(/^\//, "");
    return clean ? root().child(clean) : root();
  }

  function init() {
    if (ready) return Promise.resolve();
    if (typeof firebase === "undefined") {
      return Promise.reject(new Error("Firebase SDK가 로드되지 않았습니다."));
    }

    const { databaseURL } = JIFC.config.firebase;
    if (!firebase.apps.length) {
      firebase.initializeApp({ databaseURL });
    }
    database = firebase.database();
    ready = true;
    waiters.splice(0).forEach((fn) => fn());
    return Promise.resolve();
  }

  function whenReady() {
    if (ready) return Promise.resolve();
    return new Promise((resolve) => waiters.push(resolve));
  }

  /** 실시간 구독. 반환값: unsubscribe 함수 */
  function onValue(subPath, callback, errorCallback) {
    const r = ref(subPath);
    const handler = (snap) => callback(snap.val());
    r.on("value", handler, errorCallback || (() => {}));
    return () => r.off("value", handler);
  }

  function set(subPath, value) {
    return ref(subPath).set(value);
  }

  function update(subPath, value) {
    return ref(subPath).update(value);
  }

  function get(subPath) {
    return ref(subPath)
      .once("value")
      .then((snap) => snap.val());
  }

  return { init, whenReady, ref, onValue, set, update, get };
})();
